-- Bootstrap migration (Step 1)
-- Full MVP schema lands in Step 2. See docs/database-design.md

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "roles" (
  "id" smallint PRIMARY KEY NOT NULL,
  "code" text NOT NULL UNIQUE,
  "name" text NOT NULL
);

INSERT INTO "roles" ("id", "code", "name") VALUES
  (1, 'donor', 'Donor'),
  (2, 'recipient', 'Recipient'),
  (3, 'volunteer', 'Volunteer'),
  (4, 'partner_user', 'Partner User'),
  (5, 'admin', 'Administrator')
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text,
  "phone" text,
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "preferred_name" text,
  "status" text DEFAULT 'active' NOT NULL,
  "communication_preference" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "deleted_at" timestamptz,
  CONSTRAINT "users_status_check" CHECK ("status" IN ('active', 'inactive', 'suspended')),
  CONSTRAINT "users_communication_preference_check" CHECK (
    "communication_preference" IS NULL OR
    "communication_preference" IN ('email', 'sms', 'phone', 'partner_mediated')
  )
);

CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email") WHERE "deleted_at" IS NULL;
