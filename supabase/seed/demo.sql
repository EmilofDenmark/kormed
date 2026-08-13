-- =============================================================================
-- DEMO / DEVELOPMENT SEED DATA — fictional people and trips only.
--
-- DO NOT run this against a production database. It creates real, working
-- login accounts (password: "kormed-demo-1234" for every demo user) purely
-- so a new developer or the site owner can click through every flow without
-- manually registering ten accounts. See README "Demo-data".
--
-- Run manually, e.g.: supabase db execute -f supabase/seed/demo.sql
-- (never wired into migrations, so it never runs automatically).
-- =============================================================================

do $$
declare
  v_password text := crypt('kormed-demo-1234', gen_salt('bf'));
  v_instance uuid := '00000000-0000-0000-0000-000000000000';

  v_mads uuid := 'a0000000-0000-4000-8000-000000000001';
  v_anna uuid := 'a0000000-0000-4000-8000-000000000002';
  v_sofie uuid := 'a0000000-0000-4000-8000-000000000003';
  v_jonas uuid := 'a0000000-0000-4000-8000-000000000004';
  v_emil uuid := 'a0000000-0000-4000-8000-000000000005';

  v_ride_cph_aarhus uuid := 'b0000000-0000-4000-8000-000000000001';
  v_ride_odense_cph uuid := 'b0000000-0000-4000-8000-000000000002';
  v_ride_cph_aalborg uuid := 'b0000000-0000-4000-8000-000000000003';
begin
  -- ---------------------------------------------------------------- users
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, phone, phone_confirmed_at, confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (v_instance, v_mads, 'authenticated', 'authenticated', 'mads@demo.kormed.local', v_password,
      now(), '+4520000001', now(), now(), '{"provider":"email","providers":["email"]}',
      '{"first_name":"Mads","last_name":"Nielsen","date_of_birth":"1990-03-14","phone":"+4520000001"}', now(), now()),
    (v_instance, v_anna, 'authenticated', 'authenticated', 'anna@demo.kormed.local', v_password,
      now(), '+4520000002', now(), now(), '{"provider":"email","providers":["email"]}',
      '{"first_name":"Anna","last_name":"Larsen","date_of_birth":"1995-07-22","phone":"+4520000002"}', now(), now()),
    (v_instance, v_sofie, 'authenticated', 'authenticated', 'sofie@demo.kormed.local', v_password,
      now(), '+4520000003', now(), now(), '{"provider":"email","providers":["email"]}',
      '{"first_name":"Sofie","last_name":"Hansen","date_of_birth":"1988-11-02","phone":"+4520000003"}', now(), now()),
    (v_instance, v_jonas, 'authenticated', 'authenticated', 'jonas@demo.kormed.local', v_password,
      now(), '+4520000004', now(), now(), '{"provider":"email","providers":["email"]}',
      '{"first_name":"Jonas","last_name":"Pedersen","date_of_birth":"1999-01-30","phone":"+4520000004"}', now(), now()),
    (v_instance, v_emil, 'authenticated', 'authenticated', 'emil@demo.kormed.local', v_password,
      now(), '+4520000005', now(), now(), '{"provider":"email","providers":["email"]}',
      '{"first_name":"Emil","last_name":"Christensen","date_of_birth":"1992-05-18","phone":"+4520000005"}', now(), now())
  on conflict (id) do nothing;

  -- Give demo drivers a bit of rating/trip history and accept the current
  -- driver declaration, so the UI looks lived-in immediately.
  update public.profiles set rating_avg = 4.9, rating_count = 23, completed_rides_count = 23 where id = v_emil;
  update public.profiles set rating_avg = 4.7, rating_count = 11, completed_rides_count = 12 where id = v_mads;
  update public.profiles set rating_avg = 5.0, rating_count = 4, completed_rides_count = 4 where id = v_sofie;

  insert into public.driver_declarations (user_id, declaration_version)
  values (v_mads, 1), (v_sofie, 1), (v_emil, 1)
  on conflict do nothing;

  -- ---------------------------------------------------------------- rides
  -- København -> Aarhus via Odden, driven by Emil. Route points roughly
  -- trace the real road corridor (not a live-routed polyline — fine for
  -- exercising partial-match search in development).
  insert into public.rides (
    id, driver_id, origin_name, origin_lat, origin_lng, destination_name, destination_lat, destination_lng,
    departure_date, departure_time, time_flexibility, distance_km, duration_minutes,
    uses_ferry, ferry_route_id, ferry_departure_time,
    available_seats, original_seats, luggage_option, pets_option, smoking, comment,
    direct_cost_estimate, seat_price, status
  )
  select
    v_ride_cph_aarhus, v_emil, 'København', 55.6761, 12.5683, 'Aarhus', 56.1629, 10.2039,
    (current_date + 9), '15:30', 'plus_minus_30', 187.0, 195,
    true, fr.id, '16:45',
    2, 3, 'almindelig', 'efter_aftale', false,
    'Jeg kan samle op omkring Sydhavnen eller tæt på motorvejen. Kører direkte efter færgen.',
    375, 125, 'PUBLISHED'
  from public.ferry_routes fr where fr.departure_port = 'Odden' and fr.arrival_port = 'Aarhus' limit 1
  on conflict (id) do nothing;

  insert into public.ride_route_points (ride_id, sequence, point, distance_from_origin_km) values
    (v_ride_cph_aarhus, 0, 'SRID=4326;POINT(12.5683 55.6761)', 0),
    (v_ride_cph_aarhus, 1, 'SRID=4326;POINT(12.0803 55.6415)', 32),
    (v_ride_cph_aarhus, 2, 'SRID=4326;POINT(11.5000 55.6500)', 70),
    (v_ride_cph_aarhus, 3, 'SRID=4326;POINT(11.0000 55.9700)', 115),
    (v_ride_cph_aarhus, 4, 'SRID=4326;POINT(10.2039 56.1629)', 187)
  on conflict do nothing;

  -- Odense -> København, driven by Mads.
  insert into public.rides (
    id, driver_id, origin_name, origin_lat, origin_lng, destination_name, destination_lat, destination_lng,
    departure_date, departure_time, time_flexibility,
    distance_km, duration_minutes, uses_ferry,
    available_seats, original_seats, luggage_option, pets_option, smoking,
    direct_cost_estimate, seat_price, status
  ) values (
    v_ride_odense_cph, v_mads, 'Odense', 55.4038, 10.4024, 'København', 55.6761, 12.5683,
    (current_date + 3), '07:45', 'exact',
    166.0, 105, false,
    3, 3, 'stor', 'ja', false,
    290, 95, 'PUBLISHED'
  ) on conflict (id) do nothing;

  insert into public.ride_route_points (ride_id, sequence, point, distance_from_origin_km) values
    (v_ride_odense_cph, 0, 'SRID=4326;POINT(10.4024 55.4038)', 0),
    (v_ride_odense_cph, 1, 'SRID=4326;POINT(11.2000 55.5000)', 55),
    (v_ride_odense_cph, 2, 'SRID=4326;POINT(12.0803 55.6415)', 130),
    (v_ride_odense_cph, 3, 'SRID=4326;POINT(12.5683 55.6761)', 166)
  on conflict do nothing;

  -- København -> Aalborg, driven by Sofie, fully booked.
  insert into public.rides (
    id, driver_id, origin_name, origin_lat, origin_lng, destination_name, destination_lat, destination_lng,
    departure_date, departure_time, time_flexibility,
    distance_km, duration_minutes, uses_ferry,
    available_seats, original_seats, luggage_option, pets_option, smoking,
    direct_cost_estimate, seat_price, status
  ) values (
    v_ride_cph_aalborg, v_sofie, 'København', 55.6761, 12.5683, 'Aalborg', 57.0488, 9.9217,
    (current_date + 6), '12:00', 'flexible',
    295.0, 200, false,
    0, 2, 'lille', 'nej', false,
    520, 130, 'FULL'
  ) on conflict (id) do nothing;

  insert into public.ride_route_points (ride_id, sequence, point, distance_from_origin_km) values
    (v_ride_cph_aalborg, 0, 'SRID=4326;POINT(12.5683 55.6761)', 0),
    (v_ride_cph_aalborg, 1, 'SRID=4326;POINT(11.5000 56.2000)', 90),
    (v_ride_cph_aalborg, 2, 'SRID=4326;POINT(10.2039 56.1629)', 187),
    (v_ride_cph_aalborg, 3, 'SRID=4326;POINT(9.9217 57.0488)', 295)
  on conflict do nothing;

  -- ------------------------------------------------------------ bookings
  -- Anna has requested a seat on Emil's Cph->Aarhus trip (pending).
  insert into public.bookings (ride_id, passenger_id, seats, message, status)
  values (v_ride_cph_aarhus, v_anna, 1, 'Kan du samle mig op ved Sydhavnen?', 'PENDING')
  on conflict do nothing;

  -- Jonas has an accepted booking + open conversation on the Odense trip.
  insert into public.bookings (id, ride_id, passenger_id, seats, status, responded_at)
  values ('c0000000-0000-4000-8000-000000000001', v_ride_odense_cph, v_jonas, 1, 'ACCEPTED', now())
  on conflict (id) do nothing;

  insert into public.conversations (booking_id, driver_id, passenger_id)
  values ('c0000000-0000-4000-8000-000000000001', v_mads, v_jonas)
  on conflict do nothing;

  insert into public.messages (conversation_id, sender_id, body)
  select c.id, v_jonas, 'Hej! Glæder mig til turen. Kan vi mødes ved banegården?'
  from public.conversations c where c.booking_id = 'c0000000-0000-4000-8000-000000000001'
  on conflict do nothing;
end $$;
