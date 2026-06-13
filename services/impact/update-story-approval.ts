import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { impactRecords } from "@/db/schema/impact-records";
import { logAuditEvent } from "@/services/audit/log-event";

export async function updateImpactStoryApproval(input: {
  impactRecordId: string;
  storyPublicApproved: boolean;
  actorUserId: string;
}): Promise<void> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const txClient = tx as unknown as ReturnType<typeof getDb>;

    const [existing] = await tx
      .select({
        id: impactRecords.id,
        storyPublicApproved: impactRecords.storyPublicApproved,
      })
      .from(impactRecords)
      .where(eq(impactRecords.id, input.impactRecordId))
      .limit(1);

    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    if (existing.storyPublicApproved === input.storyPublicApproved) {
      return;
    }

    await tx
      .update(impactRecords)
      .set({ storyPublicApproved: input.storyPublicApproved })
      .where(eq(impactRecords.id, input.impactRecordId));

    await logAuditEvent(txClient, {
      action: "impact_record.story_approval_changed",
      entityType: "impact_record",
      entityId: input.impactRecordId,
      actorUserId: input.actorUserId,
      oldValues: { storyPublicApproved: existing.storyPublicApproved },
      newValues: { storyPublicApproved: input.storyPublicApproved },
      metadata: { source: "admin_impact" },
    });
  });
}
