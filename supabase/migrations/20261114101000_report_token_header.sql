-- Let n8n send the reports token in an "x-zentia-token" header (kept in an n8n
-- credential) instead of the request body.
create or replace function private.request_token(p_token text)
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(p_token, (nullif(current_setting('request.headers', true), '')::json) ->> 'x-zentia-token');
$$;

create or replace function public.report_digest(p_token text default null, p_period text default 'daily')
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.check_token('reports', private.request_token(p_token));
  return private.digest(p_period);
end;
$$;

create or replace function public.report_new_leads(p_token text default null, p_since timestamptz default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.check_token('reports', private.request_token(p_token));
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id, 'at', created_at, 'kind', kind, 'name', name, 'company', company, 'email', email,
      'contact', contact, 'topic', topic, 'prof', prof, 'message', message, 'toolkit', toolkit, 'source', source
    ) order by created_at)
    from public.leads
    where created_at > greatest(coalesce(p_since, now() - interval '15 minutes'), now() - interval '2 days')
  ), '[]'::jsonb);
end;
$$;

revoke all on function private.request_token(text) from public, anon, authenticated;
revoke all on function public.report_digest(text, text), public.report_new_leads(text, timestamptz) from public;
grant execute on function public.report_digest(text, text), public.report_new_leads(text, timestamptz) to anon, authenticated;
