import { and, eq, isNull, notInArray } from "drizzle-orm";

import { getDb } from "@/db";
import { donorProfiles } from "@/db/schema/donor-profiles";
import { furnitureItems } from "@/db/schema/furniture-items";
import { matches } from "@/db/schema/matches";
import { recipientProfiles } from "@/db/schema/recipient-profiles";
import { recipientRequests } from "@/db/schema/recipient-requests";
import { requestNeedLines } from "@/db/schema/request-need-lines";
import { users } from "@/db/schema/users";
import { scorePotentialConnection } from "@/services/matching/score-potential-connection";
import {
  computeRecipientRequestStatusAfterMatch,
  validateCreateMatchInput,
} from "@/services/matches/validate-create-match";
import { logAuditEvent } from "@/services/audit/log-event";
import { logCommunicationEvent } from "@/services/communications/log-event";

const ACTIVE_MATCH_TERMINAL_STATUSES = [
  "completed",
  "cancelled",
  "match_rejected",
  "match_expired",
] as const;

export type CreateManualMatchInput = {
  itemId: string;
  needLineId: string;
  actorUserId: string;
};

export type CreateManualMatchResult = {
  matchId: string;
  requestId: string;
  recipientRequestStatus: string | null;
};

export class CreateMatchError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "CreateMatchError";
  }
}

type DbClient = ReturnType<typeof getDb>;

async function hasActiveMatchForItem(
  tx: DbClient,
  itemId: string,
): Promise<boolean> {
  const [row] = await tx
    .select({ id: matches.id })
    .from(matches)
    .where(
      and(
        eq(matches.furnitureItemId, itemId),
        notInArray(matches.status, [...ACTIVE_MATCH_TERMINAL_STATUSES]),
      ),
    )
    .limit(1);

  return Boolean(row);
}

async function hasActiveMatchForNeedLine(
  tx: DbClient,
  needLineId: string,
): Promise<boolean> {
  const [row] = await tx
    .select({ id: matches.id })
    .from(matches)
    .where(
      and(
        eq(matches.requestNeedLineId, needLineId),
        notInArray(matches.status, [...ACTIVE_MATCH_TERMINAL_STATUSES]),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export async function createManualMatch(
  input: CreateManualMatchInput,
): Promise<CreateManualMatchResult> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        itemId: furnitureItems.id,
        itemStatus: furnitureItems.status,
        itemCategory: furnitureItems.category,
        itemQuantity: furnitureItems.quantity,
        itemCity: furnitureItems.city,
        itemState: furnitureItems.state,
        itemZip: furnitureItems.zipCode,
        donorUserId: users.id,
        needLineId: requestNeedLines.id,
        needCategory: requestNeedLines.category,
        needLineStatus: requestNeedLines.status,
        quantityNeeded: requestNeedLines.quantityNeeded,
        quantityMatched: requestNeedLines.quantityMatched,
        requestId: recipientRequests.id,
        requestStatus: recipientRequests.status,
        requestPriority: recipientRequests.priority,
        requestCity: recipientRequests.city,
        requestState: recipientRequests.state,
        requestZip: recipientRequests.zipCode,
        needsDelivery: recipientRequests.needsDelivery,
        recipientUserId: recipientProfiles.userId,
      })
      .from(furnitureItems)
      .innerJoin(
        donorProfiles,
        eq(furnitureItems.donorProfileId, donorProfiles.id),
      )
      .innerJoin(users, eq(donorProfiles.userId, users.id))
      .innerJoin(requestNeedLines, eq(requestNeedLines.id, input.needLineId))
      .innerJoin(
        recipientRequests,
        eq(recipientRequests.id, requestNeedLines.recipientRequestId),
      )
      .innerJoin(
        recipientProfiles,
        eq(recipientProfiles.id, recipientRequests.recipientProfileId),
      )
      .where(
        and(
          eq(furnitureItems.id, input.itemId),
          isNull(furnitureItems.deletedAt),
        ),
      )
      .limit(1);

    if (!row) {
      throw new CreateMatchError("NOT_FOUND", "Item or need line not found.");
    }

    if (row.itemId !== input.itemId || row.needLineId !== input.needLineId) {
      throw new CreateMatchError(
        "PAIR_MISMATCH",
        "Item and need line could not be paired.",
      );
    }

    const txClient = tx as unknown as DbClient;
    const hasActiveItemMatch = await hasActiveMatchForItem(
      txClient,
      input.itemId,
    );
    const hasActiveNeedMatch = await hasActiveMatchForNeedLine(
      txClient,
      input.needLineId,
    );

    const validation = validateCreateMatchInput({
      itemStatus: row.itemStatus,
      itemCategory: row.itemCategory,
      itemQuantity: Number(row.itemQuantity),
      needLineStatus: row.needLineStatus,
      needCategory: row.needCategory,
      quantityNeeded: Number(row.quantityNeeded),
      quantityMatched: Number(row.quantityMatched),
      requestStatus: row.requestStatus,
      hasActiveItemMatch,
      hasActiveNeedMatch,
    });

    if (!validation.ok) {
      throw new CreateMatchError(validation.code, validation.message);
    }

    const { score, reasons } = scorePotentialConnection({
      itemZip: row.itemZip,
      itemCity: row.itemCity,
      itemState: row.itemState,
      requestZip: row.requestZip,
      requestCity: row.requestCity,
      requestState: row.requestState,
      priority: row.requestPriority,
      needsDelivery: row.needsDelivery,
    });

    const now = new Date();
    const transferMethod = row.needsDelivery ? "volunteer_delivery" : "pickup";

    const [match] = await tx
      .insert(matches)
      .values({
        furnitureItemId: input.itemId,
        requestNeedLineId: input.needLineId,
        recipientRequestId: row.requestId,
        status: "approved",
        transferMethod,
        matchScore: String(score),
        scoreExplanation: { score, reasons },
        approvedByUserId: input.actorUserId,
        approvedAt: now,
      })
      .returning();

    if (!match) {
      throw new CreateMatchError(
        "CREATE_FAILED",
        "Failed to create match record.",
      );
    }

    await tx
      .update(furnitureItems)
      .set({ status: "reserved", updatedAt: now })
      .where(eq(furnitureItems.id, input.itemId));

    const newQuantityMatched = Number(row.quantityNeeded);

    await tx
      .update(requestNeedLines)
      .set({
        status: "matched",
        quantityMatched: newQuantityMatched,
        updatedAt: now,
      })
      .where(eq(requestNeedLines.id, input.needLineId));

    const allNeedLines = await tx
      .select({
        essential: requestNeedLines.essential,
        status: requestNeedLines.status,
      })
      .from(requestNeedLines)
      .where(eq(requestNeedLines.recipientRequestId, row.requestId));

    const nextRequestStatus =
      computeRecipientRequestStatusAfterMatch(allNeedLines);

    if (nextRequestStatus) {
      await tx
        .update(recipientRequests)
        .set({ status: nextRequestStatus, updatedAt: now })
        .where(eq(recipientRequests.id, row.requestId));
    }

    await logAuditEvent(tx as unknown as ReturnType<typeof getDb>, {
      action: "match.created",
      entityType: "match",
      entityId: match.id,
      actorUserId: input.actorUserId,
      newValues: {
        status: match.status,
        furnitureItemId: input.itemId,
        requestNeedLineId: input.needLineId,
        recipientRequestId: row.requestId,
        matchScore: score,
        recipientRequestStatus: nextRequestStatus,
      },
      metadata: { source: "admin_connections" },
    });

    await logCommunicationEvent(tx as unknown as ReturnType<typeof getDb>, {
      userId: row.donorUserId,
      sentByUserId: input.actorUserId,
      channel: "email",
      direction: "outbound",
      templateCode: "match_created_donor",
      subject: "Sleepwell match for your donation",
      bodyPreview: `Match created for ${row.itemCategory} item.`,
      relatedEntityType: "match",
      relatedEntityId: match.id,
      status: "queued",
    });

    await logCommunicationEvent(tx as unknown as ReturnType<typeof getDb>, {
      userId: row.recipientUserId,
      sentByUserId: input.actorUserId,
      channel: "email",
      direction: "outbound",
      templateCode: "match_created_recipient",
      subject: "Sleepwell furniture match in progress",
      bodyPreview: `Match created for ${row.needCategory} need.`,
      relatedEntityType: "match",
      relatedEntityId: match.id,
      status: "queued",
    });

    await logCommunicationEvent(tx as unknown as ReturnType<typeof getDb>, {
      userId: input.actorUserId,
      sentByUserId: input.actorUserId,
      channel: "in_app",
      direction: "outbound",
      templateCode: "match_created_coordinator",
      subject: "Match created",
      bodyPreview: `You created match ${match.id.slice(0, 8)}…`,
      relatedEntityType: "match",
      relatedEntityId: match.id,
      status: "queued",
    });

    return {
      matchId: match.id,
      requestId: row.requestId,
      recipientRequestStatus: nextRequestStatus,
    };
  });
}
