import { sql } from "drizzle-orm";
import {
  pgTable,
  smallint,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { roles } from "./roles";
import { users } from "./users";

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    roleId: smallint("role_id")
      .notNull()
      .references(() => roles.id),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    grantedByUserId: uuid("granted_by_user_id").references(() => users.id),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("uq_user_roles_active")
      .on(table.userId, table.roleId)
      .where(sql`${table.revokedAt} IS NULL`),
  ],
);
