-- MVP Step 2: communications log and audit log

CREATE TABLE IF NOT EXISTS "communications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid REFERENCES "users" ("id"),
  "sent_by_user_id" uuid REFERENCES "users" ("id"),
  "channel" text NOT NULL,
  "direction" text NOT NULL,
  "template_code" text,
  "subject" text,
  "body_preview" text,
  "related_entity_type" text,
  "related_entity_id" uuid,
  "status" text DEFAULT 'queued' NOT NULL,
  "provider_message_id" text,
  "sent_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "communications_channel_check" CHECK (
    "channel" IN ('email', 'sms', 'phone', 'in_app')
  ),
  CONSTRAINT "communications_direction_check" CHECK (
    "direction" IN ('outbound', 'inbound')
  ),
  CONSTRAINT "communications_status_check" CHECK (
    "status" IN ('queued', 'sent', 'delivered', 'failed')
  )
);

CREATE INDEX IF NOT EXISTS "idx_communications_user"
  ON "communications" ("user_id", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor_user_id" uuid REFERENCES "users" ("id"),
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" uuid NOT NULL,
  "old_values" jsonb,
  "new_values" jsonb,
  "metadata" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_audit_log_entity"
  ON "audit_log" ("entity_type", "entity_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_audit_log_actor"
  ON "audit_log" ("actor_user_id", "created_at" DESC);
