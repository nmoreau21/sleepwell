-- MVP Step 2: donor-held furniture items and photos

CREATE TABLE IF NOT EXISTS "furniture_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "donor_profile_id" uuid NOT NULL REFERENCES "donor_profiles" ("id"),
  "status" text DEFAULT 'submitted' NOT NULL,
  "category" text NOT NULL,
  "title" text,
  "description" text,
  "condition" text NOT NULL,
  "quantity" smallint DEFAULT 1 NOT NULL,
  "width_in" smallint,
  "depth_in" smallint,
  "height_in" smallint,
  "requires_two_person" boolean DEFAULT false NOT NULL,
  "pickup_constraints" text,
  "availability_start" date,
  "availability_end" date,
  "rejection_reason" text,
  "reviewed_by_user_id" uuid REFERENCES "users" ("id"),
  "reviewed_at" timestamptz,
  "address_line1" text,
  "city" text NOT NULL,
  "state" text NOT NULL,
  "zip_code" text NOT NULL,
  "cross_street" text,
  "latitude" numeric(9, 6),
  "longitude" numeric(9, 6),
  "display_location" text,
  "location_privacy_level" text DEFAULT 'zip_only' NOT NULL,
  "duplicate_of_item_id" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "deleted_at" timestamptz,
  CONSTRAINT "furniture_items_condition_check" CHECK (
    "condition" IN ('excellent', 'good', 'fair', 'poor')
  ),
  CONSTRAINT "furniture_items_quantity_check" CHECK ("quantity" > 0),
  CONSTRAINT "furniture_items_location_privacy_level_check" CHECK (
    "location_privacy_level" IN ('exact', 'cross_street', 'zip_only')
  )
);

DO $$ BEGIN
  ALTER TABLE "furniture_items"
    ADD CONSTRAINT "furniture_items_duplicate_of_item_id_fkey"
    FOREIGN KEY ("duplicate_of_item_id") REFERENCES "furniture_items" ("id");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "idx_furniture_items_matching"
  ON "furniture_items" ("status", "category", "zip_code")
  WHERE "deleted_at" IS NULL;

CREATE TABLE IF NOT EXISTS "item_photos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "furniture_item_id" uuid NOT NULL REFERENCES "furniture_items" ("id") ON DELETE CASCADE,
  "url" text NOT NULL,
  "sort_order" smallint DEFAULT 1 NOT NULL,
  "is_primary" boolean DEFAULT false NOT NULL,
  "uploaded_at" timestamptz DEFAULT now() NOT NULL
);
