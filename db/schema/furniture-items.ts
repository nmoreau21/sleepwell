import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  jsonb,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { donorProfiles } from "./donor-profiles";
import { users } from "./users";

/** Clothing-specific fields stored in metadata for item_kind = clothing. */
export type DonationItemMetadata = {
  clothing_type?: "tops" | "bottoms";
  size?: string;
  gender_category?: "men" | "women" | "kids" | "unisex";
};

export const furnitureItems = pgTable(
  "furniture_items",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    donorProfileId: uuid("donor_profile_id")
      .notNull()
      .references(() => donorProfiles.id),
    itemKind: text("item_kind").notNull().default("furniture"),
    status: text("status").notNull().default("submitted"),
    category: text("category").notNull(),
    title: text("title"),
    description: text("description"),
    condition: text("condition").notNull(),
    quantity: smallint("quantity").notNull().default(1),
    metadata: jsonb("metadata").$type<DonationItemMetadata | null>(),
    widthIn: smallint("width_in"),
    depthIn: smallint("depth_in"),
    heightIn: smallint("height_in"),
    requiresTwoPerson: boolean("requires_two_person").notNull().default(false),
    pickupConstraints: text("pickup_constraints"),
    availabilityStart: date("availability_start"),
    availabilityEnd: date("availability_end"),
    rejectionReason: text("rejection_reason"),
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    addressLine1: text("address_line1"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    zipCode: text("zip_code").notNull(),
    crossStreet: text("cross_street"),
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),
    displayLocation: text("display_location"),
    locationPrivacyLevel: text("location_privacy_level")
      .notNull()
      .default("zip_only"),
    duplicateOfItemId: uuid("duplicate_of_item_id"),
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
      "furniture_items_condition_check",
      sql`${table.condition} IN ('excellent', 'good', 'fair', 'poor')`,
    ),
    check(
      "furniture_items_quantity_check",
      sql`${table.quantity} > 0`,
    ),
    check(
      "furniture_items_location_privacy_level_check",
      sql`${table.locationPrivacyLevel} IN ('exact', 'cross_street', 'zip_only')`,
    ),
    check(
      "furniture_items_item_kind_check",
      sql`${table.itemKind} IN ('furniture', 'clothing')`,
    ),
    index("idx_furniture_items_matching")
      .on(table.status, table.category, table.zipCode)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);
