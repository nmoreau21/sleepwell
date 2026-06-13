import { sql } from "drizzle-orm";
import { boolean, check, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

export const donorProfiles = pgTable(
  "donor_profiles",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id),
    donorType: text("donor_type"),
    anonymousImpactOk: boolean("anonymous_impact_ok").notNull().default(true),
    pickupPrivacyLevel: text("pickup_privacy_level").notNull().default("zip_only"),
    notes: text("notes"),
    repeatDonor: boolean("repeat_donor").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "donor_profiles_pickup_privacy_level_check",
      sql`${table.pickupPrivacyLevel} IN ('exact', 'cross_street', 'zip_only')`,
    ),
  ],
);
