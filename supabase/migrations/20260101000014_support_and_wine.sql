-- Voluntary support / donations (spec update §2-§3) — completely separate
-- from ride/booking data. KørMed's core ridesharing functionality is free;
-- this table only ever records optional, voluntary contributions toward
-- running costs. Never joined with rides/bookings, never shown publicly.

create table public.support_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  amount numeric(8, 2) not null check (amount > 0),
  currency text not null default 'DKK',
  payment_provider text not null,
  provider_payment_id text,
  status text not null default 'PENDING' check (status in ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  created_at timestamptz not null default now()
);

comment on table public.support_contributions is 'Voluntary contributions toward running KørMed. user_id is nullable (anonymous support allowed). Never displayed publicly — see RLS policies below.';

create index support_contributions_user_idx on public.support_contributions (user_id);

alter table public.support_contributions enable row level security;

-- Anyone (including anonymous visitors) may record a contribution; a signed
-- in user may only attribute it to themselves, never to someone else.
create policy support_contributions_insert_any on public.support_contributions
  for insert with check (user_id is null or user_id = auth.uid());

-- Only the contributor themselves (never other users) or an admin may read a
-- contribution back — spec §3 "Do not publicly display who has donated or
-- how much they donated."
create policy support_contributions_select_own on public.support_contributions
  for select using (user_id = auth.uid() or public.is_admin());

-- Status transitions (e.g. reconciling a payment as COMPLETED) are an admin
-- task in this MVP, since the default provider has no webhook callback yet.
create policy support_contributions_admin_update on public.support_contributions
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Admin-configurable settings for the support feature and the Vin i Glasset
-- cross-promotion (spec update §9). All default to the values the spec
-- requires; admins can change them at /admin/stoette without a code change.

insert into public.app_settings (key, value, is_public, description) values
  ('support_enabled', 'true', true,
    'Slår den frivillige støtte-funktion (spec §2-3) til/fra. Kernefunktionaliteten (find/tilbyd lift) er altid gratis uanset denne indstilling.'),
  ('support_payment_provider', '"manual"', true,
    'Hvilken betalingsudbyder der bruges til frivillige bidrag. Se lib/support/ — skift kræver også at konfigurere selve udbyderen via miljøvariabler.'),
  ('support_suggested_amounts', '[25, 50, 100]', true,
    'Foreslåede bidragsbeløb i kr. på /stoet-koermed.'),
  ('support_custom_amount_enabled', 'true', true,
    'Tillader brugeren at indtaste et valgfrit beløb i stedet for et af de foreslåede.'),
  ('wine_promotion_enabled', 'true', true,
    'Slår den sekundære Vin i Glasset-krydspromovering til/fra alle steder på sitet (footer, forside, støtteside, mv.).'),
  ('wine_shop_name', '"Vin i Glasset"', true,
    'Navnet der vises i krydspromoveringen.'),
  ('wine_shop_url', '"https://viniglasset.dk"', true,
    'Det eksterne link — åbnes altid i en ny fane med tydelig markering af, at brugeren forlader KørMed.'),
  ('wine_promotion_text', '"Hvis du alligevel er på udkig efter vin, kan du også støtte projektet ved at handle hos Vin i Glasset."', true,
    'Teksten der vises omkring krydspromoveringen. Skal aldrig forbinde alkohol med kørsel eller turen selv — se spec-opdatering §6.')
on conflict (key) do nothing;
