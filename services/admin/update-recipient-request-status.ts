import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { recipientRequests } from "@/db/schema/recipient-requests";
import { parseRecipientRequestStatus } from "@/lib/validation/admin-status";
import { logAuditEvent } from "@/services/audit/log-event";

export async function updateRecipientRequestStatus(input: {
  requestId: string;
  status: string;
  actorUserId: string;
  closedReason?: string;
}) {
  const newStatus = parseRecipientRequestStatus(input.status);
  if (!newStatus) {
    throw new Error("INVALID_STATUS");
  }

  const db = getDb();

  return db.transaction(async (tx) => {
    const [request] = await tx
      .select()
      .from(recipientRequests)
      .where(eq(recipientRequests.id, input.requestId))
      .limit(1);

    if (!request) {
      throw new Error("NOT_FOUND");
    }

    const oldStatus = request.status;

    if (oldStatus === newStatus) {
      return { requestId: request.id, status: newStatus, changed: false };
    }

    const now = new Date();
    const updates: Partial<typeof recipientRequests.$inferInsert> = {
      status: newStatus,
      updatedAt: now,
      reviewedByUserId: input.actorUserId,
      reviewedAt: now,
    };

    if (newStatus === "approved") {
      updates.approvedAt = now;
    }

    if (
      (newStatus === "closed" || newStatus === "denied") &&
      input.closedReason?.trim()
    ) {
      updates.closedReason = input.closedReason.trim();
    }

    await tx
      .update(recipientRequests)
      .set(updates)
      .where(eq(recipientRequests.id, input.requestId));

    await logAuditEvent(tx as unknown as ReturnType<typeof getDb>, {
      action: "recipient_request.status_changed",
      entityType: "recipient_request",
      entityId: input.requestId,
      actorUserId: input.actorUserId,
      oldValues: { status: oldStatus },
      newValues: {
        status: newStatus,
        closedReason: updates.closedReason ?? null,
      },
      metadata: { source: "admin_requests_queue" },
    });

    return { requestId: request.id, status: newStatus, changed: true };
  });
}
