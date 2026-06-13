-- MVP Step 2: partner organizations + recipient profile FK

CREATE TABLE IF NOT EXISTS "partner_organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "org_type" text NOT NULL,
  "status" text DEFAULT 'applicant' NOT NULL,
  "referral_code" text NOT NULL UNIQUE,
  "priority_tier" smallint DEFAULT 3 NOT NULL,
  "service_area_zip_codes" text[],
  "primary_contact_name" text,
  "primary_contact_email" text,
  "primary_contact_phone" text,
  "city" text,
  "state" text,
  "zip_code" text,
  "notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "partner_organizations_status_check" CHECK (
    "status" IN ('applicant', 'under_review', 'active', 'probation', 'suspended', 'inactive', 'terminated')
  ),
  CONSTRAINT "partner_organizations_priority_tier_check" CHECK (
    "priority_tier" BETWEEN 1 AND 5
  )
);

DO $$ BEGIN
  ALTER TABLE "recipient_profiles"
    ADD CONSTRAINT "fk_recipient_primary_partner"
    FOREIGN KEY ("primary_partner_org_id") REFERENCES "partner_organizations" ("id");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
