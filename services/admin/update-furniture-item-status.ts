import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { furnitureItems } from "@/db/schema/furniture-items";
import { parseFurnitureItemStatus } from "@/lib/validation/admin-status";
import { logAuditEvent } from "@/services/audit/log-event";

export async function updateFurnitureItemStatus(input: {
  itemId: string;
  status: string;
  actorUserId: string;
  rejectionReason?: string;
}) {
  const newStatus = parseFurnitureItemStatus(input.status);
  if (!newStatus) {
    throw new Error("INVALID_STATUS");
  }

  const db = getDb();

  return db.transaction(async (tx) => {
    const [item] = await tx
      .select()
      .from(furnitureItems)
      .where(eq(furnitureItems.id, input.itemId))
      .limit(1);

    if (!item) {
      throw new Error("NOT_FOUND");
    }

    const oldStatus = item.status;

    if (oldStatus === newStatus) {
      return { itemId: item.id, status: newStatus, changed: false };
    }

    const now = new Date();
    const updates: Partial<typeof furnitureItems.$inferInsert> = {
      status: newStatus,
      updatedAt: now,
      reviewedByUserId: input.actorUserId,
      reviewedAt: now,
    };

    if (newStatus === "rejected" && input.rejectionReason?.trim()) {
      updates.rejectionReason = input.rejectionReason.trim();
    }

    await tx
      .update(furnitureItems)
      .set(updates)
      .where(eq(furnitureItems.id, input.itemId));

    await logAuditEvent(tx as unknown as ReturnType<typeof getDb>, {
      action: "furniture_item.status_changed",
      entityType: "furniture_item",
      entityId: input.itemId,
      actorUserId: input.actorUserId,
      oldValues: { status: oldStatus },
      newValues: {
        status: newStatus,
        rejectionReason: updates.rejectionReason ?? null,
      },
      metadata: { source: "admin_items_queue" },
    });

    return { itemId: item.id, status: newStatus, changed: true };
  });
}
