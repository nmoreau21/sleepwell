import { config } from "dotenv";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

const migrationsFolder = path.resolve(process.cwd(), "db/migrations");
const databaseUrl =
  process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local before running drizzle-kit.",
  );
}

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: migrationsFolder,
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
});
