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
  listing_status   INTEGER NOT NULL DEFAULT 1,
  listing_channel  TEXT NOT NULL DEFAULT '',
  list_price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  date_listed      DATE,
  listing_channel_2 TEXT NOT NULL DEFAULT '',
  list_price_2     NUMERIC(10,2) NOT NULL DEFAULT 0,
  date_listed_2    DATE,
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

-- =====================================================
-- MIGRATION: Add second listing channel columns
-- Run this in the Supabase SQL Editor if you already
-- have an existing database (one time).
-- =====================================================
-- ALTER TABLE items ADD COLUMN listing_channel_2 TEXT NOT NULL DEFAULT '';
-- ALTER TABLE items ADD COLUMN list_price_2 NUMERIC(10,2) NOT NULL DEFAULT 0;
-- ALTER TABLE items ADD COLUMN date_listed_2 DATE;

-- MIGRATION 2: Add sold_platform column
-- ALTER TABLE items ADD COLUMN sold_platform TEXT NOT NULL DEFAULT '';
