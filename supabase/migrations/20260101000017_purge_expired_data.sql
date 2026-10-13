-- Automatisk oprydning, så opbevaringsperioderne i privatlivspolitikken
-- faktisk håndhæves. Kaldes dagligt fra /api/jobs/complete-rides (kun med
-- service role, aldrig fra browseren).
--
-- * Beskeder slettes efter data_retention_messages_days (standard 730 dage).
-- * Rate-limit-rækker (indeholder IP-adresser i bucket_key) slettes efter 1 dag.

create or replace function public.purge_expired_data() returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message_days numeric;
  v_messages integer;
  v_hits integer;
begin
  select coalesce((value #>> '{}')::numeric, 730) into v_message_days
  from public.app_settings where key = 'data_retention_messages_days';
  v_message_days := coalesce(v_message_days, 730);

  delete from public.messages
  where created_at < now() - (v_message_days || ' days')::interval;
  get diagnostics v_messages = row_count;

  delete from public.rate_limit_hits
  where created_at < now() - interval '1 day';
  get diagnostics v_hits = row_count;

  return jsonb_build_object('deleted_messages', v_messages, 'deleted_rate_limit_rows', v_hits);
end;
$$;

revoke all on function public.purge_expired_data() from public, anon, authenticated;
grant execute on function public.purge_expired_data() to service_role;
