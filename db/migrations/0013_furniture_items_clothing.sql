-- Clothing donations: item_kind + flexible metadata on furniture_items (no table rename)

ALTER TABLE "furniture_items"
  ADD COLUMN IF NOT EXISTS "item_kind" text NOT NULL DEFAULT 'furniture';

ALTER TABLE "furniture_items"
  ADD COLUMN IF NOT EXISTS "metadata" jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'furniture_items_item_kind_check'
  ) THEN
    ALTER TABLE "furniture_items"
      ADD CONSTRAINT "furniture_items_item_kind_check"
      CHECK ("item_kind" IN ('furniture', 'clothing'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_furniture_items_item_kind"
  ON "furniture_items" ("item_kind", "status")
  WHERE "deleted_at" IS NULL;
