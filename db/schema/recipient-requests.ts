import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { partnerOrganizations } from "./partner-organizations";
import { partnerReferrals } from "./partner-referrals";
import { recipientProfiles } from "./recipient-profiles";
import { users } from "./users";

export const recipientRequests = pgTable(
  "recipient_requests",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    recipientProfileId: uuid("recipient_profile_id")
      .notNull()
      .references(() => recipientProfiles.id),
    partnerOrganizationId: uuid("partner_organization_id").references(
      () => partnerOrganizations.id,
    ),
    partnerReferralId: uuid("partner_referral_id").references(
      () => partnerReferrals.id,
    ),
    status: text("status").notNull().default("submitted"),
    priority: text("priority").notNull().default("standard"),
    moveInDate: date("move_in_date"),
    housingAddressLine1: text("housing_address_line1"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    zipCode: text("zip_code").notNull(),
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),
    accessNotes: text("access_notes"),
    needsDelivery: boolean("needs_delivery").notNull().default(true),
    submittedByUserId: uuid("submitted_by_user_id").references(() => users.id),
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    closedReason: text("closed_reason"),
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
      "recipient_requests_priority_check",
      sql`${table.priority} IN ('emergency', 'urgent', 'standard')`,
    ),
    index("idx_recipient_requests_queue").on(
      table.status,
      table.priority,
      table.zipCode,
    ),
  ],
);
