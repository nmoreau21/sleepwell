import { sql } from "drizzle-orm";

import { getDb } from "@/db";

export type DatabaseHealthResult =
  | { ok: true; latencyMs: number }
  | { ok: false; reason: "not_configured" | "unavailable"; latencyMs?: number };

/**
 * Lightweight connectivity check. Does not log or return connection strings.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthResult> {
  if (!process.env.DATABASE_URL) {
    return { ok: false, reason: "not_configured" };
  }

  const start = Date.now();

  try {
    const db = getDb();
    await db.execute(sql`SELECT 1 AS ok`);
    return { ok: true, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, reason: "unavailable", latencyMs: Date.now() - start };
  }
}
