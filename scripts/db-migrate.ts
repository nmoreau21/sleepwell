/**
 * Apply SQL migrations from db/migrations using drizzle-orm migrator.
 * Uses prepare: false for Supabase pooler compatibility.
 */
import { config } from "dotenv";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({ path: ".env.local" });

const url = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env.local.");
  process.exit(1);
}

const migrationsFolder = path.resolve(process.cwd(), "db/migrations");

const isSupabase = url.includes("supabase.com");

const client = postgres(url, {
  max: 1,
  prepare: false,
  connect_timeout: 30,
  idle_timeout: 10,
  ...(isSupabase ? { ssl: "require" } : {}),
});

async function main() {
  const db = drizzle(client);

  console.log(`Applying migrations from ${migrationsFolder}`);

  await migrate(db, { migrationsFolder });

  console.log("Migrations applied successfully.");
}

main()
  .catch((error: unknown) => {
    console.error("Migration failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await client.end({ timeout: 5 });
  });
