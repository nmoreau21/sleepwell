import { NextResponse } from "next/server";

/**
 * Liveness check for deployment and monitoring.
 * Does not require database connectivity (Step 2 adds /api/health/db).
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "sleepwell",
    timestamp: new Date().toISOString(),
  });
}
