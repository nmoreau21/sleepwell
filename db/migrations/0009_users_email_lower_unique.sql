-- Prevent duplicate application users per email (case-insensitive)

CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_email_lower_unique"
  ON "users" (lower("email"))
  WHERE "email" IS NOT NULL;
