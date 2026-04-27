-- =====================================================
-- JCTC Inventory Tracker — Supabase Schema
-- Run this in the Supabase SQL Editor (one time)
-- =====================================================

-- 1. LOTS TABLE
CREATE TABLE lots (
  id            INTEGER PRIMARY KEY,
  date          DATE,
  auction_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_fees NUMERIC(10,2) NOT NULL DEFAULT 0,
  other_costs   NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_cost    NUMERIC(10,2) GENERATED ALWAYS AS (auction_price + shipping_fees + other_costs) STORED,
  total_units   INTEGER NOT NULL DEFAULT 1,
  cost_per_unit NUMERIC(10,2) GENERATED ALWAYS AS (
    CASE WHEN total_units > 0 THEN (auction_price + shipping_fees + other_costs) / total_units ELSE 0 END
  ) STORED,
  notes         TEXT DEFAULT ''
);

-- 2. ITEMS TABLE
CREATE TABLE items (
  sku              INTEGER PRIMARY KEY,
  lot_id           INTEGER NOT NULL REFERENCES lots(id),
  category         TEXT NOT NULL DEFAULT '',
  brand            TEXT NOT NULL DEFAULT '',
  model            TEXT NOT NULL DEFAULT '',
  msrp             NUMERIC(10,2) NOT NULL DEFAULT 0,
  powers_on        TEXT NOT NULL DEFAULT 'Not Tested (Sealed)',
  core_function    TEXT NOT NULL DEFAULT 'Not Tested (Sealed)',
  accessories      TEXT NOT NULL DEFAULT 'Yes',
  missing_items    TEXT NOT NULL DEFAULT '',
  cosmetic_grade   TEXT NOT NULL DEFAULT 'A',
  functional_grade TEXT NOT NULL DEFAULT 'A (Sealed)',
  tier             TEXT NOT NULL DEFAULT 'Tier 1',
  listed_condition TEXT NOT NULL DEFAULT '',
  listing_status   TEXT NOT NULL DEFAULT 'Not Listed',
  listing_channel  TEXT NOT NULL DEFAULT '',   -- legacy (kept for backward compat)
  list_price       NUMERIC(10,2) NOT NULL DEFAULT 0,   -- legacy
  date_listed      DATE,                               -- legacy
  listing_channel_2 TEXT NOT NULL DEFAULT '',           -- legacy
  list_price_2     NUMERIC(10,2) NOT NULL DEFAULT 0,   -- legacy
  date_listed_2    DATE,                               -- legacy
  listings         JSONB NOT NULL DEFAULT '[]',         -- flexible array of {channel, price, dateListed}
  sale_price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  sold_platform    TEXT NOT NULL DEFAULT '',
  date_sold        DATE,
  payment_method   TEXT NOT NULL DEFAULT '',
  platform_fees    NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_cost    NUMERIC(10,2) NOT NULL DEFAULT 0,
  other_costs      NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes            TEXT NOT NULL DEFAULT ''
);

-- 3. SKU SEQUENCE — tracks the next available SKU number
CREATE TABLE app_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO app_config (key, value) VALUES ('next_sku', '1');

-- 4. FUNCTION: get and increment next SKU (atomic)
CREATE OR REPLACE FUNCTION next_sku()
RETURNS INTEGER AS $$
DECLARE
  current_val INTEGER;
BEGIN
  UPDATE app_config SET value = (value::integer + 1)::text
    WHERE key = 'next_sku'
    RETURNING (value::integer - 1) INTO current_val;
  RETURN current_val;
END;
$$ LANGUAGE plpgsql;

-- 5. ROW LEVEL SECURITY
-- Since this is a single-user app using the anon key, we enable RLS
-- with permissive policies so the app works but the tables aren't
-- wide open to anyone who stumbles on the API URL without the key.
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated and anon roles
CREATE POLICY "Allow all on lots" ON lots
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on items" ON items
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on app_config" ON app_config
  FOR ALL USING (true) WITH CHECK (true);

-- 6. PRICE HISTORY — one row per channel price change.
--    Current price on items.listings (jsonb) remains the source of truth for "current".
CREATE TABLE price_history (
  id          BIGSERIAL PRIMARY KEY,
  item_sku    INTEGER NOT NULL REFERENCES items(sku) ON DELETE CASCADE,
  channel     TEXT NOT NULL DEFAULT '',
  price       NUMERIC(10,2) NOT NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  source      TEXT NOT NULL DEFAULT 'manual'  -- 'seed' | 'manual' | 'reprice' | etc.
);
CREATE INDEX price_history_item_changed_idx
  ON price_history (item_sku, channel, changed_at DESC);
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on price_history" ON price_history
  FOR ALL USING (true) WITH CHECK (true);

-- 7. STATUS HISTORY — one row per status change.
--    Required for pause/resume repricing logic (chunk #6).
CREATE TABLE status_history (
  id          BIGSERIAL PRIMARY KEY,
  item_sku    INTEGER NOT NULL REFERENCES items(sku) ON DELETE CASCADE,
  status      TEXT NOT NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  source      TEXT NOT NULL DEFAULT 'manual'  -- 'seed' | 'initial' | 'manual'
);
CREATE INDEX status_history_item_changed_idx
  ON status_history (item_sku, changed_at DESC);
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on status_history" ON status_history
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- MIGRATION HISTORY (already applied — DO NOT re-run)
-- =====================================================
-- Migration 1: listing_channel_2, list_price_2, date_listed_2
-- Migration 2: sold_platform
-- Migration 3: listings JSONB column (replaces listing_channel/list_price/date_listed pairs)
-- Migration 4: listing_status converted INTEGER -> TEXT (Not Listed/Drafted/Listed/Pending/Sold)
-- Migration 5: price_history + status_history tables, seeded from current items
