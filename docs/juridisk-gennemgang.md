# Juridisk gennemgang af KørMed (gennemgang foretaget oktober 2026)

> **Vigtigt:** Dette er en teknisk/praktisk gennemgang foretaget af en AI-assistent og er **ikke juridisk
> rådgivning**. Punkterne herunder er de steder, hvor en dansk jurist bør kigge, før sitet markedsføres bredt.
> Henvisninger til regler er fra hukommelsen og skal verificeres.

## Kort konklusion
Sitet har de rigtige grundstrukturer (samtykke til vilkår/privatliv, alderskrav, anmeldelsesfunktion, ingen
tracking-cookies, ingen betalinger via platformen). De juridiske **tekster** er derimod stadig meget korte
pladsholdere. Størst praktisk risiko er (1) vilkår/privatlivspolitik der ikke dækker det, sitet faktisk gør,
(2) manglende skriftlig begrundelse ved udelukkelse, og (3) markedsføring af egen virksomhed (Vin i Glasset)
uden tydelig oplysning om tilknytning.

## Fund, der kræver handling

| # | Emne | Hvad er der i dag | Anbefaling | Prioritet |
|---|------|-------------------|------------|-----------|
| 1 | **Udelukkelse som eneste sanktion** | Status "spærret" fandtes, men blev ikke håndhævet teknisk | Rettet i denne gren (login spærres, ture skjules, skrivning blokeres). Vilkårene skal sige, at KørMed kan udelukke brugere uden varsel, og at det er den eneste sanktion | Høj |
| 2 | **Begrundelse ved udelukkelse (DSA art. 17)** | Årsag gemmes internt; brugeren får ikke selv at vide hvorfor | Send e-mail til brugeren med årsag, hvad der er sket, og at de kan klage ved at skrive til kontaktadressen. (Undtagelse findes i reglen for visse tilfælde, fx svindel — afklares med jurist) | Høj |
| 3 | **Anmeldelse af ulovligt indhold (DSA art. 16)** | Formular findes. Admin fik ingen besked | Besked til admin tilføjet i denne gren. Bør også sende **kvittering til anmelder** og meddele afgørelsen | Mellem |
| 4 | **Vilkår (DSA art. 14)** | 4 punkter | Skal beskrive: regler for brug, moderation/udelukkelse, klageadgang, ansvarsfraskrivelse (formidling, ikke transport), værneting. Udkast herunder | Høj |
| 5 | **Privatlivspolitik (GDPR art. 13)** | Meget kort. Mangler behandlingsgrundlag, modtagere, opbevaring, rettigheder, klage til Datatilsynet | Skal udfyldes. Udkast herunder | Høj |
| 6 | **Databehandlere** | Supabase (database, login), Vercel (hosting), e-mailudbyder, kortudbyder | Indgå/accepter databehandleraftaler (DPA) hos dem og nævn dem i privatlivspolitikken | Høj |
| 7 | **Overførsel til tredjeland** | Vercel kører serverfunktioner i `iad1` (USA) ifølge svarheader; Supabase-region ikke verificeret | Flyt funktioner til EU-region (fx Frankfurt) eller beskriv overførselsgrundlag. Tjek Supabase-regionen | Mellem |
| 8 | **Frivillige bidrag via MobilePay** | Går til din MobilePay Box; kan være indkomst for Dosage | Afklar skat/moms/regnskab med revisor. Teksten "frivilligt, ingen fordele" er god | Mellem |
| 9 | **Vin i Glasset-krydspromovering** | Link på forside, støtteside, footer. Kontakt-e-mail er `@viniglasset.dk`, og Dosage er vinvirksomhed | Skriv tydeligt, at KørMed drives af samme ejer som Vin i Glasset (egen virksomhed), så det ikke fremstår som uafhængig anbefaling (markedsføringsloven). README beskriver den som "ekstern" — ret den tekst | Høj |
| 10 | **Prisloft / samkørsel** | Beregningsmodel markeret "kræver juridisk gennemgang" | Få bekræftet, at bidrag begrænset til omkostningsdeling ikke gør chauffører til erhvervsmæssig persontransport (taxa-/persontransportreglerne) | Høj |
| 11 | **Cookies** | Kun nødvendige cookies, intet banner | Fint. Tjek igen, hvis du tilføjer analyse | Lav |
| 12 | **Adresse offentlig** | Din CVR-adresse vises på kontakt/vilkår/privatliv | Overvej erhvervs-/postadresse, hvis den er din privatadresse | Lav |
| 13 | **Aldersgrænse 18** | Håndhæves ved oprettelse (fødselsdato) | OK. Selvangivet alder, ikke dokumenteret — skriv det i vilkårene | Lav |
| 14 | **Ansvar ved ulykker/tvister** | Ikke beskrevet | Vilkårene bør sige, at KørMed kun formidler kontakt og ikke er part i aftalen eller ansvarlig for kørslen. Tjek om chaufførers bilforsikring dækker passagerer | Høj |

## Udkast: tilføjelser til Vilkår (til jurist at tilpasse)

**Udelukkelse.** KørMed kan til enhver tid og uden forudgående varsel udelukke en bruger fra tjenesten, hvis
brugeren overtræder vilkårene, misbruger tjenesten, opgiver urigtige oplysninger, krænker andre brugere eller på
anden måde optræder uacceptabelt. Udelukkelse er KørMeds eneste sanktion; KørMed pålægger ikke bøder eller gebyrer.
Du får besked om grunden til udelukkelsen på den e-mail, du er tilmeldt med, og kan skrive til [kontakt-e-mail] for
at få afgørelsen vurderet igen. Vi svarer inden for rimelig tid, men er ikke forpligtet til at ophæve en udelukkelse.

**Formidling.** KørMed formidler kontakt mellem privatpersoner, der deler en tur og dens direkte omkostninger.
KørMed er ikke part i aftalen mellem chauffør og passager, udfører ikke persontransport og er ikke ansvarlig for
kørslen, forsinkelser, aflysninger eller skader. Chaufføren er selv ansvarlig for kørekort, køretøjets lovlighed og
forsikring.

**Bidrag.** Bidraget fra passager til chauffør må kun dække en andel af turens direkte omkostninger. Bidrag aftales
og betales direkte mellem brugerne; KørMed modtager ikke betaling for kørsel.

**Alder og oplysninger.** Du skal være mindst 18 år og give korrekte oplysninger. Alder og e-mail bekræftes ikke
med offentligt ID.

## Udkast: punkter privatlivspolitikken skal indeholde (GDPR art. 13)
- Dataansvarlig: Dosage, CVR 30144783, adresse, kontakt-e-mail.
- Hvilke oplysninger: navn, e-mail, evt. telefon, fødselsdato, profiltekst/billede, ture, bookinger, beskeder,
  bedømmelser, IP-adresse i begrænset omfang (sikkerhed/rate limiting), indsendte anmeldelser, frivillige bidrag.
- Formål og grundlag: levere tjenesten (kontrakt, art. 6(1)(b)); sikkerhed og misbrugsbekæmpelse (legitim interesse,
  6(1)(f)); lovkrav (6(1)(c)).
- Modtagere/databehandlere: Supabase, Vercel, e-mailudbyder, kortudbyder (navngiv dem).
- Tredjelandsoverførsler og grundlag.
- Opbevaring: hvor længe konto, beskeder, ture, anmeldelser gemmes, og hvad der sker ved sletning (anonymisering).
- Rettigheder: indsigt, rettelse, sletning, begrænsning, dataportabilitet (eksport findes under Min profil),
  indsigelse; ret til at klage til Datatilsynet (datatilsynet.dk).
- Cookies: kun nødvendige (henvis til cookiesiden).

## Det vi har gjort teknisk (denne gren)
- Lukket et sikkerhedshul, hvor en bruger kunne give sig selv admin-rettigheder.
- Håndhævet udelukkelse (login-spærring, skjulte ture, blokeret oprettelse/booking/beskeder).
- Sikkerhedsheadere (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy).
- E-mail til administrator ved nye anmeldelser (kræver at e-mailudbyder er sat op).
- Natlig automatisk kontrol af sitet (`scripts/overvaagning.mjs`, GitHub Actions).
