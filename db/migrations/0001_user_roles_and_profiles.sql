-- MVP Step 2: roles assignment and profile tables

CREATE TABLE IF NOT EXISTS "user_roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users" ("id"),
  "role_id" smallint NOT NULL REFERENCES "roles" ("id"),
  "granted_at" timestamptz DEFAULT now() NOT NULL,
  "granted_by_user_id" uuid REFERENCES "users" ("id"),
  "revoked_at" timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_user_roles_active"
  ON "user_roles" ("user_id", "role_id")
  WHERE "revoked_at" IS NULL;

CREATE TABLE IF NOT EXISTS "donor_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL UNIQUE REFERENCES "users" ("id"),
  "donor_type" text,
  "anonymous_impact_ok" boolean DEFAULT true NOT NULL,
  "pickup_privacy_level" text DEFAULT 'zip_only' NOT NULL,
  "notes" text,
  "repeat_donor" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "donor_profiles_pickup_privacy_level_check" CHECK (
    "pickup_privacy_level" IN ('exact', 'cross_street', 'zip_only')
  )
);

CREATE TABLE IF NOT EXISTS "recipient_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL UNIQUE REFERENCES "users" ("id"),
  "household_size" smallint,
  "has_vehicle" boolean,
  "can_pickup_large_items" boolean,
  "needs_delivery" boolean DEFAULT true NOT NULL,
  "access_notes" text,
  "housing_verified" boolean DEFAULT false NOT NULL,
  "housing_verified_at" timestamptz,
  "housing_verified_by_user_id" uuid REFERENCES "users" ("id"),
  "primary_partner_org_id" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
