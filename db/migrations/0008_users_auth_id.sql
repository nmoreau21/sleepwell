-- Step 3: link Supabase Auth users to application users

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_id" uuid;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_auth_id"
  ON "users" ("auth_id")
  WHERE "auth_id" IS NOT NULL;
