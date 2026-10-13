-- Sikkerhedshærdning + håndhævelse af udelukkelse.
--
-- 1) KRITISK: profiles_update_own lod en logget ind bruger opdatere ALLE
--    kolonner på sin egen række — også role ('admin'), status, verificerings-
--    flag og rating. Alle med en konto kunne dermed gøre sig selv til admin
--    via den offentlige Supabase-API. Denne trigger blokerer ændringer af
--    beskyttede kolonner, medmindre ændringen kommer fra en admin, fra
--    service-role/SQL-editoren (auth.uid() er null) eller fra en anden
--    trigger/funktion (fx rating- og verificeringssync).
--
-- 2) Udelukkede brugere (status <> 'active') må ikke oprette ture, bookinger
--    eller beskeder. (Selve login blokeres desuden via Supabase Auth ban,
--    se lib/actions/admin.ts; reglerne her dækker de op til en time, et
--    allerede udstedt login-token stadig er gyldigt.)

create or replace function public.protect_profile_columns() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Systemopdateringer, service role/SQL-editor og admins er tilladt.
  if pg_trigger_depth() > 1 or auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.public_id is distinct from old.public_id
     or new.role is distinct from old.role
     or new.email_verified is distinct from old.email_verified
     or new.phone_verified is distinct from old.phone_verified
     or new.rating_avg is distinct from old.rating_avg
     or new.rating_count is distinct from old.rating_count
     or new.completed_rides_count is distinct from old.completed_rides_count
     or new.suspended_reason is distinct from old.suspended_reason
     or new.date_of_birth is distinct from old.date_of_birth
     or new.created_at is distinct from old.created_at
  then
    raise exception 'forbidden_profile_change';
  end if;

  -- En bruger må kun selv ændre status ved at slette sin egen konto.
  if new.status is distinct from old.status
     and not (old.status = 'active' and new.status = 'deleted')
  then
    raise exception 'forbidden_profile_change';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_columns on public.profiles;
create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ---------------------------------------------------------------------------
-- Udelukkede brugere
-- ---------------------------------------------------------------------------
create or replace function public.is_active_user() returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and status = 'active');
$$;

grant execute on function public.is_active_user() to authenticated;

drop policy if exists rides_insert_own on public.rides;
create policy rides_insert_own on public.rides
  for insert with check (driver_id = auth.uid() and public.is_active_user());

drop policy if exists bookings_insert_own on public.bookings;
create policy bookings_insert_own on public.bookings
  for insert with check (passenger_id = auth.uid() and public.is_active_user());

drop policy if exists messages_insert_participant on public.messages;
create policy messages_insert_participant on public.messages
  for insert with check (
    sender_id = auth.uid()
    and public.is_active_user()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.driver_id = auth.uid() or c.passenger_id = auth.uid())
    )
  );

-- request_booking: afvis udelukkede brugere (bygger på version 15).
create or replace function public.request_booking(p_ride_id uuid, p_seats integer, p_message text default null)
returns public.bookings
language plpgsql
security invoker
as $$
declare
  v_ride public.rides;
  v_profile public.profiles;
  v_booking public.bookings;
begin
  select * into v_ride from public.rides where id = p_ride_id;
  if v_ride is null or v_ride.status <> 'PUBLISHED' then
    raise exception 'ride_not_bookable';
  end if;
  if v_ride.driver_id = auth.uid() then
    raise exception 'cannot_book_own_ride';
  end if;
  if p_seats < 1 or p_seats > v_ride.available_seats then
    raise exception 'not_enough_seats';
  end if;

  select * into v_profile from public.profiles where id = auth.uid();
  if v_profile is null or v_profile.email_verified = false then
    raise exception 'account_not_verified';
  end if;
  if v_profile.status <> 'active' then
    raise exception 'account_suspended';
  end if;

  insert into public.bookings (ride_id, passenger_id, seats, message)
  values (p_ride_id, auth.uid(), p_seats, p_message)
  returning * into v_booking;

  perform public.notify(
    v_ride.driver_id,
    'booking_requested',
    v_profile.first_name || ' vil gerne med på din tur',
    v_ride.origin_name || ' → ' || v_ride.destination_name,
    '/mine-ture'
  );

  return v_booking;
end;
$$;
