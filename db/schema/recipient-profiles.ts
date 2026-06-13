import { sql } from "drizzle-orm";
import {
  boolean,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { partnerOrganizations } from "./partner-organizations";
import { users } from "./users";

export const recipientProfiles = pgTable("recipient_profiles", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  householdSize: smallint("household_size"),
  hasVehicle: boolean("has_vehicle"),
  canPickupLargeItems: boolean("can_pickup_large_items"),
  needsDelivery: boolean("needs_delivery").notNull().default(true),
  accessNotes: text("access_notes"),
  housingVerified: boolean("housing_verified").notNull().default(false),
  housingVerifiedAt: timestamp("housing_verified_at", { withTimezone: true }),
  housingVerifiedByUserId: uuid("housing_verified_by_user_id").references(
    () => users.id,
  ),
  primaryPartnerOrgId: uuid("primary_partner_org_id").references(
    () => partnerOrganizations.id,
  ),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
