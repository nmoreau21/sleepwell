import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { partnerOrganizations } from "./partner-organizations";
import { recipientProfiles } from "./recipient-profiles";
import { users } from "./users";

export const partnerReferrals = pgTable(
  "partner_referrals",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    partnerOrganizationId: uuid("partner_organization_id")
      .notNull()
      .references(() => partnerOrganizations.id),
    submittedByUserId: uuid("submitted_by_user_id").references(() => users.id),
    recipientProfileId: uuid("recipient_profile_id").references(
      () => recipientProfiles.id,
    ),
    /** FK to recipient_requests — constraint in migration 0005. */
    recipientRequestId: uuid("recipient_request_id"),
    status: text("status").notNull().default("submitted"),
    clientFirstName: text("client_first_name").notNull(),
    clientLastName: text("client_last_name").notNull(),
    clientPhone: text("client_phone"),
    moveInDate: date("move_in_date"),
    urgency: text("urgency").notNull().default("standard"),
    housingConfirmed: boolean("housing_confirmed").notNull().default(false),
    notes: text("notes"),
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "partner_referrals_urgency_check",
      sql`${table.urgency} IN ('emergency', 'urgent', 'standard')`,
    ),
  ],
);
