-- MVP Step 12: impact records for completed transfers

CREATE TABLE IF NOT EXISTS "impact_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "match_id" uuid NOT NULL REFERENCES "matches" ("id"),
  "donor_user_id" uuid NOT NULL REFERENCES "users" ("id"),
  "recipient_user_id" uuid NOT NULL REFERENCES "users" ("id"),
  "item_id" uuid NOT NULL REFERENCES "furniture_items" ("id"),
  "recipient_request_id" uuid NOT NULL REFERENCES "recipient_requests" ("id"),
  "category" text NOT NULL,
  "quantity" smallint NOT NULL DEFAULT 1,
  "impact_summary" text NOT NULL,
  "story_public_approved" boolean DEFAULT false NOT NULL,
  "created_by_user_id" uuid REFERENCES "users" ("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "impact_records_quantity_check" CHECK ("quantity" > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_impact_records_match"
  ON "impact_records" ("match_id");

CREATE INDEX IF NOT EXISTS "idx_impact_records_created"
  ON "impact_records" ("created_at" DESC);
