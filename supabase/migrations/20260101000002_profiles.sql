-- Profiles: one row per auth.users, holds everything the app needs to show
-- publicly (first name, rating, ...) plus private data protected by RLS.
-- Never publicly expose: last_name, email, phone, date_of_birth (spec §6/§23).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  public_id text not null unique,
  first_name text not null check (char_length(first_name) between 1 and 60),
  last_name text not null check (char_length(last_name) between 1 and 60),
  email text not null,
  phone text,
  date_of_birth date not null,
  avatar_url text,
  bio text check (char_length(bio) <= 300),
  role text not null default 'user' check (role in ('user', 'admin')),
  email_verified boolean not null default false,
  phone_verified boolean not null default false,
  rating_avg numeric(2, 1) not null default 0,
  rating_count integer not null default 0,
  completed_rides_count integer not null default 0,
  status text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  suspended_reason text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public + private profile data. Only first_name/avatar/rating/completed_rides/bio are ever shown to other users.';
comment on column public.profiles.public_id is 'Opaque slug used in /bruger/[public-id] URLs — never a sequential/guessable id.';

create index profiles_public_id_idx on public.profiles (public_id);
create index profiles_status_idx on public.profiles (status);

-- Driver requirement declaration (spec §7). Stored separately from
-- legal_documents because it is a fixed checklist, not an editable document —
-- bump DRIVER_DECLARATION_VERSION in lib/config/legal.ts if the checklist
-- wording changes, and require re-acceptance.
create table public.driver_declarations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  declaration_version integer not null,
  accepted_at timestamptz not null default now()
);

create index driver_declarations_user_idx on public.driver_declarations (user_id, declaration_version);
