CREATE TABLE IF NOT EXISTS rda_stores (
  store_key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rda_menu_items (
  menu_item_key TEXT PRIMARY KEY,
  store_key TEXT NOT NULL REFERENCES rda_stores(store_key) ON DELETE CASCADE,
  data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS rda_menu_items_store_key_idx ON rda_menu_items(store_key);
