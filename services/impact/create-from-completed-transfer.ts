import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { impactRecords } from "@/db/schema/impact-records";
import { buildImpactSummary } from "@/lib/impact/build-summary";
import { logAuditEvent } from "@/services/audit/log-event";

type DbClient = ReturnType<typeof getDb>;

export type CreateImpactRecordInput = {
  matchId: string;
  donorUserId: string;
  recipientUserId: string;
  itemId: string;
  recipientRequestId: string;
  category: string;
  quantity: number;
  actorUserId: string;
};

export async function createImpactRecordFromCompletedTransfer(
  db: DbClient,
  input: CreateImpactRecordInput,
): Promise<string | null> {
  const [existing] = await db
    .select({ id: impactRecords.id })
    .from(impactRecords)
    .where(eq(impactRecords.matchId, input.matchId))
    .limit(1);

  if (existing) {
    return null;
  }

  const impactSummary = buildImpactSummary(input.category, input.quantity);

  const [record] = await db
    .insert(impactRecords)
    .values({
      matchId: input.matchId,
      donorUserId: input.donorUserId,
      recipientUserId: input.recipientUserId,
      itemId: input.itemId,
      recipientRequestId: input.recipientRequestId,
      category: input.category,
      quantity: input.quantity,
      impactSummary,
      storyPublicApproved: false,
      createdByUserId: input.actorUserId,
    })
    .returning();

  if (!record) {
    throw new Error("Failed to create impact record");
  }

  await logAuditEvent(db, {
    action: "impact_record.created",
    entityType: "impact_record",
    entityId: record.id,
    actorUserId: input.actorUserId,
    newValues: {
      matchId: input.matchId,
      category: input.category,
      quantity: input.quantity,
    },
    metadata: { source: "transfer_completed" },
  });

  return record.id;
}
