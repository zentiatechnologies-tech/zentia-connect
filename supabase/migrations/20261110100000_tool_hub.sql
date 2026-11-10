-- Zentia Tool Hub: tables, security rules and the nightly best-picks job.
-- Safe to run more than once.

create schema if not exists private;

-- ---------------------------------------------------------------- tools
create table if not exists public.tools (
  id         text primary key,
  name       text not null,
  maker      text not null,
  url        text not null,
  cat        text not null,
  price      text not null check (price in ('free', 'freemium', 'paid')),
  level      smallint not null check (level between 1 and 3),
  goals      text[] not null default '{}',
  prof       text[] not null default '{}',
  trusted    boolean not null default false,
  editor     numeric(2, 1) not null check (editor between 1 and 5),
  blurb      text not null,
  steps      jsonb not null default '[]',
  uses       jsonb not null default '{}',
  africa     text,
  yt         text,
  ch         text,
  learn      jsonb,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------- ratings
-- One rating per visitor per tool. Visitors are silent anonymous users.
create table if not exists public.ratings (
  tool_id    text not null references public.tools (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  stars      smallint not null check (stars between 1 and 5),
  prof       text check (prof is null or char_length(prof) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tool_id, user_id)
);
create index if not exists ratings_user_id_idx on public.ratings (user_id);

-- Public totals per tool and profession. Individual ratings stay private;
-- the page only ever reads these sums.
create table if not exists public.rating_stats (
  tool_id text not null references public.tools (id) on delete cascade,
  prof    text not null default '',
  votes   integer not null default 0,
  total   integer not null default 0,
  primary key (tool_id, prof)
);

create or replace function private.sync_rating_stats()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.rating_stats
       set votes = votes - 1, total = total - old.stars
     where tool_id = old.tool_id and prof = coalesce(old.prof, '');
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    insert into public.rating_stats (tool_id, prof, votes, total)
    values (new.tool_id, coalesce(new.prof, ''), 1, new.stars)
    on conflict (tool_id, prof)
    do update set votes = public.rating_stats.votes + 1,
                  total = public.rating_stats.total + excluded.total;
  end if;
  return null;
end;
$$;

drop trigger if exists ratings_sync_stats on public.ratings;
create trigger ratings_sync_stats
after insert or update or delete on public.ratings
for each row execute function private.sync_rating_stats();

-- ---------------------------------------------------------- suggestions
create table if not exists public.suggestions (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tool_name  text not null check (char_length(tool_name) between 2 and 120),
  url        text check (url is null or char_length(url) <= 300),
  note       text check (note is null or char_length(note) <= 1000),
  prof       text check (prof is null or char_length(prof) <= 40),
  status     text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);
create index if not exists suggestions_user_id_idx on public.suggestions (user_id);

-- ---------------------------------------------------------------- leads
-- Consult requests. Visitors can submit; only the dashboard can read.
create table if not exists public.leads (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 2 and 120),
  contact    text not null check (char_length(contact) between 5 and 160),
  prof       text check (prof is null or char_length(prof) <= 40),
  message    text check (message is null or char_length(message) <= 1500),
  toolkit    text[] not null default '{}' check (cardinality(toolkit) <= 12),
  created_at timestamptz not null default now()
);
create index if not exists leads_user_id_idx on public.leads (user_id);

-- ---------------------------------------------------------- daily picks
create table if not exists public.daily_picks (
  prof         text not null,
  rank         smallint not null,
  tool_id      text not null references public.tools (id) on delete cascade,
  score        numeric(4, 2) not null,
  refreshed_at timestamptz not null default now(),
  primary key (prof, rank)
);
create index if not exists daily_picks_tool_id_idx on public.daily_picks (tool_id);

-- Score = Zentia's editor score, pulled up or down by community ratings
-- (ratings from the same profession count double), then +0.2 for tools built
-- for the profession and -0.2 for general-purpose ones.
create or replace function private.refresh_daily_picks()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  profs constant text[] := array[
    'retail', 'hospitality', 'agri', 'services', 'office', 'sales', 'education',
    'ngo', 'health', 'realestate', 'logistics', 'creative', 'tech'];
  p text;
begin
  delete from public.daily_picks where true;
  foreach p in array profs loop
    insert into public.daily_picks (prof, rank, tool_id, score)
    select p, row_number() over (order by s.score desc, s.general, s.name), s.id, s.score
    from (
      select t.id, t.name,
             ('all' = any (t.prof)) as general,
             round((
               (t.editor * 5
                 + coalesce(sum(r.total * case when r.prof = p then 2 else 1 end), 0))
               / (5 + coalesce(sum(r.votes * case when r.prof = p then 2 else 1 end), 0))
               + case when 'all' = any (t.prof) then -0.2 else 0.2 end
             )::numeric, 2) as score
      from public.tools t
      left join public.rating_stats r on r.tool_id = t.id
      where t.active and (p = any (t.prof) or 'all' = any (t.prof))
      group by t.id
    ) s
    order by s.score desc, s.general, s.name
    limit 5;
  end loop;
end;
$$;

-- --------------------------------------------------- row-level security
alter table public.tools        enable row level security;
alter table public.ratings      enable row level security;
alter table public.rating_stats enable row level security;
alter table public.suggestions  enable row level security;
alter table public.leads        enable row level security;
alter table public.daily_picks  enable row level security;

drop policy if exists "Anyone can read active tools" on public.tools;
create policy "Anyone can read active tools" on public.tools
  for select to anon, authenticated using (active);

drop policy if exists "Anyone can read rating totals" on public.rating_stats;
create policy "Anyone can read rating totals" on public.rating_stats
  for select to anon, authenticated using (true);

drop policy if exists "Anyone can read daily picks" on public.daily_picks;
create policy "Anyone can read daily picks" on public.daily_picks
  for select to anon, authenticated using (true);

drop policy if exists "Visitors read their own ratings" on public.ratings;
create policy "Visitors read their own ratings" on public.ratings
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Visitors add their own ratings" on public.ratings;
create policy "Visitors add their own ratings" on public.ratings
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Visitors change their own ratings" on public.ratings;
create policy "Visitors change their own ratings" on public.ratings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Visitors submit suggestions" on public.suggestions;
create policy "Visitors submit suggestions" on public.suggestions
  for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'pending');

drop policy if exists "Visitors submit consult requests" on public.leads;
create policy "Visitors submit consult requests" on public.leads
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- Table access for the website. Leads and suggestions are write-only.
revoke all on public.tools, public.ratings, public.rating_stats,
              public.suggestions, public.leads, public.daily_picks
  from anon, authenticated;
grant select on public.tools, public.rating_stats, public.daily_picks to anon, authenticated;
grant select, insert, update (tool_id, stars, prof, updated_at) on public.ratings to authenticated;
grant insert (tool_name, url, note, prof) on public.suggestions to authenticated;
grant insert (name, contact, prof, message, toolkit) on public.leads to authenticated;

revoke all on schema private from anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;

-- ------------------------------------------------ nightly refresh, 00:00 EAT
create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname = 'zentia-daily-picks';
select cron.schedule('zentia-daily-picks', '0 21 * * *', 'select private.refresh_daily_picks()');
