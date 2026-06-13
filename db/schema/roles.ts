import { smallint, text } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";

/**
 * Reference roles — see docs/database-design.md and docs/user-types.md
 */
export const roles = pgTable("roles", {
  id: smallint("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
});
