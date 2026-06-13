import { and, eq, notInArray } from "drizzle-orm";

import { getDb } from "@/db";
import { furnitureItems } from "@/db/schema/furniture-items";
import { matches } from "@/db/schema/matches";
import { transfers } from "@/db/schema/transfers";
import {
  ACTIVE_TRANSFER_TERMINAL_STATUSES,
  type ScheduleTransferInput,
  validateScheduleTransferInput,
} from "@/lib/validation/transfer";
import { logAuditEvent } from "@/services/audit/log-event";
import { logCommunicationEvent } from "@/services/communications/log-event";

type DbClient = ReturnType<typeof getDb>;

export class ScheduleTransferError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ScheduleTransferError";
  }
}

async function hasActiveTransferForMatch(
  tx: DbClient,
  matchId: string,
): Promise<boolean> {
  const [row] = await tx
    .select({ id: transfers.id })
    .from(transfers)
    .where(
      and(
        eq(transfers.matchId, matchId),
        notInArray(transfers.status, [...ACTIVE_TRANSFER_TERMINAL_STATUSES]),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export type ScheduleTransferContext = {
  actorUserId: string;
  donorUserId: string;
  recipientUserId: string;
};

export async function scheduleTransfer(
  input: ScheduleTransferInput,
  context: ScheduleTransferContext,
): Promise<{ transferId: string; matchId: string }> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const txClient = tx as unknown as DbClient;

    const [matchRow] = await tx
      .select({
        matchId: matches.id,
        matchStatus: matches.status,
        furnitureItemId: matches.furnitureItemId,
        itemStatus: furnitureItems.status,
      })
      .from(matches)
      .innerJoin(furnitureItems, eq(matches.furnitureItemId, furnitureItems.id))
      .where(eq(matches.id, input.matchId))
      .limit(1);

    if (!matchRow) {
      throw new ScheduleTransferError("NOT_FOUND", "Match not found.");
    }

    const hasActiveTransfer = await hasActiveTransferForMatch(
      txClient,
      input.matchId,
    );

    const validation = validateScheduleTransferInput(input, {
      matchStatus: matchRow.matchStatus,
      itemStatus: matchRow.itemStatus,
      hasActiveTransfer,
    });

    if (!validation.ok) {
      throw new ScheduleTransferError(validation.code, validation.message);
    }

    const now = new Date();

    const [transfer] = await tx
      .insert(transfers)
      .values({
        matchId: input.matchId,
        transferType: input.transferMethod,
        status: "scheduled",
        scheduledAt: input.scheduledStart,
        scheduledStart: input.scheduledStart,
        scheduledEnd: input.scheduledEnd,
        pickupInstructions: input.pickupInstructions ?? null,
        deliveryInstructions: input.deliveryInstructions ?? null,
        donorContactConfirmed: input.donorContactConfirmed,
        recipientContactConfirmed: input.recipientContactConfirmed,
        notes: input.coordinatorNotes ?? null,
        scheduledByUserId: context.actorUserId,
        updatedAt: now,
      })
      .returning();

    if (!transfer) {
      throw new ScheduleTransferError(
        "CREATE_FAILED",
        "Failed to create transfer.",
      );
    }

    await tx
      .update(matches)
      .set({
        status: "scheduled",
        transferMethod: input.transferMethod,
        updatedAt: now,
      })
      .where(eq(matches.id, input.matchId));

    await tx
      .update(furnitureItems)
      .set({ status: "transfer_scheduled", updatedAt: now })
      .where(eq(furnitureItems.id, matchRow.furnitureItemId));

    await logAuditEvent(txClient, {
      action: "transfer.scheduled",
      entityType: "transfer",
      entityId: transfer.id,
      actorUserId: context.actorUserId,
      newValues: {
        matchId: input.matchId,
        transferType: input.transferMethod,
        scheduledStart: input.scheduledStart.toISOString(),
        scheduledEnd: input.scheduledEnd.toISOString(),
        matchStatus: "scheduled",
        itemStatus: "transfer_scheduled",
      },
      metadata: { source: "admin_match_detail" },
    });

    await logCommunicationEvent(txClient, {
      userId: context.donorUserId,
      sentByUserId: context.actorUserId,
      channel: "email",
      direction: "outbound",
      templateCode: "transfer_scheduled_donor",
      subject: "Sleepwell pickup scheduled",
      bodyPreview: `Transfer scheduled starting ${input.scheduledStart.toISOString()}.`,
      relatedEntityType: "transfer",
      relatedEntityId: transfer.id,
      status: "queued",
    });

    await logCommunicationEvent(txClient, {
      userId: context.recipientUserId,
      sentByUserId: context.actorUserId,
      channel: "email",
      direction: "outbound",
      templateCode: "transfer_scheduled_recipient",
      subject: "Sleepwell furniture transfer scheduled",
      bodyPreview: `Transfer scheduled starting ${input.scheduledStart.toISOString()}.`,
      relatedEntityType: "transfer",
      relatedEntityId: transfer.id,
      status: "queued",
    });

    await logCommunicationEvent(txClient, {
      userId: context.actorUserId,
      sentByUserId: context.actorUserId,
      channel: "in_app",
      direction: "outbound",
      templateCode: "transfer_scheduled_coordinator",
      subject: "Transfer scheduled",
      bodyPreview: `Transfer ${transfer.id.slice(0, 8)}… scheduled.`,
      relatedEntityType: "transfer",
      relatedEntityId: transfer.id,
      status: "queued",
    });

    return { transferId: transfer.id, matchId: input.matchId };
  });
}
