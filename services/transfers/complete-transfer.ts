import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { furnitureItems } from "@/db/schema/furniture-items";
import { matches } from "@/db/schema/matches";
import { recipientRequests } from "@/db/schema/recipient-requests";
import { requestNeedLines } from "@/db/schema/request-need-lines";
import { transfers } from "@/db/schema/transfers";
import {
  type CompleteTransferInput,
  computeRecipientRequestStatusAfterFulfillment,
  validateCompleteTransferInput,
} from "@/lib/validation/transfer-completion";
import { logAuditEvent } from "@/services/audit/log-event";
import { logCommunicationEvent } from "@/services/communications/log-event";
import { createImpactRecordFromCompletedTransfer } from "@/services/impact/create-from-completed-transfer";

type DbClient = ReturnType<typeof getDb>;

export class CompleteTransferError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "CompleteTransferError";
  }
}

export type CompleteTransferContext = {
  actorUserId: string;
  donorUserId: string;
  recipientUserId: string;
};

function mergeTransferNotes(
  existing: string | null,
  completionNotes: string | undefined,
): string | null {
  const parts: string[] = [];
  if (existing?.trim()) {
    parts.push(existing.trim());
  }
  if (completionNotes?.trim()) {
    parts.push(`Completion notes: ${completionNotes.trim()}`);
  }
  if (parts.length === 0) {
    return existing;
  }
  return parts.join("\n\n");
}

export async function completeTransfer(
  input: CompleteTransferInput,
  context: CompleteTransferContext,
): Promise<{ transferId: string; matchId: string; outcome: string }> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const txClient = tx as unknown as DbClient;
    const now = new Date();

    const [row] = await tx
      .select({
        matchId: matches.id,
        matchStatus: matches.status,
        furnitureItemId: matches.furnitureItemId,
        requestNeedLineId: matches.requestNeedLineId,
        recipientRequestId: matches.recipientRequestId,
        transferId: transfers.id,
        transferStatus: transfers.status,
        transferNotes: transfers.notes,
        itemStatus: furnitureItems.status,
        itemCategory: furnitureItems.category,
        itemQuantity: furnitureItems.quantity,
      })
      .from(matches)
      .innerJoin(transfers, eq(transfers.matchId, matches.id))
      .innerJoin(furnitureItems, eq(matches.furnitureItemId, furnitureItems.id))
      .where(
        and(eq(matches.id, input.matchId), eq(transfers.id, input.transferId)),
      )
      .limit(1);

    if (!row) {
      throw new CompleteTransferError("NOT_FOUND", "Match or transfer not found.");
    }

    const validation = validateCompleteTransferInput(
      input,
      {
        matchStatus: row.matchStatus,
        transferStatus: row.transferStatus,
      },
      now,
    );

    if (!validation.ok) {
      throw new CompleteTransferError(validation.code, validation.message);
    }

    const mergedNotes = mergeTransferNotes(
      row.transferNotes,
      input.completionNotes,
    );

    if (input.outcome === "completed") {
      await tx
        .update(transfers)
        .set({
          status: "completed",
          completedAt: input.completedAt,
          notes: mergedNotes,
          confirmedByUserId: context.actorUserId,
          confirmedByRole: "admin",
          updatedAt: now,
        })
        .where(eq(transfers.id, input.transferId));

      await tx
        .update(matches)
        .set({ status: "completed", updatedAt: now })
        .where(eq(matches.id, input.matchId));

      await tx
        .update(furnitureItems)
        .set({ status: "transferred", updatedAt: now })
        .where(eq(furnitureItems.id, row.furnitureItemId));

      await tx
        .update(requestNeedLines)
        .set({ status: "fulfilled", updatedAt: now })
        .where(eq(requestNeedLines.id, row.requestNeedLineId));

      const allNeedLines = await tx
        .select({
          essential: requestNeedLines.essential,
          status: requestNeedLines.status,
        })
        .from(requestNeedLines)
        .where(eq(requestNeedLines.recipientRequestId, row.recipientRequestId));

      const requestStatus = computeRecipientRequestStatusAfterFulfillment(
        allNeedLines,
      );

      await tx
        .update(recipientRequests)
        .set({ status: requestStatus, updatedAt: now })
        .where(eq(recipientRequests.id, row.recipientRequestId));

      await createImpactRecordFromCompletedTransfer(txClient, {
        matchId: input.matchId,
        donorUserId: context.donorUserId,
        recipientUserId: context.recipientUserId,
        itemId: row.furnitureItemId,
        recipientRequestId: row.recipientRequestId,
        category: row.itemCategory,
        quantity: Number(row.itemQuantity),
        actorUserId: context.actorUserId,
      });

      await logAuditEvent(txClient, {
        action: "transfer.completed",
        entityType: "transfer",
        entityId: input.transferId,
        actorUserId: context.actorUserId,
        newValues: {
          matchId: input.matchId,
          matchStatus: "completed",
          itemStatus: "transferred",
          needLineStatus: "fulfilled",
          recipientRequestStatus: requestStatus,
          completedAt: input.completedAt.toISOString(),
        },
        metadata: { source: "admin_match_detail", outcome: "completed" },
      });

      await logCommunicationEvent(txClient, {
        userId: context.donorUserId,
        sentByUserId: context.actorUserId,
        channel: "email",
        direction: "outbound",
        templateCode: "transfer_completed_donor",
        subject: "Sleepwell transfer completed",
        bodyPreview: "Your furniture donation transfer was completed.",
        relatedEntityType: "transfer",
        relatedEntityId: input.transferId,
        status: "queued",
      });

      await logCommunicationEvent(txClient, {
        userId: context.recipientUserId,
        sentByUserId: context.actorUserId,
        channel: "email",
        direction: "outbound",
        templateCode: "transfer_completed_recipient",
        subject: "Sleepwell furniture received",
        bodyPreview: "Your furniture transfer was completed.",
        relatedEntityType: "transfer",
        relatedEntityId: input.transferId,
        status: "queued",
      });

      await logCommunicationEvent(txClient, {
        userId: context.actorUserId,
        sentByUserId: context.actorUserId,
        channel: "in_app",
        direction: "outbound",
        templateCode: "transfer_completed_coordinator",
        subject: "Transfer completed",
        bodyPreview: `Transfer ${input.transferId.slice(0, 8)}… marked complete.`,
        relatedEntityType: "transfer",
        relatedEntityId: input.transferId,
        status: "queued",
      });
    } else if (input.outcome === "failed") {
      await tx
        .update(transfers)
        .set({
          status: "failed",
          completedAt: input.completedAt,
          failureReason: input.reason?.trim(),
          notes: mergedNotes,
          updatedAt: now,
        })
        .where(eq(transfers.id, input.transferId));

      await tx
        .update(matches)
        .set({ status: "transfer_failed", updatedAt: now })
        .where(eq(matches.id, input.matchId));

      if (input.reopenChoice === "reopen") {
        await tx
          .update(furnitureItems)
          .set({ status: "available", updatedAt: now })
          .where(eq(furnitureItems.id, row.furnitureItemId));

        await tx
          .update(requestNeedLines)
          .set({
            status: "open",
            quantityMatched: 0,
            updatedAt: now,
          })
          .where(eq(requestNeedLines.id, row.requestNeedLineId));

        await tx
          .update(recipientRequests)
          .set({
            status: input.reopenRequestStatus ?? "queued",
            updatedAt: now,
          })
          .where(eq(recipientRequests.id, row.recipientRequestId));
      } else {
        await tx
          .update(furnitureItems)
          .set({ status: "reserved", updatedAt: now })
          .where(eq(furnitureItems.id, row.furnitureItemId));
      }

      await logAuditEvent(txClient, {
        action: "transfer.failed",
        entityType: "transfer",
        entityId: input.transferId,
        actorUserId: context.actorUserId,
        newValues: {
          matchId: input.matchId,
          matchStatus: "transfer_failed",
          reason: input.reason,
          reopenChoice: input.reopenChoice ?? "keep_reserved",
        },
        metadata: { source: "admin_match_detail", outcome: "failed" },
      });

      await logCommunicationEvent(txClient, {
        userId: context.actorUserId,
        sentByUserId: context.actorUserId,
        channel: "in_app",
        direction: "outbound",
        templateCode: "transfer_failed_coordinator",
        subject: "Transfer failed",
        bodyPreview: input.reason ?? "Transfer marked failed.",
        relatedEntityType: "transfer",
        relatedEntityId: input.transferId,
        status: "queued",
      });
    } else {
      await tx
        .update(transfers)
        .set({
          status: "cancelled",
          completedAt: input.completedAt,
          failureReason: input.reason?.trim(),
          notes: mergedNotes,
          updatedAt: now,
        })
        .where(eq(transfers.id, input.transferId));

      await tx
        .update(matches)
        .set({ status: "cancelled", updatedAt: now })
        .where(eq(matches.id, input.matchId));

      if (input.reopenChoice === "reopen") {
        await tx
          .update(furnitureItems)
          .set({ status: "available", updatedAt: now })
          .where(eq(furnitureItems.id, row.furnitureItemId));

        await tx
          .update(requestNeedLines)
          .set({
            status: "open",
            quantityMatched: 0,
            updatedAt: now,
          })
          .where(eq(requestNeedLines.id, row.requestNeedLineId));

        await tx
          .update(recipientRequests)
          .set({
            status: input.reopenRequestStatus ?? "queued",
            updatedAt: now,
          })
          .where(eq(recipientRequests.id, row.recipientRequestId));
      } else {
        await tx
          .update(furnitureItems)
          .set({ status: "reserved", updatedAt: now })
          .where(eq(furnitureItems.id, row.furnitureItemId));
      }

      await logAuditEvent(txClient, {
        action: "transfer.cancelled",
        entityType: "transfer",
        entityId: input.transferId,
        actorUserId: context.actorUserId,
        newValues: {
          matchId: input.matchId,
          matchStatus: "cancelled",
          reason: input.reason,
          reopenChoice: input.reopenChoice ?? "keep_reserved",
        },
        metadata: { source: "admin_match_detail", outcome: "cancelled" },
      });

      await logCommunicationEvent(txClient, {
        userId: context.actorUserId,
        sentByUserId: context.actorUserId,
        channel: "in_app",
        direction: "outbound",
        templateCode: "transfer_cancelled_coordinator",
        subject: "Transfer cancelled",
        bodyPreview: input.reason ?? "Transfer cancelled.",
        relatedEntityType: "transfer",
        relatedEntityId: input.transferId,
        status: "queued",
      });
    }

    return {
      transferId: input.transferId,
      matchId: input.matchId,
      outcome: input.outcome,
    };
  });
}
