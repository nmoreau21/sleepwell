import { sql } from "drizzle-orm";
import {
  boolean,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { furnitureItems } from "./furniture-items";

export const itemPhotos = pgTable("item_photos", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  furnitureItemId: uuid("furniture_item_id")
    .notNull()
    .references(() => furnitureItems.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sortOrder: smallint("sort_order").notNull().default(1),
  isPrimary: boolean("is_primary").notNull().default(false),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
