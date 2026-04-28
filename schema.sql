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
  bstock_item_code TEXT NOT NULL DEFAULT '',  -- "Item #" from BStock manifest; shared by all units of one manifest line
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

-- 8. ITEM MEDIA — one row per uploaded photo OR video, stored in Supabase Storage bucket 'item-photos'.
--    Storage path convention: '{sku}/{uuid}.{ext}'. Public bucket so listings can use direct URLs.
--    Media type is derived from the file extension (no media_type column).
CREATE TABLE item_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_sku      INTEGER NOT NULL REFERENCES items(sku) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,                       -- e.g. '123/abc-def.jpg' or '123/abc-def.mp4'
  public_url    TEXT NOT NULL,                       -- denormalised so the UI doesn't have to reconstruct it
  position      INTEGER NOT NULL DEFAULT 0,          -- ordering within a SKU
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  source        TEXT NOT NULL DEFAULT 'capture',    -- 'capture' | 'clone'
  is_hero       BOOLEAN NOT NULL DEFAULT false      -- chunk #8: one-per-SKU enforced by trigger below
);
CREATE INDEX item_photos_sku_position_idx ON item_photos (item_sku, position);
ALTER TABLE item_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on item_photos" ON item_photos
  FOR ALL USING (true) WITH CHECK (true);

-- One-hero-per-SKU enforcement (chunk #8): when a row is inserted/updated with
-- is_hero=true, unset is_hero on every other row for the same SKU. Falsey
-- updates are not affected (WHEN clause), so no recursion.
CREATE OR REPLACE FUNCTION enforce_one_hero_per_sku()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_hero THEN
    UPDATE item_photos
       SET is_hero = false
     WHERE item_sku = NEW.item_sku
       AND id <> NEW.id
       AND is_hero = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER item_photos_one_hero_trigger
  BEFORE INSERT OR UPDATE OF is_hero ON item_photos
  FOR EACH ROW
  WHEN (NEW.is_hero = true)
  EXECUTE FUNCTION enforce_one_hero_per_sku();

-- Storage bucket setup (run once via Supabase Studio or storage SQL):
--   INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
--   VALUES ('item-photos','item-photos',true,209715200,
--           ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif',
--                 'video/mp4','video/quicktime','video/webm','video/x-m4v','video/3gpp']);
-- Permissive RLS policies on storage.objects for SELECT/INSERT/UPDATE/DELETE
-- where bucket_id = 'item-photos'. (Single-user app — same model as the public tables.)

-- =====================================================
-- MIGRATION HISTORY (already applied — DO NOT re-run)
-- =====================================================
-- Migration 1: listing_channel_2, list_price_2, date_listed_2
-- Migration 2: sold_platform
-- Migration 3: listings JSONB column (replaces listing_channel/list_price/date_listed pairs)
-- Migration 4: listing_status converted INTEGER -> TEXT (Not Listed/Drafted/Listed/Pending/Sold)
-- Migration 5: price_history + status_history tables, seeded from current items
-- Migration 6: items.bstock_item_code TEXT NOT NULL DEFAULT '' + indexed; backfilled lots 2 & 3 from manifests
-- Migration 7: item_photos table + 'item-photos' storage bucket with permissive policies
-- Migration 9: item_photos.is_hero BOOLEAN NOT NULL DEFAULT false +
--   enforce_one_hero_per_sku() trigger (one-hero-per-SKU semantics).
-- Migration 8: item-photos bucket expanded to allow videos + 200 MB file size:
--   UPDATE storage.buckets
--   SET file_size_limit = 209715200,
--       allowed_mime_types = ARRAY[
--         'image/jpeg','image/png','image/webp','image/heic','image/heif',
--         'video/mp4','video/quicktime','video/webm','video/x-m4v','video/3gpp'
--       ]
--   WHERE id = 'item-photos';
