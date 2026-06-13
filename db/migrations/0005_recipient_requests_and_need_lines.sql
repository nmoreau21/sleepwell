-- MVP Step 2: recipient requests, need lines, partner referral back-link

CREATE TABLE IF NOT EXISTS "recipient_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "recipient_profile_id" uuid NOT NULL REFERENCES "recipient_profiles" ("id"),
  "partner_organization_id" uuid REFERENCES "partner_organizations" ("id"),
  "partner_referral_id" uuid REFERENCES "partner_referrals" ("id"),
  "status" text DEFAULT 'submitted' NOT NULL,
  "priority" text DEFAULT 'standard' NOT NULL,
  "move_in_date" date,
  "housing_address_line1" text,
  "city" text NOT NULL,
  "state" text NOT NULL,
  "zip_code" text NOT NULL,
  "latitude" numeric(9, 6),
  "longitude" numeric(9, 6),
  "access_notes" text,
  "needs_delivery" boolean DEFAULT true NOT NULL,
  "submitted_by_user_id" uuid REFERENCES "users" ("id"),
  "reviewed_by_user_id" uuid REFERENCES "users" ("id"),
  "reviewed_at" timestamptz,
  "approved_at" timestamptz,
  "expires_at" timestamptz,
  "closed_reason" text,
  "notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "recipient_requests_priority_check" CHECK (
    "priority" IN ('emergency', 'urgent', 'standard')
  )
);

CREATE INDEX IF NOT EXISTS "idx_recipient_requests_queue"
  ON "recipient_requests" ("status", "priority", "zip_code");

CREATE TABLE IF NOT EXISTS "request_need_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "recipient_request_id" uuid NOT NULL REFERENCES "recipient_requests" ("id") ON DELETE CASCADE,
  "category" text NOT NULL,
  "essential" boolean DEFAULT true NOT NULL,
  "quantity_needed" smallint DEFAULT 1 NOT NULL,
  "quantity_matched" smallint DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'open' NOT NULL,
  "size_preference" text,
  "notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "request_need_lines_quantity_needed_check" CHECK ("quantity_needed" > 0),
  CONSTRAINT "request_need_lines_status_check" CHECK (
    "status" IN ('open', 'matched', 'fulfilled', 'cancelled')
  )
);

DO $$ BEGIN
  ALTER TABLE "partner_referrals"
    ADD CONSTRAINT "fk_partner_referrals_request"
    FOREIGN KEY ("recipient_request_id") REFERENCES "recipient_requests" ("id");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
