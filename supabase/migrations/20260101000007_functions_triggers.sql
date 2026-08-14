-- Core triggers: new-user provisioning, age gate, verification flag sync,
-- updated_at maintenance, rating aggregation.

-- Uses gen_random_uuid() (built into Postgres core since v13, no extension
-- needed) rather than pgcrypto's gen_random_bytes(). handle_new_user() below
-- runs as SECURITY DEFINER with search_path pinned to just "public" (a
-- deliberate hardening against search_path-hijacking attacks), and on
-- Supabase, extension functions like pgcrypto's live in a separate
-- "extensions" schema — unqualified calls to them fail with "function ...
-- does not exist" under a locked-down search_path. Avoiding the extension
-- entirely sidesteps that class of bug rather than schema-qualifying it.
create or replace function public.generate_public_id() returns text
language sql
volatile
as $$
  select substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
$$;

-- Runs after Supabase Auth creates a row in auth.users. Expects first_name,
-- last_name, date_of_birth (YYYY-MM-DD) and optional phone in the signup
-- call's user_metadata (see app/(auth)/tilmeld/actions.ts). Also enforces the
-- 18+ minimum age server-side as defense in depth — the signup form/server
-- action already rejects underage sign-ups before this ever runs.
create or replace function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dob date;
  v_public_id text;
begin
  v_dob := (new.raw_user_meta_data ->> 'date_of_birth')::date;

  if v_dob is null then
    raise exception 'signup_missing_date_of_birth';
  end if;

  if v_dob > (current_date - interval '18 years')::date then
    raise exception 'signup_underage';
  end if;

  loop
    v_public_id := public.generate_public_id();
    exit when not exists (select 1 from public.profiles where public_id = v_public_id);
  end loop;

  insert into public.profiles (
    id, public_id, first_name, last_name, email, phone, date_of_birth,
    email_verified, phone_verified
  ) values (
    new.id,
    v_public_id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    v_dob,
    new.email_confirmed_at is not null,
    new.phone_confirmed_at is not null
  );

  -- The signup form requires ticking both boxes before submitting (client +
  -- server validated in lib/validation/auth.ts) and passes the exact
  -- document versions shown to the user at that moment as metadata. Recorded
  -- here, inside the trigger, because no session/auth.uid() exists yet for a
  -- direct insert from the server action when email confirmation is pending.
  if (new.raw_user_meta_data ->> 'terms_version') is not null then
    insert into public.legal_acceptances (user_id, document_type, version)
    values (new.id, 'terms', (new.raw_user_meta_data ->> 'terms_version')::integer);
  end if;
  if (new.raw_user_meta_data ->> 'privacy_version') is not null then
    insert into public.legal_acceptances (user_id, document_type, version)
    values (new.id, 'privacy', (new.raw_user_meta_data ->> 'privacy_version')::integer);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keeps profiles.email_verified / phone_verified in sync as Supabase Auth
-- confirms them, so RLS/UI checks never need to touch the auth schema.
create or replace function public.sync_verification_flags() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email_verified = new.email_confirmed_at is not null,
      phone_verified = new.phone_confirmed_at is not null,
      email = new.email
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_verified
  after update of email_confirmed_at, phone_confirmed_at, email on auth.users
  for each row execute function public.sync_verification_flags();

create or replace function public.touch_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger rides_touch_updated_at before update on public.rides
  for each row execute function public.touch_updated_at();
create trigger bookings_touch_updated_at before update on public.bookings
  for each row execute function public.touch_updated_at();
create trigger ferry_routes_touch_updated_at before update on public.ferry_routes
  for each row execute function public.touch_updated_at();
create trigger content_notices_touch_updated_at before update on public.content_notices
  for each row execute function public.touch_updated_at();

-- Recomputes the ratee's public rating_avg/rating_count whenever a rating is
-- added. Ratings can't be edited/deleted by users in the MVP, so INSERT-only.
create or replace function public.apply_rating_to_profile() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set rating_count = rating_count + 1,
      rating_avg = round(
        (((rating_avg * rating_count) + new.stars) / (rating_count + 1))::numeric, 1
      )
  where id = new.ratee_id;
  return new;
end;
$$;

create trigger ratings_apply_to_profile
  after insert on public.ratings
  for each row execute function public.apply_rating_to_profile();

-- Increments completed_rides_count: once per completed booking for the
-- passenger, once per ride (not per booking) for the driver.
create or replace function public.apply_booking_completion() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ride public.rides;
begin
  if new.status = 'COMPLETED' and old.status is distinct from 'COMPLETED' then
    update public.profiles set completed_rides_count = completed_rides_count + 1
      where id = new.passenger_id;

    select * into v_ride from public.rides where id = new.ride_id for update;
    if v_ride.driver_completed_credited = false then
      update public.profiles set completed_rides_count = completed_rides_count + 1
        where id = v_ride.driver_id;
      update public.rides set driver_completed_credited = true where id = v_ride.id;
    end if;
  end if;
  return new;
end;
$$;

create trigger bookings_apply_completion
  after update of status on public.bookings
  for each row execute function public.apply_booking_completion();

-- Notifications are never insertable directly by clients (see RLS migration —
-- no INSERT policy/grant exists on the table at all). This SECURITY DEFINER
-- function is the only way a row gets created, so an authenticated user can
-- never spam another user's notification feed directly via PostgREST; the
-- booking/chat RPCs (which run as SECURITY INVOKER for their row-locking
-- guarantees) call this instead of inserting into notifications themselves.
create or replace function public.notify(
  p_user_id uuid, p_type text, p_title text, p_body text default null, p_link text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user_id, p_type, p_title, p_body, p_link);
end;
$$;
