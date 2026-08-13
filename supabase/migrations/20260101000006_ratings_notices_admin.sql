create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  rater_id uuid not null references public.profiles (id) on delete cascade,
  ratee_id uuid not null references public.profiles (id) on delete cascade,
  stars integer not null check (stars between 1 and 5),
  comment text check (char_length(comment) <= 500),
  comment_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (booking_id, rater_id)
);

create index ratings_ratee_idx on public.ratings (ratee_id);

-- Digital Services Act notice-and-action workflow (spec §21).
create table public.content_notices (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('ride', 'profile', 'rating_comment', 'message')),
  content_id uuid not null,
  url text,
  reporter_user_id uuid references public.profiles (id),
  reporter_email text not null,
  explanation text not null check (char_length(explanation) between 1 and 2000),
  legal_category text,
  good_faith_confirmed boolean not null,
  status text not null default 'NEW' check (
    status in ('NEW', 'UNDER_REVIEW', 'ACTION_TAKEN', 'NO_ACTION', 'CLOSED')
  ),
  decision_reason text check (char_length(decision_reason) <= 2000),
  handled_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index content_notices_status_idx on public.content_notices (status);
create index content_notices_content_idx on public.content_notices (content_type, content_id);

-- Audit trail for every administrative action (spec §23/§25).
create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id),
  action_type text not null,
  target_table text,
  target_id uuid,
  reason text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index admin_actions_admin_idx on public.admin_actions (admin_id, created_at desc);
create index admin_actions_target_idx on public.admin_actions (target_table, target_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (
    type in (
      'booking_requested', 'booking_accepted', 'booking_rejected',
      'new_message', 'booking_cancelled', 'ride_cancelled', 'rating_available'
    )
  ),
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- Lightweight DB-backed rate limiting (spec §16/§25) — avoids adding a
-- Redis dependency for a single-instance MVP. See lib/rateLimit.ts.
create table public.rate_limit_hits (
  id bigserial primary key,
  bucket_key text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_hits_key_idx on public.rate_limit_hits (bucket_key, created_at);
