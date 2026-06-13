import { NextResponse } from "next/server";

import { checkDatabaseHealth } from "@/lib/db/health";

/**
 * Database connectivity check. Returns status only — no secrets or query details.
 */
export async function GET() {
  const result = await checkDatabaseHealth();

  if (result.ok) {
    return NextResponse.json({
      status: "ok",
      database: "connected",
      latencyMs: result.latencyMs,
      timestamp: new Date().toISOString(),
    });
  }

  const statusCode = result.reason === "not_configured" ? 503 : 503;

  return NextResponse.json(
    {
      status: "error",
      database: result.reason,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode },
  );
}
