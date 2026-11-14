-- Zentia dashboard: admin access, the leads and bookings pipeline, first-party
-- analytics, a site change log, SEO page audits, Search Console data and the
-- daily / weekly / monthly report digest. Safe to run more than once.

create schema if not exists private;

-- ================================================================ admins
-- A person becomes an admin only when their auth user id is added here
-- (see DASHBOARD.md). Signing up on the dashboard is not enough.
create table if not exists public.admin_users (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  email    text not null,
  added_at timestamptz not null default now()
);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()));
$$;

-- Machines (GitHub Actions, n8n) authenticate with long random tokens.
-- Only their SHA-256 hashes are stored.
create table if not exists private.machine_tokens (
  purpose    text primary key check (purpose in ('ingest', 'reports')),
  token_hash text not null,
  created_at timestamptz not null default now()
);

create or replace function private.check_token(p_purpose text, p_token text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_token is null or char_length(p_token) < 32 or not exists (
    select 1 from private.machine_tokens t
    where t.purpose = p_purpose
      and t.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
  ) then
    raise exception 'invalid token' using errcode = '28000';
  end if;
end;
$$;

-- ================================================================= leads
-- One pipeline for booked calls, Tool Hub consult requests and workshop asks.
alter table public.leads
  add column if not exists kind text not null default 'consult'
    check (kind in ('consult', 'booking', 'workshop')),
  add column if not exists ref uuid unique,
  add column if not exists email text
    check (email is null or (char_length(email) <= 160 and email like '%_@_%')),
  add column if not exists company text check (company is null or char_length(company) <= 160),
  add column if not exists topic text check (topic is null or char_length(topic) <= 40),
  add column if not exists source jsonb not null default '{}'
    check (pg_column_size(source) < 2000),
  add column if not exists status text not null default 'new'
    check (status in ('new', 'contacted', 'booked', 'qualified', 'won', 'lost')),
  add column if not exists notes text check (notes is null or char_length(notes) <= 5000),
  add column if not exists value_ugx bigint check (value_ugx is null or value_ugx >= 0),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_email_idx on public.leads (lower(email));

-- ============================================================== bookings
-- Written only by the Cal.com webhook (edge function, service role).
create table if not exists public.bookings (
  id             bigint generated always as identity primary key,
  uid            text not null unique,
  lead_id        bigint references public.leads (id) on delete set null,
  status         text not null default 'booked'
    check (status in ('booked', 'rescheduled', 'cancelled', 'completed', 'no_show')),
  title          text,
  start_at       timestamptz not null,
  end_at         timestamptz,
  attendee_name  text,
  attendee_email text,
  attendee_tz    text,
  meeting_url    text,
  notes          text,
  payload        jsonb not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists bookings_start_at_idx on public.bookings (start_at);
create index if not exists bookings_lead_id_idx on public.bookings (lead_id);

create or replace function public.ingest_cal_booking(p_event text, p jsonb)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     text := p ->> 'uid';
  v_email   text := lower(coalesce(p -> 'attendees' -> 0 ->> 'email', p -> 'responses' -> 'email' ->> 'value'));
  v_ref     text := p -> 'metadata' ->> 'ref';
  v_old     text := coalesce(p ->> 'rescheduleUid', p ->> 'fromReschedule');
  v_lead    bigint;
  v_id      bigint;
  v_status  text;
begin
  if v_uid is null or (p ->> 'startTime') is null then
    raise exception 'booking payload needs uid and startTime';
  end if;

  if v_ref ~ '^[0-9a-f-]{36}$' then
    select id into v_lead from public.leads where ref = v_ref::uuid;
  end if;
  if v_lead is null and v_email is not null then
    select id into v_lead from public.leads
    where lower(email) = v_email and created_at > now() - interval '14 days'
    order by created_at desc limit 1;
  end if;

  v_status := case p_event
    when 'BOOKING_CANCELLED' then 'cancelled'
    when 'BOOKING_REJECTED'  then 'cancelled'
    when 'MEETING_ENDED'     then 'completed'
    when 'BOOKING_NO_SHOW_UPDATED' then 'no_show'
    else 'booked' end;

  if p_event = 'BOOKING_RESCHEDULED' and v_old is not null then
    update public.bookings set status = 'rescheduled', updated_at = now() where uid = v_old;
    v_lead := coalesce(v_lead, (select lead_id from public.bookings where uid = v_old));
  end if;

  insert into public.bookings as b (
    uid, lead_id, status, title, start_at, end_at, attendee_name, attendee_email,
    attendee_tz, meeting_url, notes, payload)
  values (
    v_uid, v_lead, v_status, p ->> 'title',
    (p ->> 'startTime')::timestamptz, (p ->> 'endTime')::timestamptz,
    coalesce(p -> 'attendees' -> 0 ->> 'name', p -> 'responses' -> 'name' ->> 'value'),
    v_email,
    p -> 'attendees' -> 0 ->> 'timeZone',
    coalesce(p -> 'metadata' ->> 'videoCallUrl', p -> 'videoCallData' ->> 'url', p ->> 'location'),
    coalesce(p ->> 'additionalNotes', p -> 'responses' -> 'notes' ->> 'value'),
    p)
  on conflict (uid) do update set
    status     = excluded.status,
    lead_id    = coalesce(b.lead_id, excluded.lead_id),
    start_at   = excluded.start_at,
    end_at     = excluded.end_at,
    meeting_url = coalesce(excluded.meeting_url, b.meeting_url),
    payload    = excluded.payload,
    updated_at = now()
  returning id into v_id;

  if v_lead is not null and v_status = 'booked' then
    update public.leads set status = 'booked', updated_at = now()
    where id = v_lead and status = 'new';
  end if;
  return v_id;
end;
$$;

-- ============================================================= analytics
-- Cookieless first-party analytics. The site sends a random visitor id kept in
-- localStorage, never an IP address. Country comes from the browser time zone.
create table if not exists public.analytics_events (
  id           bigint generated always as identity primary key,
  at           timestamptz not null default now(),
  type         text not null check (type in ('pageview', 'click', 'leave', 'event')),
  name         text check (name is null or char_length(name) <= 60),
  path         text not null check (char_length(path) between 1 and 300),
  visitor      text not null check (char_length(visitor) between 8 and 40),
  session      text not null check (char_length(session) between 8 and 40),
  referrer     text check (referrer is null or char_length(referrer) <= 200),
  utm_source   text check (utm_source is null or char_length(utm_source) <= 100),
  utm_medium   text check (utm_medium is null or char_length(utm_medium) <= 100),
  utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 100),
  tz           text check (tz is null or char_length(tz) <= 64),
  lang         text check (lang is null or char_length(lang) <= 20),
  device       text check (device is null or device in ('mobile', 'tablet', 'desktop')),
  label        text check (label is null or char_length(label) <= 120),
  href         text check (href is null or char_length(href) <= 300),
  x            real check (x is null or x between 0 and 1),
  y            integer check (y is null or y between 0 and 100000),
  duration_ms  integer check (duration_ms is null or duration_ms between 0 and 86400000),
  scroll       smallint check (scroll is null or scroll between 0 and 100)
);
create index if not exists analytics_events_at_idx on public.analytics_events (at);
create index if not exists analytics_events_type_at_idx on public.analytics_events (type, at);
create index if not exists analytics_events_session_idx on public.analytics_events (session);

create table if not exists public.tz_countries (
  tz           text primary key,
  country_code text not null,
  country      text not null
);

-- ========================================================= site changes
create table if not exists public.site_changes (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  kind       text not null default 'deploy' check (kind in ('deploy', 'content', 'seo', 'campaign', 'note')),
  title      text not null check (char_length(title) between 1 and 300),
  detail     text check (detail is null or char_length(detail) <= 5000),
  commit_sha text check (commit_sha is null or char_length(commit_sha) <= 64),
  author     text check (author is null or char_length(author) <= 120)
);
create index if not exists site_changes_at_idx on public.site_changes (at desc);

-- ============================================================ page audits
create table if not exists public.page_audits (
  id          bigint generated always as identity primary key,
  run_at      timestamptz not null default now(),
  commit_sha  text,
  path        text not null,
  title       text,
  description text,
  h1_count    smallint,
  word_count  integer,
  images      smallint,
  images_no_alt smallint,
  canonical   text,
  issues      text[] not null default '{}'
);
create index if not exists page_audits_run_at_idx on public.page_audits (run_at desc);

-- =========================================================== search console
create table if not exists public.gsc_daily (
  day         date not null,
  query       text not null default '',
  page        text not null default '',
  clicks      integer not null default 0,
  impressions integer not null default 0,
  position    real,
  primary key (day, query, page)
);

-- ========================================================= machine ingest
create or replace function public.ingest_site_change(p_token text, p_change jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.check_token('ingest', p_token);
  insert into public.site_changes (kind, title, detail, commit_sha, author)
  values (
    coalesce(p_change ->> 'kind', 'deploy'),
    left(coalesce(p_change ->> 'title', 'Site update'), 300),
    left(p_change ->> 'detail', 5000),
    left(p_change ->> 'commit_sha', 64),
    left(p_change ->> 'author', 120));
end;
$$;

create or replace function public.ingest_page_audit(p_token text, p_commit text, p_pages jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  perform private.check_token('ingest', p_token);
  insert into public.page_audits (
    commit_sha, path, title, description, h1_count, word_count, images, images_no_alt, canonical, issues)
  select left(p_commit, 64), r.path, r.title, r.description, r.h1_count, r.word_count,
         r.images, r.images_no_alt, r.canonical, coalesce(r.issues, '{}')
  from jsonb_to_recordset(p_pages) as r(
    path text, title text, description text, h1_count smallint, word_count integer,
    images smallint, images_no_alt smallint, canonical text, issues text[]);
  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function public.ingest_search_console(p_token text, p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  perform private.check_token('ingest', p_token);
  insert into public.gsc_daily (day, query, page, clicks, impressions, position)
  select r.day, coalesce(r.query, ''), coalesce(r.page, ''), coalesce(r.clicks, 0),
         coalesce(r.impressions, 0), r.position
  from jsonb_to_recordset(p_rows) as r(
    day date, query text, page text, clicks integer, impressions integer, position real)
  on conflict (day, query, page) do update set
    clicks = excluded.clicks, impressions = excluded.impressions, position = excluded.position;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ============================================================ aggregates
create or replace function private.traffic(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
with e as (
  select * from public.analytics_events where at >= p_from and at < p_to
),
pv as (select * from e where type = 'pageview'),
sess as (
  select session,
         min(visitor) as visitor,
         count(*) filter (where type = 'pageview') as views,
         (array_agg(path order by at) filter (where type = 'pageview'))[1] as entry,
         (array_agg(referrer order by at) filter (where type = 'pageview'))[1] as referrer,
         (array_agg(utm_source order by at) filter (where type = 'pageview'))[1] as utm_source,
         (array_agg(utm_medium order by at) filter (where type = 'pageview'))[1] as utm_medium,
         (array_agg(utm_campaign order by at) filter (where type = 'pageview'))[1] as utm_campaign,
         max(tz) as tz,
         max(device) as device,
         sum(duration_ms) filter (where type = 'leave') as dur,
         bool_or(type = 'event' and name in ('book_details', 'consult_sent', 'workshop_sent')) as converted,
         bool_or(type = 'event' and name = 'whatsapp') as whatsapp
  from e group by session
),
s as (select * from sess where views > 0),
leaves as (
  select path, avg(duration_ms) as dur, avg(scroll) as scroll, count(*) as n
  from e where type = 'leave' group by path
)
select jsonb_build_object(
  'from', p_from,
  'to', p_to,
  'totals', jsonb_build_object(
    'visitors',        (select count(distinct visitor) from pv),
    'sessions',        (select count(*) from s),
    'pageviews',       (select count(*) from pv),
    'bounce_rate',     (select round(100.0 * count(*) filter (where views = 1) / nullif(count(*), 0), 1) from s),
    'avg_session_s',   (select round(avg(dur) / 1000.0) from s where dur is not null),
    'mobile_share',    (select round(100.0 * count(*) filter (where device = 'mobile') / nullif(count(*), 0), 1) from s),
    'conversions',     (select count(*) from s where converted),
    'conversion_rate', (select round(100.0 * count(*) filter (where converted) / nullif(count(*), 0), 2) from s),
    'leads',           (select count(*) from public.leads where created_at >= p_from and created_at < p_to),
    'bookings',        (select count(*) from public.bookings
                        where created_at >= p_from and created_at < p_to and status <> 'cancelled'),
    'book_opens',      (select count(*) from e where type = 'event' and name = 'book_open'),
    'book_details',    (select count(*) from e where type = 'event' and name = 'book_details'),
    'book_done',       (select count(*) from e where type = 'event' and name = 'book_done'),
    'whatsapp_clicks', (select count(*) from e where type = 'event' and name = 'whatsapp'),
    'hub_ratings',     (select count(*) from public.ratings where updated_at >= p_from and updated_at < p_to),
    'hub_suggestions', (select count(*) from public.suggestions where created_at >= p_from and created_at < p_to)
  ),
  'daily', coalesce((
    select jsonb_agg(jsonb_build_object('day', d.day::date, 'visitors', coalesce(x.v, 0), 'pageviews', coalesce(x.p, 0)) order by d.day)
    from generate_series(
           (p_from at time zone 'Africa/Kampala')::date,
           ((p_to - interval '1 second') at time zone 'Africa/Kampala')::date,
           interval '1 day') as d(day)
    left join (
      select (at at time zone 'Africa/Kampala')::date as day, count(distinct visitor) as v, count(*) as p
      from pv group by 1
    ) x on x.day = d.day::date
  ), '[]'::jsonb),
  'pages', coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.views desc) from (
      select pv.path, count(*) as views, count(distinct pv.visitor) as visitors,
             round(max(l.dur) / 1000.0) as avg_time_s, round(max(l.scroll)) as avg_scroll,
             (select count(*) from s where s.entry = pv.path) as entries,
             (select count(*) from s where s.entry = pv.path and s.views = 1) as bounces
      from pv left join leaves l on l.path = pv.path
      group by pv.path order by views desc limit 25
    ) t), '[]'::jsonb),
  'referrers', coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.sessions desc) from (
      select coalesce(nullif(referrer, ''), 'Direct') as source, count(*) as sessions,
             count(*) filter (where converted) as conversions
      from s group by 1 order by sessions desc limit 15
    ) t), '[]'::jsonb),
  'campaigns', coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.sessions desc) from (
      select utm_source as source, coalesce(utm_medium, '') as medium, coalesce(utm_campaign, '') as campaign,
             count(*) as sessions, count(*) filter (where converted) as conversions
      from s where utm_source is not null group by 1, 2, 3 order by sessions desc limit 15
    ) t), '[]'::jsonb),
  'countries', coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.visitors desc) from (
      select coalesce(c.country, 'Unknown') as country, coalesce(c.country_code, '') as code,
             count(distinct s.visitor) as visitors, count(*) filter (where s.converted) as conversions
      from s left join public.tz_countries c on c.tz = s.tz
      group by 1, 2 order by visitors desc limit 20
    ) t), '[]'::jsonb),
  'devices', coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.sessions desc) from (
      select coalesce(device, 'unknown') as device, count(*) as sessions from s group by 1
    ) t), '[]'::jsonb),
  'clicks', coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.clicks desc) from (
      select path, coalesce(label, '') as label, coalesce(href, '') as href, count(*) as clicks
      from e where type = 'click' group by 1, 2, 3 order by clicks desc limit 30
    ) t), '[]'::jsonb),
  'events', coalesce((
    select jsonb_object_agg(name, n) from (
      select name, count(*) as n from e where type = 'event' and name is not null group by name
    ) t), '{}'::jsonb),
  'changes', coalesce((
    select jsonb_agg(jsonb_build_object('at', at, 'kind', kind, 'title', title) order by at)
    from public.site_changes where at >= p_from and at < p_to
  ), '[]'::jsonb)
);
$$;

-- Click positions for one page, for the dashboard's click map.
create or replace function private.click_map(p_path text, p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object('x', x, 'y', y, 'label', label, 'device', device)), '[]'::jsonb)
  from (
    select x, y, label, device from public.analytics_events
    where type = 'click' and path = p_path and at >= p_from and at < p_to and x is not null
    order by at desc limit 3000
  ) t;
$$;

-- ================================================================ digest
-- Rule-based insights. Windows end at 00:00 Kampala time.
create or replace function private.digest(p_period text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  today   timestamptz := date_trunc('day', now() at time zone 'Africa/Kampala') at time zone 'Africa/Kampala';
  f timestamptz; t timestamptz; pf timestamptz; pt timestamptz;
  label   text;
  cur     jsonb; prev jsonb; ct jsonb; pt_ jsonb;
  ins     jsonb := '[]'::jsonb;
  v_cur numeric; v_prev numeric; pct numeric;
  r record;
  n integer;
begin
  if p_period = 'daily' then
    t := today; f := today - interval '1 day'; pt := f; pf := f - interval '1 day';
    label := to_char(f at time zone 'Africa/Kampala', 'FMDay DD Mon YYYY');
  elsif p_period = 'weekly' then
    t := today; f := today - interval '7 days'; pt := f; pf := f - interval '7 days';
    label := to_char(f at time zone 'Africa/Kampala', 'DD Mon') || ' – ' ||
             to_char((t - interval '1 day') at time zone 'Africa/Kampala', 'DD Mon YYYY');
  elsif p_period = 'monthly' then
    t := date_trunc('month', now() at time zone 'Africa/Kampala') at time zone 'Africa/Kampala';
    f := (date_trunc('month', now() at time zone 'Africa/Kampala') - interval '1 month') at time zone 'Africa/Kampala';
    pt := f;
    pf := (date_trunc('month', now() at time zone 'Africa/Kampala') - interval '2 months') at time zone 'Africa/Kampala';
    label := to_char(f at time zone 'Africa/Kampala', 'FMMonth YYYY');
  else
    raise exception 'period must be daily, weekly or monthly';
  end if;

  cur := private.traffic(f, t);
  prev := private.traffic(pf, pt);
  ct := cur -> 'totals';
  pt_ := prev -> 'totals';

  -- 1. visitors
  v_cur := (ct ->> 'visitors')::numeric; v_prev := (pt_ ->> 'visitors')::numeric;
  if v_cur = 0 then
    ins := ins || jsonb_build_object('tone', 'warn', 'text',
      'No visits were recorded. If the site was up, check that the tracker is running.');
  elsif v_prev >= 5 then
    pct := round(100 * (v_cur - v_prev) / v_prev);
    ins := ins || jsonb_build_object(
      'tone', case when pct >= 15 then 'good' when pct <= -15 then 'warn' else 'info' end,
      'text', format('%s visitors, %s%s%% on the previous period (%s).',
                     v_cur, case when pct >= 0 then '+' else '' end, pct, v_prev));
  else
    ins := ins || jsonb_build_object('tone', 'info', 'text', format('%s visitors this period.', v_cur));
  end if;

  -- 2. leads and the booking funnel
  n := (ct ->> 'leads')::int;
  if n > 0 then
    ins := ins || jsonb_build_object('tone', 'good', 'text',
      format('%s new lead%s and %s booked call%s.', n, case when n = 1 then '' else 's' end,
             ct ->> 'bookings', case when (ct ->> 'bookings')::int = 1 then '' else 's' end));
  end if;
  if (ct ->> 'book_opens')::int >= 3 and (ct ->> 'book_details')::int = 0 then
    ins := ins || jsonb_build_object('tone', 'action', 'text',
      format('%s people opened the booking form but none sent their details. Try fewer questions, or make the WhatsApp option more visible inside the form.',
             ct ->> 'book_opens'));
  elsif (ct ->> 'book_details')::int >= 2 and (ct ->> 'book_done')::int < (ct ->> 'book_details')::int then
    ins := ins || jsonb_build_object('tone', 'action', 'text',
      format('%s people sent their details but only %s picked a time. Follow up the others on WhatsApp or email — their details are in Leads.',
             ct ->> 'book_details', ct ->> 'book_done'));
  end if;

  -- 3. best and newest traffic sources
  select x ->> 'source' as source, (x ->> 'sessions')::int as sessions, (x ->> 'conversions')::int as conv
    into r from jsonb_array_elements(cur -> 'referrers') x
    where x ->> 'source' <> 'Direct' order by (x ->> 'sessions')::int desc limit 1;
  if found then
    ins := ins || jsonb_build_object('tone', 'info', 'text',
      format('Top referrer: %s (%s visits%s).', r.source, r.sessions,
             case when r.conv > 0 then format(', %s converted', r.conv) else '' end));
  end if;
  for r in
    select x ->> 'source' as source, (x ->> 'sessions')::int as sessions
    from jsonb_array_elements(cur -> 'referrers') x
    where (x ->> 'sessions')::int >= 3
      and x ->> 'source' <> 'Direct'
      and not exists (select 1 from jsonb_array_elements(prev -> 'referrers') y where y ->> 'source' = x ->> 'source')
    limit 2
  loop
    ins := ins || jsonb_build_object('tone', 'good', 'text',
      format('New traffic source: %s sent %s visits. Worth finding out what was shared there.', r.source, r.sessions));
  end loop;

  -- 4. campaigns that converted
  for r in
    select x ->> 'source' as source, x ->> 'campaign' as campaign, (x ->> 'conversions')::int as conv
    from jsonb_array_elements(cur -> 'campaigns') x where (x ->> 'conversions')::int > 0
    order by (x ->> 'conversions')::int desc limit 2
  loop
    ins := ins || jsonb_build_object('tone', 'good', 'text',
      format('Campaign %s%s produced %s lead%s. Do more of this.', r.source,
             case when r.campaign <> '' then ' / ' || r.campaign else '' end, r.conv,
             case when r.conv = 1 then '' else 's' end));
  end loop;

  -- 5. engagement problems
  if (ct ->> 'sessions')::int >= 20 and (ct ->> 'bounce_rate')::numeric >= 70 then
    select x ->> 'path' as path into r from jsonb_array_elements(cur -> 'pages') x
      order by (x ->> 'bounces')::int desc limit 1;
    ins := ins || jsonb_build_object('tone', 'action', 'text',
      format('%s%% of visits saw only one page. Give visitors a clearer next step on %s, the page most people leave from.',
             ct ->> 'bounce_rate', coalesce(r.path, '/')));
  end if;
  for r in
    select x ->> 'path' as path, (x ->> 'avg_scroll')::numeric as scroll, (x ->> 'views')::int as views
    from jsonb_array_elements(cur -> 'pages') x
    where (x ->> 'views')::int >= 15 and (x ->> 'avg_scroll')::numeric < 35
    order by (x ->> 'views')::int desc limit 1
  loop
    ins := ins || jsonb_build_object('tone', 'action', 'text',
      format('Visitors read only %s%% of %s on average. Move the key message and the booking button higher.',
             r.scroll, r.path));
  end loop;
  if (ct ->> 'sessions')::int >= 20 and (ct ->> 'mobile_share')::numeric >= 65 then
    ins := ins || jsonb_build_object('tone', 'info', 'text',
      format('%s%% of visits were on phones. Check new pages on a phone before publishing.', ct ->> 'mobile_share'));
  end if;

  -- 6. Tool Hub
  if (ct ->> 'hub_ratings')::int > 0 then
    ins := ins || jsonb_build_object('tone', 'info', 'text',
      format('Tool Hub: %s rating%s.', ct ->> 'hub_ratings', case when (ct ->> 'hub_ratings')::int = 1 then '' else 's' end));
  end if;
  select count(*) into n from public.suggestions where status = 'pending';
  if n > 0 then
    ins := ins || jsonb_build_object('tone', 'action', 'text',
      format('%s Tool Hub suggestion%s waiting for review.', n, case when n = 1 then ' is' else 's are' end));
  end if;

  -- 7. SEO health from the latest audit
  select count(*) filter (where cardinality(issues) > 0) as bad, max(run_at) as run_at
    into r from public.page_audits
    where run_at = (select max(run_at) from public.page_audits);
  if r.bad > 0 then
    ins := ins || jsonb_build_object('tone', 'action', 'text',
      format('SEO: %s page%s from the last deploy %s fixable issues. See the SEO page.',
             r.bad, case when r.bad = 1 then '' else 's' end, case when r.bad = 1 then 'has' else 'have' end));
  end if;

  -- 8. Search Console
  select sum(clicks) as clicks, sum(impressions) as impr into r from public.gsc_daily
    where day >= (f at time zone 'Africa/Kampala')::date and day < (t at time zone 'Africa/Kampala')::date;
  if r.impr > 0 then
    ins := ins || jsonb_build_object('tone', 'info', 'text',
      format('Google search: %s clicks from %s impressions.', r.clicks, r.impr));
  end if;

  -- 9. changes shipped
  n := jsonb_array_length(cur -> 'changes');
  if n > 0 then
    ins := ins || jsonb_build_object('tone', 'info', 'text',
      format('%s site change%s shipped: %s.', n, case when n = 1 then '' else 's' end,
             (select string_agg(x ->> 'title', '; ') from (select * from jsonb_array_elements(cur -> 'changes') limit 3) s(x))));
  end if;

  return jsonb_build_object(
    'period', p_period,
    'label', label,
    'from', f,
    'to', t,
    'generated_at', now(),
    'totals', ct,
    'previous', pt_,
    'insights', ins,
    'top_pages', (select coalesce(jsonb_agg(x), '[]') from (select x from jsonb_array_elements(cur -> 'pages') x limit 5) s),
    'top_sources', (select coalesce(jsonb_agg(x), '[]') from (select x from jsonb_array_elements(cur -> 'referrers') x limit 5) s),
    'countries', (select coalesce(jsonb_agg(x), '[]') from (select x from jsonb_array_elements(cur -> 'countries') x limit 5) s),
    'leads', coalesce((
      select jsonb_agg(jsonb_build_object('name', name, 'company', company, 'kind', kind, 'topic', topic,
                                          'contact', contact, 'at', created_at) order by created_at)
      from public.leads where created_at >= f and created_at < t), '[]'),
    'upcoming', coalesce((
      select jsonb_agg(jsonb_build_object('name', attendee_name, 'start_at', start_at, 'meeting_url', meeting_url) order by start_at)
      from public.bookings where status = 'booked' and start_at >= now() and start_at < now() + interval '7 days'), '[]')
  );
end;
$$;

-- ======================================================= public wrappers
create or replace function public.dash_whoami()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object('admin', private.is_admin(), 'user_id', auth.uid());
$$;

create or replace function public.dash_traffic(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  return private.traffic(p_from, p_to);
end;
$$;

create or replace function public.dash_click_map(p_path text, p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  return private.click_map(p_path, p_from, p_to);
end;
$$;

create or replace function public.dash_digest(p_period text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  return private.digest(p_period);
end;
$$;

-- For the n8n report workflow, which holds the 'reports' token.
create or replace function public.report_digest(p_token text, p_period text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.check_token('reports', p_token);
  return private.digest(p_period);
end;
$$;

-- ================================================================== RLS
alter table public.admin_users      enable row level security;
alter table public.bookings         enable row level security;
alter table public.analytics_events enable row level security;
alter table public.tz_countries     enable row level security;
alter table public.site_changes     enable row level security;
alter table public.page_audits      enable row level security;
alter table public.gsc_daily        enable row level security;
alter table private.machine_tokens  enable row level security;

drop policy if exists "Admins read admins" on public.admin_users;
create policy "Admins read admins" on public.admin_users
  for select to authenticated using ((select private.is_admin()));

drop policy if exists "Admins read leads" on public.leads;
create policy "Admins read leads" on public.leads
  for select to authenticated using ((select private.is_admin()));
drop policy if exists "Admins update leads" on public.leads;
create policy "Admins update leads" on public.leads
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- Visitors may also submit bookings and workshop requests (same table).
drop policy if exists "Visitors submit consult requests" on public.leads;
create policy "Visitors submit consult requests" on public.leads
  for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'new' and notes is null and value_ugx is null);

drop policy if exists "Admins read bookings" on public.bookings;
create policy "Admins read bookings" on public.bookings
  for select to authenticated using ((select private.is_admin()));
drop policy if exists "Admins update bookings" on public.bookings;
create policy "Admins update bookings" on public.bookings
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "Admins read suggestions" on public.suggestions;
create policy "Admins read suggestions" on public.suggestions
  for select to authenticated using ((select private.is_admin()));
drop policy if exists "Admins review suggestions" on public.suggestions;
create policy "Admins review suggestions" on public.suggestions
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "Admins read all ratings" on public.ratings;
create policy "Admins read all ratings" on public.ratings
  for select to authenticated using ((select private.is_admin()));

drop policy if exists "Admins read all tools" on public.tools;
create policy "Admins read all tools" on public.tools
  for select to authenticated using ((select private.is_admin()));

drop policy if exists "Anyone records analytics" on public.analytics_events;
create policy "Anyone records analytics" on public.analytics_events
  for insert to anon, authenticated with check (at > now() - interval '1 minute');
drop policy if exists "Admins read analytics" on public.analytics_events;
create policy "Admins read analytics" on public.analytics_events
  for select to authenticated using ((select private.is_admin()));

drop policy if exists "Admins read time zones" on public.tz_countries;
create policy "Admins read time zones" on public.tz_countries
  for select to authenticated using ((select private.is_admin()));

drop policy if exists "Admins manage site changes" on public.site_changes;
create policy "Admins manage site changes" on public.site_changes
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "Admins read page audits" on public.page_audits;
create policy "Admins read page audits" on public.page_audits
  for select to authenticated using ((select private.is_admin()));

drop policy if exists "Admins read search console" on public.gsc_daily;
create policy "Admins read search console" on public.gsc_daily
  for select to authenticated using ((select private.is_admin()));

-- ================================================================ grants
revoke all on public.admin_users, public.bookings, public.analytics_events, public.tz_countries,
              public.site_changes, public.page_audits, public.gsc_daily
  from anon, authenticated;

grant insert (name, contact, prof, message, toolkit, kind, ref, email, company, topic, source)
  on public.leads to authenticated;
grant select, update (status, notes, value_ugx, updated_at) on public.leads to authenticated;
grant select, update (status, notes, updated_at) on public.bookings to authenticated;
grant select, update (status) on public.suggestions to authenticated;
grant select on public.ratings, public.admin_users, public.tz_countries, public.page_audits,
                public.gsc_daily to authenticated;
grant select, insert, update, delete on public.site_changes to authenticated;
grant insert (type, name, path, visitor, session, referrer, utm_source, utm_medium, utm_campaign,
              tz, lang, device, label, href, x, y, duration_ms, scroll)
  on public.analytics_events to anon, authenticated;
grant select on public.analytics_events to authenticated;

revoke all on schema private from anon, authenticated;
grant usage on schema private to authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

revoke all on function public.ingest_cal_booking(text, jsonb) from public, anon, authenticated;
grant execute on function public.ingest_cal_booking(text, jsonb) to service_role;

revoke all on function public.dash_whoami(), public.dash_traffic(timestamptz, timestamptz),
                       public.dash_click_map(text, timestamptz, timestamptz), public.dash_digest(text)
  from public, anon;
grant execute on function public.dash_whoami(), public.dash_traffic(timestamptz, timestamptz),
                          public.dash_click_map(text, timestamptz, timestamptz), public.dash_digest(text)
  to authenticated;

-- Token-protected endpoints for GitHub Actions and n8n.
revoke all on function public.ingest_site_change(text, jsonb), public.ingest_page_audit(text, text, jsonb),
                       public.ingest_search_console(text, jsonb), public.report_digest(text, text)
  from public;
grant execute on function public.ingest_site_change(text, jsonb), public.ingest_page_audit(text, text, jsonb),
                          public.ingest_search_console(text, jsonb), public.report_digest(text, text)
  to anon, authenticated;

-- ============================================================ retention
create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname = 'zentia-analytics-retention';
select cron.schedule('zentia-analytics-retention', '30 21 1 * *',
  $$delete from public.analytics_events where at < now() - interval '18 months'$$);
