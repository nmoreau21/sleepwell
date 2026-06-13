import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./users";

export const communications = pgTable(
  "communications",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id").references(() => users.id),
    sentByUserId: uuid("sent_by_user_id").references(() => users.id),
    channel: text("channel").notNull(),
    direction: text("direction").notNull(),
    templateCode: text("template_code"),
    subject: text("subject"),
    bodyPreview: text("body_preview"),
    relatedEntityType: text("related_entity_type"),
    relatedEntityId: uuid("related_entity_id"),
    status: text("status").notNull().default("queued"),
    providerMessageId: text("provider_message_id"),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "communications_channel_check",
      sql`${table.channel} IN ('email', 'sms', 'phone', 'in_app')`,
    ),
    check(
      "communications_direction_check",
      sql`${table.direction} IN ('outbound', 'inbound')`,
    ),
    check(
      "communications_status_check",
      sql`${table.status} IN ('queued', 'sent', 'delivered', 'failed')`,
    ),
    index("idx_communications_user").on(table.userId, table.createdAt),
  ],
);
