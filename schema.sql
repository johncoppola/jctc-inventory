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

-- =====================================================
-- MIGRATION HISTORY (already applied — DO NOT re-run)
-- =====================================================
-- Migration 1: listing_channel_2, list_price_2, date_listed_2
-- Migration 2: sold_platform

-- =====================================================
-- MIGRATION 3: Flexible listings JSONB column
-- Run this in the Supabase SQL Editor (one time).
-- =====================================================
-- Step 1: Add the new column
-- ALTER TABLE items ADD COLUMN listings JSONB NOT NULL DEFAULT '[]';
--
-- Step 2: Migrate existing data from legacy columns into listings
-- UPDATE items SET listings =
--   CASE
--     WHEN (listing_channel != '' OR list_price > 0 OR date_listed IS NOT NULL) THEN
--       CASE
--         WHEN (listing_channel_2 != '' OR list_price_2 > 0 OR date_listed_2 IS NOT NULL) THEN
--           jsonb_build_array(
--             jsonb_build_object('channel', listing_channel, 'price', list_price, 'dateListed', date_listed),
--             jsonb_build_object('channel', listing_channel_2, 'price', list_price_2, 'dateListed', date_listed_2)
--           )
--         ELSE
--           jsonb_build_array(
--             jsonb_build_object('channel', listing_channel, 'price', list_price, 'dateListed', date_listed)
--           )
--       END
--     ELSE '[]'::jsonb
--   END;
