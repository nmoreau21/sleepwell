import { sql } from "drizzle-orm";
import {
  check,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const partnerOrganizations = pgTable(
  "partner_organizations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    orgType: text("org_type").notNull(),
    status: text("status").notNull().default("applicant"),
    referralCode: text("referral_code").notNull().unique(),
    priorityTier: smallint("priority_tier").notNull().default(3),
    serviceAreaZipCodes: text("service_area_zip_codes").array(),
    primaryContactName: text("primary_contact_name"),
    primaryContactEmail: text("primary_contact_email"),
    primaryContactPhone: text("primary_contact_phone"),
    city: text("city"),
    state: text("state"),
    zipCode: text("zip_code"),
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
      "partner_organizations_status_check",
      sql`${table.status} IN ('applicant', 'under_review', 'active', 'probation', 'suspended', 'inactive', 'terminated')`,
    ),
    check(
      "partner_organizations_priority_tier_check",
      sql`${table.priorityTier} BETWEEN 1 AND 5`,
    ),
  ],
);
