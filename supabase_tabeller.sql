-- ══════════════════════════════════════════════════════════════════════════
-- AWELL FELTPORTAL — Supabase tabeller
-- Kør dette i Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════

-- ── Besigtigelse ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS besigtigelse (
  id              BIGSERIAL PRIMARY KEY,
  oprettet        TIMESTAMPTZ DEFAULT NOW(),
  sagsnr          TEXT,
  kunde           TEXT,
  operator        TEXT,
  dato            DATE,
  formal          TEXT,
  formal_fri      TEXT,
  kontakt         TEXT,
  tlf             TEXT,
  email           TEXT,
  tilstede        TEXT,
  adresse         TEXT,
  matr            TEXT,
  ejd_type        TEXT,
  lat             NUMERIC,
  lng             NUMERIC,
  adgang          TEXT,
  adgang_note     TEXT,
  terrain         TEXT,
  areal           TEXT,
  lok_note        TEXT,
  obs             TEXT,
  grundvand       TEXT,
  jord            TEXT,
  hydro           TEXT,
  risiko          TEXT,
  risiko_note     TEXT,
  anbefaling      TEXT,
  anbefaling_note TEXT,
  sign_name       TEXT,
  sign_date       TEXT,
  approve_name    TEXT,
  approve_date    TEXT,
  final_note      TEXT,
  status          TEXT DEFAULT 'Igangværende'
);

CREATE TABLE IF NOT EXISTS besigtigelse_boringer (
  id              BIGSERIAL PRIMARY KEY,
  besigtigelse_id BIGINT REFERENCES besigtigelse(id) ON DELETE CASCADE,
  nr              TEXT,
  fundet          TEXT,
  type            TEXT,
  konstr          TEXT,
  dybde           NUMERIC,
  tilstand        TEXT,
  note            TEXT
);

-- ── Boreopgave ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS boreopgave (
  id              BIGSERIAL PRIMARY KEY,
  oprettet        TIMESTAMPTZ DEFAULT NOW(),
  dgu             TEXT,
  sag             TEXT,
  kunde           TEXT,
  operator        TEXT,
  dato_start      DATE,
  dato_slut       DATE,
  adresse         TEXT,
  matr            TEXT,
  ejd             TEXT,
  lat             NUMERIC,
  lng             NUMERIC,
  formal          TEXT,
  bemærkning      TEXT,
  metode          TEXT,
  rigg            TEXT,
  diam            NUMERIC,
  dybde           NUMERIC,
  kote            NUMERIC,
  vandspejl       NUMERIC,
  artesisk        TEXT,
  skyl_type       TEXT,
  skyl_forbrug    NUMERIC,
  borenote        TEXT,
  for_mat         TEXT,
  for_dim         NUMERIC,
  for_dybde       NUMERIC,
  grus_fra        NUMERIC,
  grus_til        NUMERIC,
  grus_korn       TEXT,
  grus_maengde    NUMERIC,
  cem_fra         NUMERIC,
  cem_til         NUMERIC,
  cem_type        TEXT,
  cem_maengde     NUMERIC,
  hoved_type      TEXT,
  hoved_kote      NUMERIC,
  konstr_note     TEXT,
  sign_name       TEXT,
  sign_date       TEXT,
  approve_name    TEXT,
  approve_date    TEXT,
  final_note      TEXT,
  status          TEXT DEFAULT 'Igangværende'
);

CREATE TABLE IF NOT EXISTS boreopgave_lag (
  id              BIGSERIAL PRIMARY KEY,
  boreopgave_id   BIGINT REFERENCES boreopgave(id) ON DELETE CASCADE,
  fra             NUMERIC,
  til             NUMERIC,
  jordart         TEXT,
  farve           TEXT,
  korn            TEXT,
  vand            TEXT,
  note            TEXT
);

CREATE TABLE IF NOT EXISTS boreopgave_filtre (
  id              BIGSERIAL PRIMARY KEY,
  boreopgave_id   BIGINT REFERENCES boreopgave(id) ON DELETE CASCADE,
  fra             NUMERIC,
  til             NUMERIC,
  slids           NUMERIC,
  mat             TEXT,
  dim             NUMERIC
);

CREATE TABLE IF NOT EXISTS boreopgave_materialer (
  id              BIGSERIAL PRIMARY KEY,
  boreopgave_id   BIGINT REFERENCES boreopgave(id) ON DELETE CASCADE,
  navn            TEXT,
  kat             TEXT,
  antal           NUMERIC,
  enhed           TEXT,
  note            TEXT
);

-- ── Tilføj målinger-tabel til forsog (hvis ikke allerede oprettet) ──────────
CREATE TABLE IF NOT EXISTS maalinger (
  id              BIGSERIAL PRIMARY KEY,
  forsog_id       BIGINT REFERENCES forsog(id) ON DELETE CASCADE,
  nr              INT,
  tid             TEXT,
  min_siden_start NUMERIC,
  pejling         NUMERIC,
  saenkning       NUMERIC,
  ydelse          NUMERIC
);

-- ── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE besigtigelse          ENABLE ROW LEVEL SECURITY;
ALTER TABLE besigtigelse_boringer ENABLE ROW LEVEL SECURITY;
ALTER TABLE boreopgave            ENABLE ROW LEVEL SECURITY;
ALTER TABLE boreopgave_lag        ENABLE ROW LEVEL SECURITY;
ALTER TABLE boreopgave_filtre     ENABLE ROW LEVEL SECURITY;
ALTER TABLE boreopgave_materialer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alle kan læse og skrive besigtigelse"
  ON besigtigelse FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Alle kan læse og skrive besigtigelse_boringer"
  ON besigtigelse_boringer FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Alle kan læse og skrive boreopgave"
  ON boreopgave FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Alle kan læse og skrive boreopgave_lag"
  ON boreopgave_lag FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Alle kan læse og skrive boreopgave_filtre"
  ON boreopgave_filtre FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Alle kan læse og skrive boreopgave_materialer"
  ON boreopgave_materialer FOR ALL USING (true) WITH CHECK (true);
