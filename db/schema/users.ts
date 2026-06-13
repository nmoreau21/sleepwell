import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Core user records — profiles and role extensions added in Step 2.
 * See docs/database-design.md
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    authId: uuid("auth_id"),
    email: text("email"),
    phone: text("phone"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    preferredName: text("preferred_name"),
    status: text("status").notNull().default("active"),
    communicationPreference: text("communication_preference"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    check(
      "users_status_check",
      sql`${table.status} IN ('active', 'inactive', 'suspended')`,
    ),
    check(
      "users_communication_preference_check",
      sql`${table.communicationPreference} IS NULL OR ${table.communicationPreference} IN ('email', 'sms', 'phone', 'partner_mediated')`,
    ),
    index("idx_users_email")
      .on(table.email)
      .where(sql`${table.deletedAt} IS NULL`),
    uniqueIndex("idx_users_auth_id")
      .on(table.authId)
      .where(sql`${table.authId} IS NOT NULL`),
  ],
);
