-- Booking state-transition RPCs. All use SECURITY INVOKER so RLS still
-- applies to every read/write inside them — the row locking (FOR UPDATE)
-- is what prevents two concurrent accepts from overbooking a ride, not an
-- elevated-privilege bypass. See spec §14/§17 and README "Sikkerhedstest".

create or replace function public.accept_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security invoker
as $$
declare
  v_booking public.bookings;
  v_ride public.rides;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if v_booking is null then
    raise exception 'booking_not_found';
  end if;
  if v_booking.status <> 'PENDING' then
    raise exception 'booking_not_pending';
  end if;

  select * into v_ride from public.rides where id = v_booking.ride_id for update;
  if v_ride.driver_id <> auth.uid() then
    raise exception 'not_authorized';
  end if;
  if v_ride.available_seats < v_booking.seats then
    raise exception 'not_enough_seats';
  end if;

  update public.rides
  set available_seats = available_seats - v_booking.seats,
      status = case when available_seats - v_booking.seats <= 0 then 'FULL' else status end
  where id = v_ride.id;

  update public.bookings
  set status = 'ACCEPTED', responded_at = now()
  where id = p_booking_id
  returning * into v_booking;

  insert into public.conversations (booking_id, driver_id, passenger_id)
  values (p_booking_id, v_ride.driver_id, v_booking.passenger_id)
  on conflict (booking_id) do nothing;

  perform public.notify(
    v_booking.passenger_id,
    'booking_accepted',
    'Din anmodning blev accepteret',
    v_ride.origin_name || ' → ' || v_ride.destination_name,
    '/mine-bookinger'
  );

  return v_booking;
end;
$$;

create or replace function public.reject_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security invoker
as $$
declare
  v_booking public.bookings;
  v_ride public.rides;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if v_booking is null then
    raise exception 'booking_not_found';
  end if;
  if v_booking.status <> 'PENDING' then
    raise exception 'booking_not_pending';
  end if;

  select * into v_ride from public.rides where id = v_booking.ride_id;
  if v_ride.driver_id <> auth.uid() then
    raise exception 'not_authorized';
  end if;

  update public.bookings set status = 'REJECTED', responded_at = now()
  where id = p_booking_id
  returning * into v_booking;

  perform public.notify(
    v_booking.passenger_id,
    'booking_rejected',
    'Din anmodning blev afvist',
    v_ride.origin_name || ' → ' || v_ride.destination_name,
    '/mine-bookinger'
  );

  return v_booking;
end;
$$;

create or replace function public.cancel_booking_by_passenger(p_booking_id uuid, p_reason text default null)
returns public.bookings
language plpgsql
security invoker
as $$
declare
  v_booking public.bookings;
  v_ride public.rides;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if v_booking is null then
    raise exception 'booking_not_found';
  end if;
  if v_booking.passenger_id <> auth.uid() then
    raise exception 'not_authorized';
  end if;
  if v_booking.status not in ('PENDING', 'ACCEPTED') then
    raise exception 'booking_not_cancellable';
  end if;

  select * into v_ride from public.rides where id = v_booking.ride_id for update;

  if v_booking.status = 'ACCEPTED' then
    update public.rides
    set available_seats = least(original_seats, available_seats + v_booking.seats),
        status = case when status = 'FULL' then 'PUBLISHED' else status end
    where id = v_ride.id;
  end if;

  update public.bookings
  set status = 'CANCELLED_BY_PASSENGER', cancellation_reason = p_reason
  where id = p_booking_id
  returning * into v_booking;

  perform public.notify(
    v_ride.driver_id,
    'booking_cancelled',
    'En passager har aflyst',
    v_ride.origin_name || ' → ' || v_ride.destination_name,
    '/mine-ture'
  );

  return v_booking;
end;
$$;

-- Driver cancels the whole ride: cancels every pending/accepted booking and
-- notifies every affected passenger (spec §17).
create or replace function public.cancel_ride_by_driver(p_ride_id uuid, p_reason text default null)
returns public.rides
language plpgsql
security invoker
as $$
declare
  v_ride public.rides;
  v_booking record;
begin
  select * into v_ride from public.rides where id = p_ride_id for update;
  if v_ride is null then
    raise exception 'ride_not_found';
  end if;
  if v_ride.driver_id <> auth.uid() then
    raise exception 'not_authorized';
  end if;
  if v_ride.status in ('CANCELLED', 'COMPLETED') then
    raise exception 'ride_not_cancellable';
  end if;

  for v_booking in
    select * from public.bookings
    where ride_id = p_ride_id and status in ('PENDING', 'ACCEPTED')
    for update
  loop
    update public.bookings
    set status = 'CANCELLED_BY_DRIVER', cancellation_reason = p_reason
    where id = v_booking.id;

    perform public.notify(
      v_booking.passenger_id,
      'ride_cancelled',
      'Turen er aflyst',
      v_ride.origin_name || ' → ' || v_ride.destination_name,
      '/mine-bookinger'
    );
  end loop;

  update public.rides
  set status = 'CANCELLED', cancelled_at = now(), cancelled_reason = p_reason
  where id = p_ride_id
  returning * into v_ride;

  return v_ride;
end;
$$;

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
  if v_profile is null or v_profile.email_verified = false or v_profile.phone_verified = false then
    raise exception 'account_not_verified';
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

-- Called by driver or passenger to confirm a specific booking's trip
-- happened (spec §18). Anyone can also be auto-completed by the scheduled
-- job below once the configured grace period has passed.
create or replace function public.complete_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security invoker
as $$
declare
  v_booking public.bookings;
  v_ride public.rides;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if v_booking is null then
    raise exception 'booking_not_found';
  end if;
  select * into v_ride from public.rides where id = v_booking.ride_id;
  if auth.uid() not in (v_ride.driver_id, v_booking.passenger_id) then
    raise exception 'not_authorized';
  end if;
  if v_booking.status <> 'ACCEPTED' then
    raise exception 'booking_not_completable';
  end if;

  update public.bookings set status = 'COMPLETED', completed_at = now()
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

-- Scheduled job entry point (see app/api/jobs/complete-rides/route.ts, run
-- via external cron hitting it with CRON_SECRET). Not exposed to end users.
-- NOTE: departure_date + departure_time is interpreted in the database
-- session's timezone. Set the Supabase project's timezone to Europe/Copenhagen
-- (Database -> Settings) so "past departure" comparisons match Danish local
-- time — see README "Tidszone".
create or replace function public.auto_complete_past_rides()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grace_hours numeric;
  v_count integer;
begin
  select coalesce((value #>> '{}')::numeric, 24) into v_grace_hours
  from public.app_settings where key = 'auto_complete_grace_hours';
  v_grace_hours := coalesce(v_grace_hours, 24);

  update public.bookings
  set status = 'COMPLETED', completed_at = now()
  where status = 'ACCEPTED'
    and ride_id in (
      select id from public.rides
      where (departure_date + departure_time) < (now() - (v_grace_hours || ' hours')::interval)
    );

  get diagnostics v_count = row_count;

  update public.rides
  set status = 'COMPLETED', completed_at = now()
  where status in ('PUBLISHED', 'FULL')
    and (departure_date + departure_time) < (now() - (v_grace_hours || ' hours')::interval);

  return v_count;
end;
$$;
