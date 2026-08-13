-- Legal documents (versioned Terms/Privacy), acceptance history, and the
-- app_settings key/value store that drives pricing, search radius and
-- feature flags from the admin panel instead of hardcoded constants.

create table public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('terms', 'privacy')),
  version integer not null,
  content text not null,
  requires_legal_review boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (type, version)
);

comment on table public.legal_documents is 'requires_legal_review defaults true — do not flip to false without an actual Danish legal review, see README.';

create table public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  document_type text not null check (document_type in ('terms', 'privacy')),
  version integer not null,
  accepted_at timestamptz not null default now()
);

create index legal_acceptances_user_idx on public.legal_acceptances (user_id, document_type);

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

comment on table public.app_settings is 'Admin-editable configuration. is_public rows are readable by anyone (needed to render price/radius explanations); everything else is admin-only.';
