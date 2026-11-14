-- New leads since a given time, for the n8n alert workflow (holds the 'reports' token).
create or replace function public.report_new_leads(p_token text, p_since timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.check_token('reports', p_token);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id, 'at', created_at, 'kind', kind, 'name', name, 'company', company, 'email', email,
      'contact', contact, 'topic', topic, 'prof', prof, 'message', message, 'toolkit', toolkit, 'source', source
    ) order by created_at)
    from public.leads
    where created_at > greatest(p_since, now() - interval '2 days')
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.report_new_leads(text, timestamptz) from public;
grant execute on function public.report_new_leads(text, timestamptz) to anon, authenticated;
