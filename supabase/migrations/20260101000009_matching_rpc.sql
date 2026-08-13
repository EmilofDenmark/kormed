-- Partial-route matching (spec §11): a ride matches a search if the search
-- origin AND destination are both within the configured radius of the
-- ride's sampled route points, AND the origin point occurs before the
-- destination point along the route (correct travel direction).
--
-- This mirrors lib/matching/partialRoute.ts, which is unit-tested since this
-- SQL function itself needs a live Postgres/PostGIS instance to exercise.

create or replace function public.search_rides_partial_match(
  p_origin_lat double precision,
  p_origin_lng double precision,
  p_dest_lat double precision,
  p_dest_lng double precision,
  p_date date default null,
  p_seats integer default 1,
  p_radius_km numeric default null
)
returns table (
  ride_id uuid,
  origin_distance_km numeric,
  destination_distance_km numeric,
  origin_sequence integer,
  destination_sequence integer
)
language plpgsql
stable
as $$
declare
  v_radius_km numeric;
begin
  if p_radius_km is not null then
    v_radius_km := p_radius_km;
  else
    select (value #>> '{}')::numeric into v_radius_km
      from public.app_settings where key = 'search_radius_km';
    v_radius_km := coalesce(v_radius_km, 12);
  end if;

  return query
  with origin_pt as (
    select ST_SetSRID(ST_MakePoint(p_origin_lng, p_origin_lat), 4326)::geography as geog
  ),
  dest_pt as (
    select ST_SetSRID(ST_MakePoint(p_dest_lng, p_dest_lat), 4326)::geography as geog
  ),
  origin_candidates as (
    select rp.ride_id,
           min(rp.sequence) as seq,
           min(ST_Distance(rp.point, o.geog)) as dist_m
    from public.ride_route_points rp, origin_pt o
    where ST_DWithin(rp.point, o.geog, v_radius_km * 1000)
    group by rp.ride_id
  ),
  dest_candidates as (
    select rp.ride_id,
           max(rp.sequence) as seq,
           min(ST_Distance(rp.point, d.geog)) as dist_m
    from public.ride_route_points rp, dest_pt d
    where ST_DWithin(rp.point, d.geog, v_radius_km * 1000)
    group by rp.ride_id
  )
  select
    r.id as ride_id,
    round((oc.dist_m / 1000)::numeric, 1) as origin_distance_km,
    round((dc.dist_m / 1000)::numeric, 1) as destination_distance_km,
    oc.seq as origin_sequence,
    dc.seq as destination_sequence
  from public.rides r
  join origin_candidates oc on oc.ride_id = r.id
  join dest_candidates dc on dc.ride_id = r.id
  where r.status = 'PUBLISHED'
    and oc.seq < dc.seq
    and r.available_seats >= p_seats
    and (p_date is null or r.departure_date = p_date);
end;
$$;
