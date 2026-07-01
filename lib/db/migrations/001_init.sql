CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  username      TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL DEFAULT 'user',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  strain_name     TEXT NOT NULL,
  brand           TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('indica', 'sativa', 'hybrid')),
  category        TEXT NOT NULL,
  thc_percentage  DOUBLE PRECISION NOT NULL,
  cbd_percentage  DOUBLE PRECISION NOT NULL,
  terpene_profile JSONB NOT NULL DEFAULT '[]',
  lab_report_id   TEXT NOT NULL,
  dispensary_id   TEXT NOT NULL DEFAULT '',
  product_key     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_user_id_idx ON products(user_id);
CREATE INDEX IF NOT EXISTS products_lab_report_id_idx ON products(user_id, lab_report_id);
CREATE INDEX IF NOT EXISTS products_product_key_idx ON products(product_key) WHERE product_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS inventory_items (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id      TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity        DOUBLE PRECISION NOT NULL,
  unit            TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  purchase_date   DATE NOT NULL,
  notes           TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS inventory_user_product_idx ON inventory_items(user_id, product_id);

CREATE TABLE IF NOT EXISTS sessions (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date                TIMESTAMPTZ NOT NULL,
  product_id          TEXT NOT NULL,
  consumption_method  TEXT NOT NULL,
  dosage              TEXT NOT NULL,
  pairing_notes       TEXT NOT NULL DEFAULT '',
  rating              SMALLINT NOT NULL,
  mood_before         SMALLINT NOT NULL,
  mood_after          SMALLINT NOT NULL,
  pain_before         SMALLINT NOT NULL,
  pain_after          SMALLINT NOT NULL,
  anxiety_before      SMALLINT NOT NULL,
  anxiety_after       SMALLINT NOT NULL,
  effects_felt        JSONB NOT NULL DEFAULT '[]',
  activities          JSONB NOT NULL DEFAULT '[]',
  session_notes       TEXT NOT NULL DEFAULT '',
  session_name        TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS sessions_user_date_idx ON sessions(user_id, date DESC);

CREATE TABLE IF NOT EXISTS posts (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author        TEXT NOT NULL,
  author_seed   TEXT NOT NULL,
  body          TEXT NOT NULL,
  strain        TEXT,
  circle        TEXT,
  likes         INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);

CREATE TABLE IF NOT EXISTS caa_catalog_entries (
  product_key         TEXT PRIMARY KEY,
  lab_report_id       TEXT NOT NULL UNIQUE,
  strain_name         TEXT NOT NULL,
  brand               TEXT NOT NULL,
  category            TEXT NOT NULL,
  type                TEXT NOT NULL,
  thc_percentage      DOUBLE PRECISION NOT NULL,
  cbd_percentage      DOUBLE PRECISION NOT NULL,
  terpene_profile     JSONB NOT NULL DEFAULT '[]',
  compliance_status   TEXT NOT NULL DEFAULT 'confirmed',
  registered_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
