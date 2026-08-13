-- Simple DB-backed fixed-window rate limiter (spec §16/§25). Avoids adding a
-- Redis dependency for a single-instance MVP; see lib/rateLimit.ts for the
-- TypeScript wrapper used by server actions (chat messages, DSA notices,
-- booking requests, signup attempts).

create or replace function public.check_rate_limit(
  p_bucket_key text, p_max_hits integer, p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  delete from public.rate_limit_hits
  where bucket_key = p_bucket_key
    and created_at < now() - (p_window_seconds || ' seconds')::interval;

  select count(*) into v_count from public.rate_limit_hits where bucket_key = p_bucket_key;

  if v_count >= p_max_hits then
    return false;
  end if;

  insert into public.rate_limit_hits (bucket_key) values (p_bucket_key);
  return true;
end;
$$;

grant execute on function public.check_rate_limit(text, integer, integer) to anon, authenticated;
