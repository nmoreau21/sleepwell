-- Active match uniqueness per need line + transfer scheduling fields

CREATE UNIQUE INDEX IF NOT EXISTS "uq_matches_active_need_line"
  ON "matches" ("request_need_line_id")
  WHERE "status" NOT IN ('completed', 'cancelled', 'match_rejected', 'match_expired');

ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_transfer_method_check";

ALTER TABLE "matches"
  ADD CONSTRAINT "matches_transfer_method_check" CHECK (
    "transfer_method" IS NULL OR
    "transfer_method" IN (
      'pickup',
      'volunteer_delivery',
      'storage_then_transfer',
      'recipient_pickup',
      'paid_delivery',
      'storage_exception'
    )
  );

ALTER TABLE "transfers" ADD COLUMN IF NOT EXISTS "scheduled_start" timestamptz;
ALTER TABLE "transfers" ADD COLUMN IF NOT EXISTS "scheduled_end" timestamptz;
ALTER TABLE "transfers" ADD COLUMN IF NOT EXISTS "pickup_instructions" text;
ALTER TABLE "transfers" ADD COLUMN IF NOT EXISTS "delivery_instructions" text;
ALTER TABLE "transfers" ADD COLUMN IF NOT EXISTS "donor_contact_confirmed" boolean DEFAULT false NOT NULL;
ALTER TABLE "transfers" ADD COLUMN IF NOT EXISTS "recipient_contact_confirmed" boolean DEFAULT false NOT NULL;

ALTER TABLE "transfers" DROP CONSTRAINT IF EXISTS "transfers_transfer_type_check";

ALTER TABLE "transfers"
  ADD CONSTRAINT "transfers_transfer_type_check" CHECK (
    "transfer_type" IN (
      'pickup',
      'volunteer_delivery',
      'recipient_pickup',
      'paid_delivery',
      'storage_exception'
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS "uq_transfers_active_match"
  ON "transfers" ("match_id")
  WHERE "status" NOT IN ('completed', 'cancelled', 'failed');
