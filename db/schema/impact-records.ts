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

import { furnitureItems } from "./furniture-items";
import { matches } from "./matches";
import { recipientRequests } from "./recipient-requests";
import { users } from "./users";

export const impactRecords = pgTable(
  "impact_records",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id),
    donorUserId: uuid("donor_user_id")
      .notNull()
      .references(() => users.id),
    recipientUserId: uuid("recipient_user_id")
      .notNull()
      .references(() => users.id),
    itemId: uuid("item_id")
      .notNull()
      .references(() => furnitureItems.id),
    recipientRequestId: uuid("recipient_request_id")
      .notNull()
      .references(() => recipientRequests.id),
    category: text("category").notNull(),
    quantity: smallint("quantity").notNull().default(1),
    impactSummary: text("impact_summary").notNull(),
    storyPublicApproved: boolean("story_public_approved").notNull().default(false),
    createdByUserId: uuid("created_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("impact_records_quantity_check", sql`${table.quantity} > 0`),
    uniqueIndex("uq_impact_records_match").on(table.matchId),
    index("idx_impact_records_created").on(table.createdAt),
  ],
);
