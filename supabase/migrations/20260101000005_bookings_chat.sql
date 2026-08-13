-- Bookings are never auto-accepted (spec §14). payment_status exists purely
-- so a future payments feature doesn't require a booking-table redesign —
-- only NOT_HANDLED_BY_PLATFORM is ever written to in this MVP.

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides (id) on delete cascade,
  passenger_id uuid not null references public.profiles (id) on delete cascade,
  seats integer not null check (seats between 1 and 7),
  message text check (char_length(message) <= 500),
  status text not null default 'PENDING' check (
    status in (
      'PENDING', 'ACCEPTED', 'REJECTED',
      'CANCELLED_BY_DRIVER', 'CANCELLED_BY_PASSENGER', 'COMPLETED'
    )
  ),
  payment_status text not null default 'NOT_HANDLED_BY_PLATFORM' check (
    payment_status in ('NOT_HANDLED_BY_PLATFORM', 'PENDING', 'PAID', 'REFUNDED')
  ),
  cancellation_reason text check (char_length(cancellation_reason) <= 300),
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint passenger_not_self check (true) -- enforced in app/trigger: passenger_id <> ride.driver_id
);

comment on column public.bookings.payment_status is 'Only NOT_HANDLED_BY_PLATFORM is used in the MVP. PENDING/PAID/REFUNDED are reserved for a future payments feature and must never be set or shown while payments_enabled=false.';

-- A passenger may only have one active (PENDING or ACCEPTED) booking per ride.
create unique index bookings_one_active_per_passenger_idx
  on public.bookings (ride_id, passenger_id)
  where status in ('PENDING', 'ACCEPTED');

create index bookings_ride_idx on public.bookings (ride_id);
create index bookings_passenger_idx on public.bookings (passenger_id);
create index bookings_status_idx on public.bookings (status);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  driver_id uuid not null references public.profiles (id) on delete cascade,
  passenger_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index conversations_driver_idx on public.conversations (driver_id);
create index conversations_passenger_idx on public.conversations (passenger_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);
