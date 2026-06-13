import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { recipientRequests } from "./recipient-requests";

export const requestNeedLines = pgTable(
  "request_need_lines",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    recipientRequestId: uuid("recipient_request_id")
      .notNull()
      .references(() => recipientRequests.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    essential: boolean("essential").notNull().default(true),
    quantityNeeded: smallint("quantity_needed").notNull().default(1),
    quantityMatched: smallint("quantity_matched").notNull().default(0),
    status: text("status").notNull().default("open"),
    sizePreference: text("size_preference"),
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
      "request_need_lines_quantity_needed_check",
      sql`${table.quantityNeeded} > 0`,
    ),
    check(
      "request_need_lines_status_check",
      sql`${table.status} IN ('open', 'matched', 'fulfilled', 'cancelled')`,
    ),
  ],
);
