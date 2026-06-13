-- MVP Step 2: partner referrals (recipient_request_id FK added in 0005)

CREATE TABLE IF NOT EXISTS "partner_referrals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "partner_organization_id" uuid NOT NULL REFERENCES "partner_organizations" ("id"),
  "submitted_by_user_id" uuid REFERENCES "users" ("id"),
  "recipient_profile_id" uuid REFERENCES "recipient_profiles" ("id"),
  "recipient_request_id" uuid,
  "status" text DEFAULT 'submitted' NOT NULL,
  "client_first_name" text NOT NULL,
  "client_last_name" text NOT NULL,
  "client_phone" text,
  "move_in_date" date,
  "urgency" text DEFAULT 'standard' NOT NULL,
  "housing_confirmed" boolean DEFAULT false NOT NULL,
  "notes" text,
  "reviewed_by_user_id" uuid REFERENCES "users" ("id"),
  "reviewed_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "partner_referrals_urgency_check" CHECK (
    "urgency" IN ('emergency', 'urgent', 'standard')
  )
);
