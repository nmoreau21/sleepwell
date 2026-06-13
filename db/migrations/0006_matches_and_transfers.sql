-- MVP Step 2: matches and transfers

CREATE TABLE IF NOT EXISTS "matches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "furniture_item_id" uuid NOT NULL REFERENCES "furniture_items" ("id"),
  "request_need_line_id" uuid NOT NULL REFERENCES "request_need_lines" ("id"),
  "recipient_request_id" uuid NOT NULL REFERENCES "recipient_requests" ("id"),
  "status" text DEFAULT 'pending_review' NOT NULL,
  "transfer_method" text,
  "match_score" numeric(5, 2),
  "score_explanation" jsonb,
  "is_override" boolean DEFAULT false NOT NULL,
  "override_reason" text,
  "approved_by_user_id" uuid REFERENCES "users" ("id"),
  "approved_at" timestamptz,
  "rejected_by_party" text,
  "rejection_reason" text,
  "expires_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "matches_transfer_method_check" CHECK (
    "transfer_method" IS NULL OR
    "transfer_method" IN ('pickup', 'volunteer_delivery', 'storage_then_transfer')
  ),
  CONSTRAINT "chk_override_reason" CHECK (
    NOT "is_override" OR "override_reason" IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_matches_active_item"
  ON "matches" ("furniture_item_id")
  WHERE "status" NOT IN ('completed', 'cancelled', 'match_rejected', 'match_expired');

CREATE INDEX IF NOT EXISTS "idx_matches_status" ON "matches" ("status");

CREATE TABLE IF NOT EXISTS "transfers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "match_id" uuid NOT NULL REFERENCES "matches" ("id"),
  "transfer_type" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "scheduled_at" timestamptz,
  "completed_at" timestamptz,
  "pickup_address" text,
  "delivery_address" text,
  "meet_point_address" text,
  "reschedule_count" smallint DEFAULT 0 NOT NULL,
  "failure_reason" text,
  "dispute_notes" text,
  "confirmed_by_user_id" uuid REFERENCES "users" ("id"),
  "confirmed_by_role" text,
  "scheduled_by_user_id" uuid REFERENCES "users" ("id"),
  "notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "transfers_transfer_type_check" CHECK (
    "transfer_type" IN ('pickup', 'volunteer_delivery')
  )
);

CREATE INDEX IF NOT EXISTS "idx_transfers_scheduled"
  ON "transfers" ("status", "scheduled_at");
