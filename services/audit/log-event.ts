import { getDb } from "@/db";
import { auditLog } from "@/db/schema/audit-log";
import { logDonationError } from "@/lib/logging/donation-submission";

type DbClient = ReturnType<typeof getDb>;

export async function logAuditEvent(
  db: DbClient,
  event: {
    action: string;
    entityType: string;
    entityId: string;
    actorUserId?: string | null;
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
  },
) {
  try {
    await db.insert(auditLog).values({
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      actorUserId: event.actorUserId ?? null,
      oldValues: event.oldValues ?? null,
      newValues: event.newValues ?? null,
      metadata: event.metadata ?? null,
    });
  } catch (error) {
    logDonationError("logAuditEvent insert failed", error, {
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
    });
    throw error;
  }
}
