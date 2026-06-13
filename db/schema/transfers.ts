import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { matches } from "./matches";
import { users } from "./users";

export const transfers = pgTable(
  "transfers",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id),
    transferType: text("transfer_type").notNull(),
    status: text("status").notNull().default("pending"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    scheduledStart: timestamp("scheduled_start", { withTimezone: true }),
    scheduledEnd: timestamp("scheduled_end", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    pickupAddress: text("pickup_address"),
    deliveryAddress: text("delivery_address"),
    meetPointAddress: text("meet_point_address"),
    pickupInstructions: text("pickup_instructions"),
    deliveryInstructions: text("delivery_instructions"),
    donorContactConfirmed: boolean("donor_contact_confirmed")
      .notNull()
      .default(false),
    recipientContactConfirmed: boolean("recipient_contact_confirmed")
      .notNull()
      .default(false),
    rescheduleCount: smallint("reschedule_count").notNull().default(0),
    failureReason: text("failure_reason"),
    disputeNotes: text("dispute_notes"),
    confirmedByUserId: uuid("confirmed_by_user_id").references(() => users.id),
    confirmedByRole: text("confirmed_by_role"),
    scheduledByUserId: uuid("scheduled_by_user_id").references(() => users.id),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "transfers_transfer_type_check",
      sql`${table.transferType} IN (
        'pickup',
        'volunteer_delivery',
        'recipient_pickup',
        'paid_delivery',
        'storage_exception'
      )`,
    ),
    index("idx_transfers_scheduled").on(table.status, table.scheduledAt),
    uniqueIndex("uq_transfers_active_match")
      .on(table.matchId)
      .where(sql`${table.status} NOT IN ('completed', 'cancelled', 'failed')`),
  ],
);
