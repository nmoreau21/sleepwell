import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { furnitureItems } from "./furniture-items";
import { recipientRequests } from "./recipient-requests";
import { requestNeedLines } from "./request-need-lines";
import { users } from "./users";

export const matches = pgTable(
  "matches",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    furnitureItemId: uuid("furniture_item_id")
      .notNull()
      .references(() => furnitureItems.id),
    requestNeedLineId: uuid("request_need_line_id")
      .notNull()
      .references(() => requestNeedLines.id),
    recipientRequestId: uuid("recipient_request_id")
      .notNull()
      .references(() => recipientRequests.id),
    status: text("status").notNull().default("pending_review"),
    transferMethod: text("transfer_method"),
    matchScore: numeric("match_score", { precision: 5, scale: 2 }),
    scoreExplanation: jsonb("score_explanation"),
    isOverride: boolean("is_override").notNull().default(false),
    overrideReason: text("override_reason"),
    approvedByUserId: uuid("approved_by_user_id").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectedByParty: text("rejected_by_party"),
    rejectionReason: text("rejection_reason"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "matches_transfer_method_check",
      sql`${table.transferMethod} IS NULL OR ${table.transferMethod} IN (
        'pickup',
        'volunteer_delivery',
        'storage_then_transfer',
        'recipient_pickup',
        'paid_delivery',
        'storage_exception'
      )`,
    ),
    check(
      "chk_override_reason",
      sql`NOT ${table.isOverride} OR ${table.overrideReason} IS NOT NULL`,
    ),
    uniqueIndex("uq_matches_active_item")
      .on(table.furnitureItemId)
      .where(
        sql`${table.status} NOT IN ('completed', 'cancelled', 'match_rejected', 'match_expired')`,
      ),
    uniqueIndex("uq_matches_active_need_line")
      .on(table.requestNeedLineId)
      .where(
        sql`${table.status} NOT IN ('completed', 'cancelled', 'match_rejected', 'match_expired')`,
      ),
    index("idx_matches_status").on(table.status),
  ],
);
