-- Telefonbekræftelse (SMS) er valgfri indtil videre, fordi der ikke er
-- tilsluttet en SMS-udbyder. Kun en bekræftet e-mail kræves for at booke.
--
-- For at kræve telefon igen: kør en ny migration, der sætter
-- "or v_profile.phone_verified = false" tilbage i betingelsen nedenfor, og
-- sæt REQUIRE_PHONE_VERIFICATION = true i lib/eligibility.ts.

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
