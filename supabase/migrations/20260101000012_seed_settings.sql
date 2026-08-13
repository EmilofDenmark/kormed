-- Operational defaults (not demo/fictional data — safe to run in
-- production). All of these are editable afterwards from /admin/priser and
-- /admin/faerger. Values marked "REQUIRES LEGAL REVIEW" are placeholders,
-- not a claim about what Danish law actually allows — see spec §9 and
-- README "Juridisk gennemgang".

insert into public.app_settings (key, value, is_public, description) values
  ('search_radius_km', '12', true,
    'Hvor tæt en søgning skal være på en tur-rute for at blive vist som delvist match (km).'),
  ('auto_complete_grace_hours', '24', false,
    'Timer efter planlagt afgang før en tur/booking automatisk markeres som gennemført, hvis ingen har aflyst.'),
  ('payments_enabled', 'false', true,
    'Fremtidig funktion. Skal forblive false i denne version — ingen betalingsflow er bygget i UI.'),
  ('recurring_rides_enabled', 'false', true,
    'Fremtidig funktion. Skal forblive false — hver tur er en enkeltstående, konkret rejse.'),
  ('analytics_enabled', 'false', true,
    'Fremtidig funktion. Skal forblive false, indtil et samtykke-flow til valgfri analytics er bygget.'),
  ('price_per_km_dkk', '2.00', true,
    'REQUIRES LEGAL REVIEW: vejledende kr/km til beregning af det maksimale bidrag. Ikke en juridisk fastsat sats.'),
  ('ferry_cost_pass_through_pct', '100', true,
    'Hvor stor en andel af chaufførens indtastede færgeudgift der må indgå i det maksimale bidrag.'),
  ('toll_cost_pass_through_pct', '100', true,
    'Hvor stor en andel af chaufførens indtastede bro-/vejafgift der må indgå i det maksimale bidrag.'),
  ('price_rounding_method', '"nearest_5"', true,
    'Afrundingsmetode for det beregnede maksimale bidrag pr. passager: nearest_1, nearest_5 eller nearest_10.'),
  ('route_point_sample_interval_km', '10', false,
    'Afstand mellem gemte rutepunkter langs en tur, brugt til delvist-match søgning.'),
  ('data_retention_messages_days', '730', false,
    'Vejledende opbevaringsperiode for chatbeskeder (dage) — se README "Dataopbevaring".'),
  ('data_retention_cancelled_rides_days', '365', false,
    'Vejledende opbevaringsperiode for aflyste ture (dage).'),
  ('account_deletion_grace_days', '30', false,
    'Reserveret til en fremtidig fortrydelsesperiode ved kontosletning. I denne version anonymiseres kontoen med det samme ved bekræftet sletning — se README "Kontosletning".')
on conflict (key) do nothing;

-- Placeholder legal documents so /vilkaar and /privatliv render something
-- sensible out of the box. REQUIRES LEGAL REVIEW BEFORE PRODUCTION LAUNCH —
-- see admin /admin/juridisk and README "Juridisk gennemgang".
insert into public.legal_documents (type, version, content, requires_legal_review, published_at) values
  ('terms', 1, E'# Vilkår for brug af [COMPANY NAME]\n\n**Denne tekst er en administrativt genereret placeholder og kræver juridisk gennemgang før produktionslancering. Den udgør ikke juridisk rådgivning.**\n\n[COMPANY NAME] ([CVR]), [ADDRESS] ([EMAIL]) driver en formidlingsplatform for samkørsel. Platformen udfører ikke selv persontransport og er ikke et taxaselskab.\n\n1. Du skal være mindst 18 år for at oprette en konto.\n2. Som chauffør bekræfter du ved oprettelse af en tur, at du allerede skal køre turen, at køretøjet er lovligt og forsikret, og at det angivne bidrag alene dækker en andel af de direkte omkostninger.\n3. Platformen håndterer ikke betaling mellem chauffør og passager.\n4. Yderligere vilkår udfyldes her efter juridisk gennemgang.', true, now()),
  ('privacy', 1, E'# Privatlivspolitik for [COMPANY NAME]\n\n**Denne tekst er en administrativt genereret placeholder og kræver juridisk gennemgang før produktionslancering. Den udgør ikke juridisk rådgivning.**\n\n[COMPANY NAME] ([CVR]), [ADDRESS] er dataansvarlig. Kontakt: [EMAIL].\n\nVi indsamler kun de oplysninger, der er nødvendige for at drive samkørselsformidlingen: navn, kontaktoplysninger, fødselsdato (til aldersverificering), og oplysninger om ture og bookinger. Se /privatliv på hjemmesiden og "Mine oplysninger" under din profil for eksport og sletning af dine data.', true, now())
on conflict (type, version) do nothing;

-- Real, publicly known Danish ferry routes as sensible starting data (not
-- fictional demo content) — administrators can rename/disable/add via
-- /admin/faerger at any time (spec §8).
insert into public.ferry_routes (operator, departure_port, arrival_port, active) values
  ('Molslinjen', 'Odden', 'Aarhus', true),
  ('Molslinjen', 'Aarhus', 'Odden', true),
  ('Molslinjen', 'Odden', 'Ebeltoft', true),
  ('Molslinjen', 'Ebeltoft', 'Odden', true),
  ('Bornholmslinjen', 'Rønne', 'Ystad', true),
  ('Bornholmslinjen', 'Ystad', 'Rønne', true),
  ('Danske Færger', 'Spodsbjerg', 'Tårs', true),
  ('Danske Færger', 'Tårs', 'Spodsbjerg', true)
on conflict do nothing;
