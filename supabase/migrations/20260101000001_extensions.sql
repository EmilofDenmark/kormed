-- KørMed — base extensions
-- PostGIS powers geographic search (partial-route matching, approximate map
-- display); pgcrypto gives us gen_random_uuid() for primary keys.

create extension if not exists postgis;
create extension if not exists pgcrypto;
