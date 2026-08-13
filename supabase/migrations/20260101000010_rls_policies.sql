-- Row Level Security. Every table with user data is locked down by default;
-- policies below are the only ways in. See spec §25 "A passenger must never
-- be able to..." — each of those guarantees maps to a policy here.

alter table public.profiles enable row level security;
alter table public.driver_declarations enable row level security;
alter table public.legal_documents enable row level security;
alter table public.legal_acceptances enable row level security;
alter table public.app_settings enable row level security;
alter table public.ferry_routes enable row level security;
alter table public.rides enable row level security;
alter table public.ride_route_points enable row level security;
alter table public.bookings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.ratings enable row level security;
alter table public.content_notices enable row level security;
alter table public.admin_actions enable row level security;
alter table public.notifications enable row level security;
alter table public.rate_limit_hits enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------- profiles
-- Full row (incl. last_name/email/phone/dob) only to the owner and admins.
-- Everyone else must use the public_profiles view defined below.
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- No direct INSERT policy: rows are created only by the handle_new_user
-- trigger (SECURITY DEFINER), never directly by a client.

create view public.public_profiles as
select id, public_id, first_name, avatar_url, bio, rating_avg, rating_count,
       completed_rides_count, email_verified, phone_verified, created_at
from public.profiles
where status = 'active';

comment on view public.public_profiles is 'Safe, minimal profile projection for anyone to read — never exposes last_name/email/phone/date_of_birth (spec §6/§23). Views run with the owning role''s rights, so this intentionally reads through profiles RLS.';

grant select on public.public_profiles to anon, authenticated;

-- ---------------------------------------------------------- driver_declarations
create policy driver_declarations_select_own on public.driver_declarations
  for select using (auth.uid() = user_id or public.is_admin());
create policy driver_declarations_insert_own on public.driver_declarations
  for insert with check (auth.uid() = user_id);

-- ------------------------------------------------------------- legal docs
create policy legal_documents_select_published on public.legal_documents
  for select using (published_at is not null or public.is_admin());
create policy legal_documents_admin_write on public.legal_documents
  for all using (public.is_admin()) with check (public.is_admin());

create policy legal_acceptances_select_own on public.legal_acceptances
  for select using (auth.uid() = user_id or public.is_admin());
create policy legal_acceptances_insert_own on public.legal_acceptances
  for insert with check (auth.uid() = user_id);

-- ------------------------------------------------------------- app_settings
create policy app_settings_select_public on public.app_settings
  for select using (is_public = true or public.is_admin());
create policy app_settings_admin_write on public.app_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------- ferry_routes
create policy ferry_routes_select_active on public.ferry_routes
  for select using (active = true or public.is_admin());
create policy ferry_routes_admin_write on public.ferry_routes
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------------- rides
create policy rides_select_public on public.rides
  for select using (
    status in ('PUBLISHED', 'FULL', 'COMPLETED')
    or driver_id = auth.uid()
    or public.is_admin()
  );

create policy rides_insert_own on public.rides
  for insert with check (driver_id = auth.uid());

create policy rides_update_own on public.rides
  for update using (driver_id = auth.uid() or public.is_admin())
  with check (driver_id = auth.uid() or public.is_admin());

-- ------------------------------------------------------------ route points
create policy ride_route_points_select on public.ride_route_points
  for select using (
    exists (
      select 1 from public.rides r
      where r.id = ride_route_points.ride_id
        and (r.status in ('PUBLISHED', 'FULL', 'COMPLETED') or r.driver_id = auth.uid() or public.is_admin())
    )
  );

create policy ride_route_points_write_own on public.ride_route_points
  for all using (
    exists (select 1 from public.rides r where r.id = ride_route_points.ride_id and r.driver_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.rides r where r.id = ride_route_points.ride_id and r.driver_id = auth.uid())
    or public.is_admin()
  );

-- ---------------------------------------------------------------- bookings
-- A passenger sees only their own bookings; a driver sees only bookings on
-- their own rides. Neither can ever see the other's unrelated bookings.
create policy bookings_select_participant on public.bookings
  for select using (
    passenger_id = auth.uid()
    or exists (select 1 from public.rides r where r.id = bookings.ride_id and r.driver_id = auth.uid())
    or public.is_admin()
  );

create policy bookings_insert_own on public.bookings
  for insert with check (passenger_id = auth.uid());

-- State transitions themselves are validated inside the RPCs in
-- 20260101000008_booking_rpcs.sql; this policy just says "a participant may
-- touch this row", not "any transition is valid".
create policy bookings_update_participant on public.bookings
  for update using (
    passenger_id = auth.uid()
    or exists (select 1 from public.rides r where r.id = bookings.ride_id and r.driver_id = auth.uid())
    or public.is_admin()
  );

-- ----------------------------------------------------------- conversations
create policy conversations_select_participant on public.conversations
  for select using (driver_id = auth.uid() or passenger_id = auth.uid());

create policy conversations_insert_participant on public.conversations
  for insert with check (driver_id = auth.uid() or passenger_id = auth.uid());

-- No admin policy here on purpose (spec §16: no general chat browser). See
-- admin_get_notice_messages() below for the narrow, audited exception.

-- --------------------------------------------------------------- messages
create policy messages_select_participant on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.driver_id = auth.uid() or c.passenger_id = auth.uid())
    )
  );

create policy messages_insert_participant on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.driver_id = auth.uid() or c.passenger_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------- ratings
create policy ratings_select_all on public.ratings
  for select using (true);

create policy ratings_insert_own on public.ratings
  for insert with check (
    rater_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      join public.rides r on r.id = b.ride_id
      where b.id = ratings.booking_id
        and b.status = 'COMPLETED'
        and (
          (rater_id = b.passenger_id and ratee_id = r.driver_id)
          or (rater_id = r.driver_id and ratee_id = b.passenger_id)
        )
    )
  );

create policy ratings_admin_hide on public.ratings
  for update using (public.is_admin()) with check (public.is_admin());

-- View that never leaks a hidden comment's text to non-admins.
create view public.public_ratings as
select id, booking_id, rater_id, ratee_id, stars,
       case when comment_hidden then null else comment end as comment,
       comment_hidden, created_at
from public.ratings;

grant select on public.public_ratings to anon, authenticated;

-- --------------------------------------------------------- content_notices
-- Public "Anmeld ulovligt indhold" submission — anyone (incl. anonymous
-- visitors) may file a notice, but only admins can ever read the list back.
create policy content_notices_insert_any on public.content_notices
  for insert with check (reporter_user_id is null or reporter_user_id = auth.uid());

create policy content_notices_admin_manage on public.content_notices
  for select using (public.is_admin());
create policy content_notices_admin_update on public.content_notices
  for update using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------ admin_actions
create policy admin_actions_admin_only on public.admin_actions
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------ notifications
create policy notifications_select_own on public.notifications
  for select using (user_id = auth.uid());
create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
-- No INSERT policy/grant: rows are only ever created via public.notify(),
-- a SECURITY DEFINER function — see 20260101000007_functions_triggers.sql.
-- This is what stops one authenticated user from spamming another user's
-- notification feed directly through the API.

-- ----------------------------------------------------------- rate_limit_hits
-- Written only via the SECURITY DEFINER helper in lib/rateLimit.ts's RPC
-- (public.check_rate_limit, added in 20260101000011). No client policy at all.

-- ---------------------------------------------------------- function grants
grant execute on function public.accept_booking(uuid) to authenticated;
grant execute on function public.reject_booking(uuid) to authenticated;
grant execute on function public.cancel_booking_by_passenger(uuid, text) to authenticated;
grant execute on function public.cancel_ride_by_driver(uuid, text) to authenticated;
grant execute on function public.request_booking(uuid, integer, text) to authenticated;
grant execute on function public.complete_booking(uuid) to authenticated;
grant execute on function public.notify(uuid, text, text, text, text) to authenticated;
grant execute on function public.search_rides_partial_match(
  double precision, double precision, double precision, double precision, date, integer, numeric
) to anon, authenticated;
-- auto_complete_past_rides is called only from the server-side cron route
-- using the service role key, never from the browser — no grant to
-- anon/authenticated on purpose.

-- ------------------------------------------------- admin DSA message access
-- Narrow, audited exception to "no general chat browser": lets an admin read
-- the messages of a conversation ONLY when a content_notices row of type
-- 'message' points at one of its messages, and only after logging the access.
create or replace function public.admin_get_notice_messages(p_notice_id uuid)
returns setof public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notice public.content_notices;
  v_conversation_id uuid;
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  select * into v_notice from public.content_notices where id = p_notice_id;
  if v_notice is null or v_notice.content_type <> 'message' then
    raise exception 'notice_not_found_or_wrong_type';
  end if;

  select conversation_id into v_conversation_id from public.messages where id = v_notice.content_id;
  if v_conversation_id is null then
    raise exception 'message_not_found';
  end if;

  insert into public.admin_actions (admin_id, action_type, target_table, target_id, reason)
  values (auth.uid(), 'view_notice_messages', 'content_notices', p_notice_id, 'DSA notice review');

  return query select * from public.messages where conversation_id = v_conversation_id order by created_at;
end;
$$;

grant execute on function public.admin_get_notice_messages(uuid) to authenticated;
