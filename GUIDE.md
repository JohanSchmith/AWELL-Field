# Awell Pumpeforsøgs-app — Opsætningsguide

## Hvad du skal bruge
- En computer med internet
- Ca. 45–60 minutter første gang
- En e-mailadresse til at oprette konti

Ingen programmering nødvendigt. Følg trinene i rækkefølge.

---

## Trin 1 — Hent koden fra GitHub

Koden til appen ligger klar som en zip-fil. Du behøver ikke forstå den.

1. Gå til **github.com** og opret en gratis konto (eller log ind)
2. Klik **"New repository"** (grøn knap øverst til højre)
3. Giv det et navn, f.eks. `awell-pumpeforsog`
4. Sæt den til **Private**
5. Klik **"Create repository"**
6. Klik **"uploading an existing file"**
7. Træk alle filer fra den udpakkede zip ind i vinduet
8. Klik **"Commit changes"**

✅ Koden ligger nu sikkert på GitHub.

---

## Trin 2 — Opret database på Supabase

Supabase er en gratis database i skyen. Her gemmes alle forsøg.

1. Gå til **supabase.com** og klik **"Start your project"**
2. Log ind med din GitHub-konto (letteste)
3. Klik **"New project"**
4. Udfyld:
   - **Name:** `awell-pumpeforsog`
   - **Database Password:** vælg et stærkt kodeord (gem det!)
   - **Region:** `West EU (Ireland)`
5. Klik **"Create new project"** — vent ca. 1 minut

### Opret tabeller

6. Klik på **"SQL Editor"** i menuen til venstre
7. Klik **"New query"**
8. Kopier denne tekst ind i feltet og klik **"Run"**:

```sql
-- Tabel til forsøg (stamdata)
CREATE TABLE forsog (
  id              BIGSERIAL PRIMARY KEY,
  oprettet        TIMESTAMPTZ DEFAULT NOW(),
  boringsnr       TEXT,
  adresse         TEXT,
  kunde           TEXT,
  operator        TEXT,
  forsog_type     TEXT,
  dato            DATE,
  mp_kote         NUMERIC,
  rorlangde       NUMERIC,
  mp_betegnelse   TEXT,
  rovand          NUMERIC,
  bundpejling     NUMERIC,
  pumpedybde      NUMERIC,
  pumpetype       TEXT,
  pumpeydelse     NUMERIC,
  bemærkning      TEXT,
  start_tid       TIMESTAMPTZ,
  sign_name       TEXT,
  sign_date       TEXT,
  approve_name    TEXT,
  approve_date    TEXT,
  final_note      TEXT
);

-- Tabel til individuelle målinger
CREATE TABLE maalinger (
  id              BIGSERIAL PRIMARY KEY,
  forsog_id       BIGINT REFERENCES forsog(id),
  nr              INT,
  tid             TEXT,
  min_siden_start NUMERIC,
  pejling         NUMERIC,
  saenkning       NUMERIC,
  ydelse          NUMERIC
);

-- Tillad læsning og skrivning fra appen
ALTER TABLE forsog   ENABLE ROW LEVEL SECURITY;
ALTER TABLE maalinger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alle kan læse og skrive forsog"
  ON forsog FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Alle kan læse og skrive maalinger"
  ON maalinger FOR ALL USING (true) WITH CHECK (true);
```

9. Du bør se **"Success. No rows returned"** — det er korrekt.

### Find dine API-nøgler

10. Klik på **"Project Settings"** (tandhjulet) i menuen til venstre
11. Klik **"API"**
12. Kopiér og gem disse to værdier — du skal bruge dem i næste trin:
    - **Project URL** (ser ud som `https://xxxx.supabase.co`)
    - **anon public** (lang kode under "Project API keys")

✅ Databasen er klar.

---

## Trin 3 — Indsæt dine nøgler i koden

1. Gå tilbage til dit GitHub-repository
2. Klik på filen **`public/app.js`**
3. Klik på **blyantsikonet** (Edit this file) øverst til højre
4. Find disse to linjer øverst i filen:

```
const SUPABASE_URL = 'DIN_SUPABASE_URL';
const SUPABASE_KEY = 'DIN_SUPABASE_ANON_KEY';
```

5. Erstat `DIN_SUPABASE_URL` med din Project URL fra trin 2
6. Erstat `DIN_SUPABASE_ANON_KEY` med din anon-nøgle fra trin 2
7. Klik **"Commit changes"**

✅ Appen er nu koblet til databasen.

---

## Trin 4 — Publicér appen på Vercel

Vercel er gratis hosting. Appen får sin egen webadresse her.

1. Gå til **vercel.com** og klik **"Sign Up"**
2. Vælg **"Continue with GitHub"** og log ind
3. Klik **"Add New Project"**
4. Find dit repository `awell-pumpeforsog` i listen og klik **"Import"**
5. Lad alle indstillinger være som de er
6. Klik **"Deploy"**
7. Vent ca. 1 minut — Vercel bygger og publicerer appen

8. Når det er færdigt ser du en grøn **"Congratulations"**-side
9. Din app har nu en adresse, f.eks. `awell-pumpeforsog.vercel.app`

✅ Appen er live og tilgængelig for alle med linket.

---

## Trin 5 — Test appen

1. Åbn adressen i din browser (og på din telefon)
2. Udfyld et testforsøg med et par målinger
3. Gå til **Eksport** og tryk **PDF-rapport** — rapporten åbner i en ny fane klar til print

### Se data i databasen

4. Gå til Supabase → **Table Editor**
5. Klik på tabellen **forsog** — du bør se din testregistrering
6. Klik på **maalinger** — du bør se de tilhørende målinger

✅ Alt virker!

---

## Trin 6 (valgfrit) — Eget domæne

Hvis I vil have adressen til at hedde f.eks. `app.awell.dk` i stedet for `awell-pumpeforsog.vercel.app`:

1. I Vercel, gå til dit projekt → **Settings** → **Domains**
2. Skriv `app.awell.dk` og klik **Add**
3. Vercel viser en DNS-record — log ind hos jeres domæneregistrar og tilføj den
4. Efter ca. 10 minutter virker det eget domæne

---

## Fremtidig brug

**Medarbejdere i felten** åbner blot adressen i mobilbrowseren — ingen app-download nødvendigt. Appen fungerer på alle telefoner og tablets.

**Kontoret** kan til enhver tid se alle forsøg i Supabase Table Editor, eller eksportere dem til Excel via **CSV-knappen** i appen.

**Opdateringer** — hvis I vil have nye funktioner i appen, kan koden opdateres via GitHub, og Vercel deployer automatisk inden for et minut.

---

## Hjælp og support

Noget der ikke virker? Skriv til Claude med en beskrivelse af fejlen — så hjælper vi med at løse det.
