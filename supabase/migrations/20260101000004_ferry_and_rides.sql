-- Ferry routes are admin-managed (spec §8) — never hardcode a ferry list in
-- application logic. Rides reference an optional ferry_route.

create table public.ferry_routes (
  id uuid primary key default gen_random_uuid(),
  operator text not null,
  departure_port text not null,
  arrival_port text not null,
  default_departure_time time,
  notes text check (char_length(notes) <= 300),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ferry_routes_active_idx on public.ferry_routes (active);

create table public.rides (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles (id) on delete cascade,

  origin_name text not null,
  origin_lat double precision not null,
  origin_lng double precision not null,
  origin_geog geography(point, 4326) generated always as (
    ST_SetSRID(ST_MakePoint(origin_lng, origin_lat), 4326)::geography
  ) stored,

  destination_name text not null,
  destination_lat double precision not null,
  destination_lng double precision not null,
  destination_geog geography(point, 4326) generated always as (
    ST_SetSRID(ST_MakePoint(destination_lng, destination_lat), 4326)::geography
  ) stored,

  departure_date date not null,
  departure_time time not null,
  time_flexibility text not null default 'exact' check (
    time_flexibility in ('exact', 'plus_minus_30', 'plus_minus_60', 'flexible')
  ),

  distance_km numeric(7, 1),
  duration_minutes integer,
  route_polyline text,

  uses_ferry boolean not null default false,
  ferry_route_id uuid references public.ferry_routes (id),
  ferry_departure_time time,
  ferry_notes text check (char_length(ferry_notes) <= 300),

  available_seats integer not null check (available_seats between 0 and 7),
  original_seats integer not null check (original_seats between 1 and 7),

  luggage_option text not null default 'almindelig' check (
    luggage_option in ('lille', 'almindelig', 'stor')
  ),
  pets_option text not null default 'nej' check (pets_option in ('ja', 'nej', 'efter_aftale')),
  smoking boolean not null default false,
  comment text check (char_length(comment) <= 500),

  direct_cost_estimate numeric(8, 2),
  seat_price numeric(7, 2) not null check (seat_price >= 0),

  status text not null default 'DRAFT' check (
    status in ('DRAFT', 'PUBLISHED', 'FULL', 'CANCELLED', 'COMPLETED')
  ),
  driver_completed_credited boolean not null default false,
  cancelled_at timestamptz,
  cancelled_reason text check (char_length(cancelled_reason) <= 300),
  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ferry_fields_consistent check (
    (uses_ferry = false and ferry_route_id is null) or (uses_ferry = true)
  ),
  constraint seats_not_over_original check (available_seats <= original_seats)
);

create index rides_status_date_idx on public.rides (status, departure_date);
create index rides_driver_idx on public.rides (driver_id);
create index rides_origin_geog_idx on public.rides using gist (origin_geog);
create index rides_destination_geog_idx on public.rides using gist (destination_geog);

comment on table public.rides is 'One row per specific journey. No recurring rides — every row is a single date/time (spec §20).';

-- Sampled points along the calculated route, used for partial-route matching
-- (spec §11). Populated server-side from the routing provider's polyline
-- when a ride is published.
create table public.ride_route_points (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides (id) on delete cascade,
  sequence integer not null,
  point geography(point, 4326) not null,
  distance_from_origin_km numeric(7, 1),
  unique (ride_id, sequence)
);

create index ride_route_points_point_idx on public.ride_route_points using gist (point);
create index ride_route_points_ride_idx on public.ride_route_points (ride_id);
