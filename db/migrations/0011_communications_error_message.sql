-- Store provider errors on failed communications (Step 11)

ALTER TABLE "communications" ADD COLUMN IF NOT EXISTS "error_message" text;
