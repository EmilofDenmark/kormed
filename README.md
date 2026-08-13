# KørMed — dansk samkørselsplatform

Dette er en komplet kodebase til en MVP af en dansk peer-to-peer samkørselsplatform. Denne README er skrevet til en **ikke-teknisk ejer**, der skal have hjælp fra en udvikler til de allerførste trin, men som selv skal kunne drive tjenesten bagefter (ferger, priser, juridiske tekster, brugere, anmeldelser).

> **Arbejdstitel:** Produktet hedder "KørMed" i denne kodebase, men navn/branding kan ændres ét sted — se afsnittet "Omdøb tjenesten" nedenfor. Der er endnu ikke oprettet en Supabase-projekt, og siden er ikke sat i drift — denne README beskriver hvordan du gør det.

## Indholdsfortegnelse

1. [Teknologi og arkitektur](#teknologi-og-arkitektur)
2. [Opsætning fra bunden](#opsætning-fra-bunden)
3. [Miljøvariabler](#miljøvariabler)
4. [Kort- og geokodningsudbyder](#kort--og-geokodningsudbyder)
5. [E-mail](#e-mail)
6. [Telefon-OTP](#telefon-otp)
7. [Opret den første administrator](#opret-den-første-administrator)
8. [Redigér færgeruter](#redigér-færgeruter)
9. [Redigér prisindstillinger](#redigér-prisindstillinger)
10. [Frivillig støtte og Vin i Glasset](#frivillig-støtte-og-vin-i-glasset)
11. [Juridiske tekster og selskabsoplysninger](#juridiske-tekster-og-selskabsoplysninger)
12. [Omdøb tjenesten](#omdøb-tjenesten)
13. [Demo-data](#demo-data)
14. [Drift: planlagte opgaver](#drift-planlagte-opgaver)
15. [Deploy](#deploy)
16. [Backup](#backup)
17. [Opdatering af applikationen](#opdatering-af-applikationen)
18. [Tests](#tests)
19. [Sikkerhedstest / QA-tjekliste før lancering](#sikkerhedstest--qa-tjekliste-før-lancering)
20. [Kendte begrænsninger i denne version](#kendte-begrænsninger-i-denne-version)
21. [Juridisk gennemgang (vigtigt)](#juridisk-gennemgang-vigtigt)

---

## Teknologi og arkitektur

- **Next.js 14** (App Router) + **React 18** + **TypeScript** + **Tailwind CSS**
- **Supabase**: Postgres-database, autentificering, Realtime (chat), fillagring
- **PostGIS** til geografisk søgning (delvist-match langs en rute)
- **MapLibre GL** til kortvisning, med en udskiftelig udbyder til geokodning/ruteberegning (standard: OpenStreetMap, se afsnit 4)

Mapperne, du skal kende som administrator/udvikler:

```
/app                    sider og server actions' UI (Next.js App Router)
/components             genbrugelige UI-komponenter
/lib                     forretningslogik, validering, Supabase-klienter, server actions
/supabase/migrations     hele databaseskemaet, sikkerhedspolitikker (RLS), funktioner
/supabase/seed/demo.sql  udviklings-data med opdigtede personer (KØR ALDRIG i produktion)
/tests                   automatiske tests af de vigtigste forretningsregler
```

**Vigtigt arkitekturprincip:** al prislogik ligger isoleret i [`lib/pricing/costSharing.ts`](lib/pricing/costSharing.ts) og alle tal (kr./km osv.) kommer fra databasen (`app_settings`), redigerbare under `/admin/priser`. Se afsnittet "Juridisk gennemgang" — denne fil og disse tal skal godkendes af en jurist, før rigtige brugere bruger tjenesten.

---

## Opsætning fra bunden

Dette er trinene fra en tom computer til en kørende udviklingsversion.

1. **Installer Node.js** (version 18.18 eller nyere) fra [nodejs.org](https://nodejs.org/).
2. **Installer afhængigheder** i projektmappen:
   ```bash
   npm install
   ```
3. **Opret et Supabase-projekt** på [supabase.com](https://supabase.com/) (gratis plan er fin til at starte). Notér:
   - Project URL
   - `anon` public API key
   - `service_role` secret key (findes under Project Settings → API — del den ALDRIG offentligt)
4. **Slå PostGIS til**: I Supabase-dashboardet, gå til Database → Extensions, og aktivér `postgis` (migrationsfilerne gør det også automatisk, men det er godt at vide, hvor det styres).
5. **Kør databasemigrationerne.** Nemmeste metode uden ekstra software: åbn Supabase-dashboardets SQL-editor og kør hver fil i `supabase/migrations/` i nummerorden (filnavnene starter med et tidsstempel, så de allerede er i den rigtige rækkefølge). Har du [Supabase CLI](https://supabase.com/docs/guides/cli) installeret, kan du i stedet køre:
   ```bash
   supabase link --project-ref <dit-projekt-id>
   supabase db push
   ```
6. **Sæt tidszonen** på Supabase-projektet til `Europe/Copenhagen` (Database → Settings → Timezone) — det bruges til at afgøre, hvornår en tur er "afgået" for automatisk gennemførsel.
7. **Kopiér `.env.example` til `.env.local`** og udfyld værdierne — se næste afsnit.
8. **Start udviklingsserveren:**
   ```bash
   npm run dev
   ```
   Siden kører nu på http://localhost:3000.
9. **Opret den første administrator** — se afsnit 7 nedenfor.

---

## Miljøvariabler

Alle miljøvariabler er dokumenteret med kommentarer i [`.env.example`](.env.example) — kopiér filen til `.env.local` og udfyld den. De vigtigste:

| Variabel | Beskrivelse |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Fra Supabase-projektet (offentlige, men styret af Row Level Security) |
| `SUPABASE_SERVICE_ROLE_KEY` | Hemmelig nøgle — **kun** på serveren, aldrig i browseren, aldrig i git |
| `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_TAGLINE`, `NEXT_PUBLIC_APP_URL` | Branding — se "Omdøb tjenesten" |
| `NEXT_PUBLIC_MAP_PROVIDER` | `osm` (standard, gratis) eller `mapbox` |
| `EMAIL_PROVIDER` | `console` (udvikling), `resend` eller `smtp` (ikke implementeret endnu) |
| `CRON_SECRET` | Hemmelig nøgle til den planlagte opgave der lukker gamle ture — se afsnit 13 |

`.env.local` må **aldrig** committes til git (den er allerede i `.gitignore`).

---

## Kort- og geokodningsudbyder

Kort, søgning og ruteberegning går gennem ét abstraktionslag (`lib/geo/`), så udbyderen kan skiftes uden at røre resten af koden.

**Standard (ingen opsætning nødvendig for udvikling):** OpenStreetMap — Nominatim til søgning, OSRM til ruteberegning, OSM-fliser til kortvisning. De offentlige demo-servere (`nominatim.openstreetmap.org`, `router.project-osrm.org`) er **rate-limitede og ikke egnede til rigtig trafik**. Før lancering skal du enten:
- selv hoste Nominatim/OSRM (se deres respektive dokumentation), eller
- pege `NOMINATIM_BASE_URL` / `OSRM_BASE_URL` på en betalt udbyder med kompatibelt API, eller
- skifte til Mapbox (`NEXT_PUBLIC_MAP_PROVIDER=mapbox`, udfyld `MAPBOX_TOKEN` og `NEXT_PUBLIC_MAPBOX_TOKEN`).

For at tilføje en helt ny udbyder: opret en fil under `lib/geo/providers/` der implementerer `GeoProvider`-interfacet (se `lib/geo/types.ts`), og registrér den i `lib/geo/index.ts`.

---

## E-mail

Transaktionsmails (kvitteringer, notifikationer) sendes via `lib/email/`. Standard (`EMAIL_PROVIDER=console`) logger blot til serverens konsol — brug det kun i udvikling. Til produktion, sæt `EMAIL_PROVIDER=resend`, opret en konto på [resend.com](https://resend.com/), og udfyld `RESEND_API_KEY` og `EMAIL_FROM`. Ønsker du direkte SMTP i stedet, skal du selv tilføje en lille afhængighed (fx `nodemailer`) i `lib/email/index.ts` — det er bevidst ikke inkluderet for at holde afhængigheder nede.

Der sendes **ingen markedsføringsmails** — kun det nødvendige (booking-status, beskeder osv.).

---

## Telefon-OTP

Telefonbekræftelse bruger Supabase Auths indbyggede SMS-funktion — der er ikke skrevet noget brugerdefineret OTP-system. For at aktivere det:

1. Gå til Supabase-dashboardet → Authentication → Providers → Phone.
2. Vælg en SMS-udbyder (Twilio, MessageBird eller Vonage understøttes) og indtast dine legitimationsoplysninger for den udbyder.
3. Test ved at oprette en konto og bekræfte telefonnummeret under `/bekraeft-telefon`.

Uden dette trin virker e-mail-bekræftelse stadig, men SMS-koder bliver ikke sendt, og brugere kan derfor ikke blive fuldt verificerede (hvilket kræves for at booke eller oprette ture).

---

## Opret den første administrator

Der er bevidst ingen automatisk admin-oprettelse. Sådan gør du:

1. Opret en almindelig konto gennem `/tilmeld` med den e-mail, der skal være administrator.
2. Bekræft e-mailen (og gerne telefonnummeret).
3. Kør denne SQL i Supabase SQL-editoren:
   ```sql
   update public.profiles set role = 'admin' where email = 'din-email@eksempel.dk';
   ```
4. Log ind og besøg `/admin`.

---

## Redigér færgeruter

Under `/admin/faerger` kan du oprette, redigere, deaktivere og reaktivere færgeruter (operatør, afgangs-/ankomsthavn, standardtid, noter). Ruterne er ikke hardkodet noget sted i koden — de bruges direkte fra databasetabellen `ferry_routes`.

---

## Redigér prisindstillinger

Under `/admin/priser` kan du ændre:
- kr./km, andel af færge-/broudgifter der må indgå, afrundingsmetode
- søgeradius for delvist-match-søgning
- timer før en tur automatisk markeres som gennemført
- opbevaringsperioder (vejledende — se "Kendte begrænsninger")
- feature flags (`payments_enabled`, `recurring_rides_enabled`, `analytics_enabled`) — **skal forblive slået fra** i denne version, se afsnittet om juridisk gennemgang og §39 i den oprindelige specifikation.

---

## Frivillig støtte og Vin i Glasset

KørMed er og skal forblive gratis at bruge — find/tilbyd lift kræver aldrig betaling eller abonnement. Der findes dog en helt separat, valgfri måde for tilfredse brugere at støtte driften:

- **`/stoet-koermed`** lader en bruger (logget ind eller anonym) give et frivilligt bidrag. Bidrag gemmes i deres egen tabel (`support_contributions`) — de blandes aldrig med ride-/bookingdata, påvirker aldrig søgeresultater eller bedømmelser, og hvem der har doneret, eller hvor meget, vises aldrig offentligt noget sted.
- Betalingen går gennem et selvstændigt, udskifteligt modul i `lib/support/` (samme mønster som `lib/geo/` og `lib/email/`). Standardopsætningen understøtter et MobilePay-betalingslink (indsæt URL'en i `SUPPORT_MOBILEPAY_LINK_URL`) — uden den viser siden i stedet en venlig "ikke sat op endnu"-besked, i stedet for at foregive at gennemføre en betaling.
- **Vin i Glasset** (viniglasset.dk) er en helt ekstern vinforretning, som KørMed har en uformel aftale med om en diskret krydspromovering. Linket åbner altid i en ny fane og er tydeligt markeret som eksternt. Det vises kun i separate, ikke-påtrængende sammenhænge (bunden af forsiden, footeren, støttesiden, og en enkelt linje efter en gennemført tur) — **aldrig** i søgeresultater, bookingformularer, chat eller ved siden af priser.
- Begge dele styres under **`/admin/stoette`**: slå støttefunktionen og/eller Vin i Glasset-krydspromoveringen helt fra, skift foreslåede beløb, og rediger promoveringsteksten — uden en kodeændring.

---

## Juridiske tekster og selskabsoplysninger

Under `/admin/juridisk` kan du redigere og udgive nye versioner af Vilkår og Privatlivspolitik. Hver udgivelse opretter automatisk en ny version og vises straks på `/vilkaar` og `/privatliv`.

Kontaktoplysningerne på `/kontakt` og i de juridiske tekster indeholder placeholders: `[COMPANY NAME]`, `[CVR]`, `[ADDRESS]`, `[EMAIL]`. **Disse er ikke opfundet af os** — du skal selv udfylde dem med selskabets reelle oplysninger. Søg efter disse fire strenge i koden/databasen for at finde alle steder, de optræder.

---

## Omdøb tjenesten

Navn, tagline, sociale håndtag, URL og supportmail styres ét sted: miljøvariablerne `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_TAGLINE`, `NEXT_PUBLIC_SOCIAL_HANDLE`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPPORT_EMAIL` (se `lib/config/brand.ts`). Farver styres i `tailwind.config.ts` og `app/globals.css`. Der er ikke noget logo-billede endnu — `components/nav/Logo.tsx` viser navnets forbogstav i en cirkel; erstat med et rigtigt logo, når I har ét.

---

## Demo-data

`supabase/seed/demo.sql` opretter fem opdigtede brugere (Mads, Anna, Sofie, Jonas, Emil — adgangskode `kormed-demo-1234` for alle) og et par eksempelture, så en udvikler kan klikke sig igennem alle flows uden at oprette ti rigtige konti manuelt.

**Kør aldrig denne fil mod en database, rigtige brugere kan nå.** Kør den manuelt i et udviklingsmiljø:
```bash
supabase db execute -f supabase/seed/demo.sql
```
eller indsæt indholdet i Supabase SQL-editoren på et **udviklings**-projekt.

---

## Drift: planlagte opgaver

Én ting skal køre periodisk udefra: automatisk gennemførsel af gamle ture (spec §18). Kald denne adresse fx hvert 30. minut, med hemmeligheden fra `CRON_SECRET`:

```bash
curl -X POST https://din-side.dk/api/jobs/complete-rides \
  -H "Authorization: Bearer $CRON_SECRET"
```

Sæt det op med enten:
- **Supabase's indbyggede `pg_cron`** (Database → Cron Jobs), som kalder URL'en via `pg_net`, eller
- **Vercel Cron** (`vercel.json`), eller
- en simpel GitHub Actions-workflow på et skema.

Der er ingen anden baggrundsproces, tjenesten kræver.

---

## Deploy

Applikationen er en almindelig Next.js-app og kan deployes til fx [Vercel](https://vercel.com/) (anbefalet, enklest) eller enhver anden Node.js-hosting, der understøtter Next.js 14.

1. Push koden til et Git-repository.
2. Opret et nyt projekt på Vercel og forbind det til repositoriet.
3. Udfyld alle miljøvariabler fra `.env.example` i Vercels projektindstillinger (Environment Variables).
4. Deploy.
5. Sæt `NEXT_PUBLIC_APP_URL` til den rigtige produktions-URL, og opdatér "Redirect URLs" i Supabase Auth-indstillingerne til at inkludere `https://din-side.dk/auth/callback`.

---

## Backup

Supabase tager automatiske daglige backups på betalte planer (Point-in-Time Recovery på højere planer). Som minimum:
- Slå **Daily Backups** til i Supabase-projektets indstillinger.
- Overvej at eksportere en manuel SQL-dump periodisk: `supabase db dump -f backup.sql` (kræver Supabase CLI).

---

## Opdatering af applikationen

1. Træk ændringer til koden (`git pull` eller tilsvarende).
2. Kør `npm install` (hvis afhængigheder er ændret).
3. Kør eventuelle nye filer i `supabase/migrations/` (kun de, du ikke allerede har kørt — Supabase CLI's `db push` styrer dette automatisk).
4. Deploy som normalt.

---

## Tests

```bash
npm install
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm test            # Vitest — forretningsregler, se næste afsnit
```

`tests/` indeholder automatiske tests for de fleste af de centrale forretningsregler:

| Regel | Testfil |
|---|---|
| Kun voksne kan oprette konto | `tests/age.test.ts` |
| Kun verificerede brugere kan oprette ture | `tests/eligibility.test.ts` |
| Brugere kan ikke oprette ture over prisloftet | `tests/pricing.test.ts` |
| Delvist-match er kun gyldigt i korrekt rejseretning | `tests/matching.test.ts` |
| Pladser kan ikke overbookes | `tests/seats.test.ts` |
| Aflyste pladser lægges tilbage i puljen | `tests/seats.test.ts` |
| Brugere kan ikke tilgå andres samtaler | `tests/chatAccess.test.ts` |
| Brugere kan kun bedømme efter en gennemført booking | `tests/ratingEligibility.test.ts` |
| Admin-adgang er beskyttet | `tests/eligibility.test.ts` |
| Betalingsbehandling er slået fra | `tests/featureFlags.test.ts` |
| Gentagne ture kan ikke oprettes | `tests/featureFlags.test.ts` |

**Ikke dækket af automatiske tests i denne kodebase** (kræver en rigtig kørende Postgres/Supabase-instans, som ikke var tilgængelig i det miljø, koden blev skrevet i):
- At Row Level Security faktisk forhindrer uautoriseret databaseadgang (politikkerne er skrevet og gennemgået i `supabase/migrations/20260101000010_rls_policies.sql`, men bør testes manuelt eller med `supabase test db` mod et rigtigt projekt, før lancering).
- Samtidighed ved booking (to personer der forsøger at booke den sidste plads samtidig) — `accept_booking`-funktionen bruger `SELECT ... FOR UPDATE` radlåsning netop for at forhindre dette, men det bør afprøves mod en rigtig database.

---

## Sikkerhedstest / QA-tjekliste før lancering

Kør denne tjekliste manuelt mod en rigtig (ikke-produktions) Supabase-instans, før I lancerer:

- [ ] Opret to testbrugere. Bekræft at bruger A ikke kan se/redigere bruger B's tur, booking eller samtale via API'et (prøv fx at kalde Supabase-klienten direkte fra browserkonsollen med bruger A's session).
- [ ] Forsøg at oprette en tur med en pris over det beregnede loft — skal afvises både i UI og hvis du omgår UI'et og kalder server actionen direkte.
- [ ] Forsøg at booke flere pladser, end der er ledige — skal afvises.
- [ ] Lad to browserfaner (to forskellige brugere) forsøge at acceptere den sidste ledige plads på samme tur samtidig — kun én bør lykkes.
- [ ] Bekræft at `/admin` returnerer en 403/redirect for en ikke-admin-bruger.
- [ ] Bekræft at en anmeldt besked/tur/profil ikke automatisk fjernes, kun ved en administrators aktive handling.
- [ ] Bekræft at `payments_enabled`, `recurring_rides_enabled` og `analytics_enabled` alle er `false` i `app_settings`.
- [ ] Gennemgå de juridiske tekster med en jurist (se næste afsnit).

---

## Kendte begrænsninger i denne version

Ærligt talt om, hvad der bevidst er skåret fra eller forenklet i denne MVP:

- **Profilbillede-upload er ikke bygget.** `profiles.avatar_url`-feltet findes, men der er ingen upload-UI. Tilføj Supabase Storage (en offentlig `avatars`-bucket med ejer-skrive-politik) og en simpel uploadkomponent, hvis det ønskes.
- **Ruteberegning ved færgeture** bruger den almindelige køreafstand mellem start og slut (via broer, hvor de findes) — den beregner ikke separate ben til/fra færgehavnen, da det ville kræve havnekoordinater, som ikke er en del af `ferry_routes`-tabellen i denne version. Chaufførens indtastede færgeudgift indgår stadig korrekt i prisberegningen.
- **Opbevaringsperioder** (`data_retention_*_days` i `app_settings`) er konfigurationsfelter, men der er ikke bygget en automatisk oprydningsjob, der håndhæver dem — det kræver en periodisk opgave svarende til `/api/jobs/complete-rides`. Tilføj en tilsvarende rute, hvis automatisk sletning efter periode er et krav.
- **Kontosletning er øjeblikkelig** (ingen fortrydelsesperiode), selvom `account_deletion_grace_days` findes som indstilling til en fremtidig udvidelse.
- **Anmeldelse af enkeltbeskeder** i chatten har ikke sin egen "anmeld"-knap i UI'et (kun ture, profiler og bedømmelseskommentarer har det) — administratorer kan stadig behandle en anmeldelse af type `message`, hvis en sag oprettes direkte, men den kontekstuelle knap i selve chatten mangler.
- **RLS og samtidighed** er skrevet med stor omhu, men **ikke afprøvet mod en kørende database** — `npm run typecheck`, `npm run lint`, `npm test` (43/43 grønne) og `npm run build` er alle verificeret til at køre rent, og hjemmesiden er startet lokalt og set gengive korrekt i en browser, men uden et rigtigt Supabase-projekt kunne RLS-politikkerne og booking-radlåsningen ikke afprøves mod en ægte database. Se QA-tjeklisten ovenfor.
- **`npm audit`** viser stadig nogle kendte sårbarheder efter opsætning: Next.js er opdateret til nyeste 14.2.x (`14.2.35`), hvilket fjernede de fleste — to resterende (høj alvorlighed, billed-optimering og RSC-deserialisering) kræver et spring til Next.js 16, som er et større, ikke-bagudkompatibelt skifte (bl.a. asynkrone `params`/`searchParams` i alle sider) og derfor bevidst ikke lavet automatisk. De øvrige fund (`vitest`/`vite`/`esbuild`/`glob`/`eslint-config-next`) er kun i devDependencies (test/lint-værktøjer) og indgår ikke i den udgivne applikation. Kør `npm audit` for detaljer, før produktionslancering.

---

## Juridisk gennemgang (vigtigt)

Følgende **skal** gennemgås af en person med indsigt i dansk ret, før tjenesten lanceres med rigtige brugere og rigtige ture:

1. **Prismodellen** i [`lib/pricing/costSharing.ts`](lib/pricing/costSharing.ts) og standardværdierne i [`supabase/migrations/20260101000012_seed_settings.sql`](supabase/migrations/20260101000012_seed_settings.sql). Modellen (del de direkte omkostninger mellem alle i bilen, inkl. chaufføren) er en almindelig, forsigtig konvention — **ikke en bekræftet juridisk korrekt sats eller metode**.
2. **Vilkår og Privatlivspolitik** under `/admin/juridisk` — den nuværende tekst er en administrativt genereret placeholder markeret `requires_legal_review = true` i databasen, og udgør ikke juridisk rådgivning.
3. Selskabsoplysningerne (`[COMPANY NAME]`, `[CVR]`, `[ADDRESS]`, `[EMAIL]`).
4. At samkørselsmodellen som helhed (ingen betalingsformidling, chaufføren skal allerede foretage turen, osv.) reelt opfylder de danske regler for ikke-erhvervsmæssig samkørsel, som de ser ud på lanceringstidspunktet.
