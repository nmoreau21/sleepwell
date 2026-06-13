import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/**
 * Server-side database client.
 * Use only in Server Components, Server Actions, and Route Handlers.
 *
 * Apply migrations with `npm run db:migrate` against your dev Supabase project.
 */
function createDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and configure Supabase.",
    );
  }

  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;

let _db: Database | undefined;

export function getDb(): Database {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

export { schema };
