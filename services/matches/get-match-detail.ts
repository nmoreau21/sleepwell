import { and, desc, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { getDb } from "@/db";
import { donorProfiles } from "@/db/schema/donor-profiles";
import { furnitureItems } from "@/db/schema/furniture-items";
import { matches } from "@/db/schema/matches";
import { partnerOrganizations } from "@/db/schema/partner-organizations";
import { recipientProfiles } from "@/db/schema/recipient-profiles";
import { recipientRequests } from "@/db/schema/recipient-requests";
import { requestNeedLines } from "@/db/schema/request-need-lines";
import { transfers } from "@/db/schema/transfers";
import { users } from "@/db/schema/users";
import { formatAdminLocation } from "@/lib/format/location";
import { TRANSFER_COMPLETABLE_STATUSES } from "@/lib/validation/transfer-completion";

export type MatchTransferSummary = {
  id: string;
  status: string;
  transferType: string;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  pickupInstructions: string | null;
  deliveryInstructions: string | null;
  donorContactConfirmed: boolean;
  recipientContactConfirmed: boolean;
  coordinatorNotes: string | null;
  completedAt: Date | null;
  failureReason: string | null;
};

export type AdminMatchDetail = {
  id: string;
  status: string;
  transferMethod: string | null;
  matchScore: string | null;
  createdAt: Date;
  donorUserId: string;
  recipientUserId: string;
  item: {
    id: string;
    status: string;
    category: string;
    condition: string;
    quantity: number;
    locationLabel: string;
    donorName: string;
    donorEmail: string | null;
  };
  need: {
    id: string;
    status: string;
    category: string;
    quantityNeeded: number;
    quantityMatched: number;
    sizePreference: string | null;
  };
  request: {
    id: string;
    status: string;
    priority: string;
    locationLabel: string;
    needsDelivery: boolean;
    partnerOrganizationName: string | null;
    recipientName: string;
    recipientEmail: string | null;
  };
  transfer: MatchTransferSummary | null;
  schedulable: boolean;
  completable: boolean;
};

export async function getMatchDetailForAdmin(
  matchId: string,
): Promise<AdminMatchDetail | null> {
  const db = getDb();
  const recipientUsers = alias(users, "recipient_users");

  const [row] = await db
    .select({
      matchId: matches.id,
      matchStatus: matches.status,
      transferMethod: matches.transferMethod,
      matchScore: matches.matchScore,
      matchCreatedAt: matches.createdAt,
      donorUserId: users.id,
      itemId: furnitureItems.id,
      itemStatus: furnitureItems.status,
      itemCategory: furnitureItems.category,
      itemCondition: furnitureItems.condition,
      itemQuantity: furnitureItems.quantity,
      itemCity: furnitureItems.city,
      itemState: furnitureItems.state,
      itemZip: furnitureItems.zipCode,
      itemAddressLine1: furnitureItems.addressLine1,
      itemCrossStreet: furnitureItems.crossStreet,
      itemDisplayLocation: furnitureItems.displayLocation,
      itemPrivacyLevel: furnitureItems.locationPrivacyLevel,
      donorFirstName: users.firstName,
      donorLastName: users.lastName,
      donorEmail: users.email,
      needLineId: requestNeedLines.id,
      needStatus: requestNeedLines.status,
      needCategory: requestNeedLines.category,
      quantityNeeded: requestNeedLines.quantityNeeded,
      quantityMatched: requestNeedLines.quantityMatched,
      sizePreference: requestNeedLines.sizePreference,
      requestId: recipientRequests.id,
      requestStatus: recipientRequests.status,
      requestPriority: recipientRequests.priority,
      requestCity: recipientRequests.city,
      requestState: recipientRequests.state,
      requestZip: recipientRequests.zipCode,
      needsDelivery: recipientRequests.needsDelivery,
      partnerOrganizationName: partnerOrganizations.name,
      recipientUserId: recipientProfiles.userId,
      recipientFirstName: recipientUsers.firstName,
      recipientLastName: recipientUsers.lastName,
      recipientEmail: recipientUsers.email,
    })
    .from(matches)
    .innerJoin(furnitureItems, eq(matches.furnitureItemId, furnitureItems.id))
    .innerJoin(
      donorProfiles,
      eq(furnitureItems.donorProfileId, donorProfiles.id),
    )
    .innerJoin(users, eq(donorProfiles.userId, users.id))
    .innerJoin(
      requestNeedLines,
      eq(matches.requestNeedLineId, requestNeedLines.id),
    )
    .innerJoin(
      recipientRequests,
      eq(matches.recipientRequestId, recipientRequests.id),
    )
    .innerJoin(
      recipientProfiles,
      eq(recipientRequests.recipientProfileId, recipientProfiles.id),
    )
    .innerJoin(recipientUsers, eq(recipientProfiles.userId, recipientUsers.id))
    .leftJoin(
      partnerOrganizations,
      eq(recipientRequests.partnerOrganizationId, partnerOrganizations.id),
    )
    .where(and(eq(matches.id, matchId), isNull(furnitureItems.deletedAt)))
    .limit(1);

  if (!row) {
    return null;
  }

  const [transferRow] = await db
    .select({
      id: transfers.id,
      status: transfers.status,
      transferType: transfers.transferType,
      scheduledStart: transfers.scheduledStart,
      scheduledEnd: transfers.scheduledEnd,
      pickupInstructions: transfers.pickupInstructions,
      deliveryInstructions: transfers.deliveryInstructions,
      donorContactConfirmed: transfers.donorContactConfirmed,
      recipientContactConfirmed: transfers.recipientContactConfirmed,
      notes: transfers.notes,
      completedAt: transfers.completedAt,
      failureReason: transfers.failureReason,
    })
    .from(transfers)
    .where(eq(transfers.matchId, matchId))
    .orderBy(desc(transfers.createdAt))
    .limit(1);

  const transfer: MatchTransferSummary | null = transferRow
    ? {
        id: transferRow.id,
        status: transferRow.status,
        transferType: transferRow.transferType,
        scheduledStart: transferRow.scheduledStart,
        scheduledEnd: transferRow.scheduledEnd,
        pickupInstructions: transferRow.pickupInstructions,
        deliveryInstructions: transferRow.deliveryInstructions,
        donorContactConfirmed: transferRow.donorContactConfirmed,
        recipientContactConfirmed: transferRow.recipientContactConfirmed,
        coordinatorNotes: transferRow.notes,
        completedAt: transferRow.completedAt,
        failureReason: transferRow.failureReason,
      }
    : null;

  const schedulable =
    row.matchStatus === "approved" &&
    row.itemStatus === "reserved" &&
    transfer === null;

  const completable =
    transfer !== null &&
    row.matchStatus === "scheduled" &&
    TRANSFER_COMPLETABLE_STATUSES.includes(
      transfer.status as (typeof TRANSFER_COMPLETABLE_STATUSES)[number],
    );

  return {
    id: row.matchId,
    status: row.matchStatus,
    transferMethod: row.transferMethod,
    matchScore: row.matchScore,
    createdAt: row.matchCreatedAt,
    donorUserId: row.donorUserId,
    recipientUserId: row.recipientUserId,
    item: {
      id: row.itemId,
      status: row.itemStatus,
      category: row.itemCategory,
      condition: row.itemCondition,
      quantity: Number(row.itemQuantity),
      locationLabel: formatAdminLocation({
        city: row.itemCity,
        state: row.itemState,
        zipCode: row.itemZip,
        addressLine1: row.itemAddressLine1,
        crossStreet: row.itemCrossStreet,
        displayLocation: row.itemDisplayLocation,
        privacyLevel: row.itemPrivacyLevel as
          | "exact"
          | "cross_street"
          | "zip_only",
      }),
      donorName: `${row.donorFirstName} ${row.donorLastName}`,
      donorEmail: row.donorEmail,
    },
    need: {
      id: row.needLineId,
      status: row.needStatus,
      category: row.needCategory,
      quantityNeeded: Number(row.quantityNeeded),
      quantityMatched: Number(row.quantityMatched),
      sizePreference: row.sizePreference,
    },
    request: {
      id: row.requestId,
      status: row.requestStatus,
      priority: row.requestPriority,
      locationLabel: `${row.requestCity}, ${row.requestState} ${row.requestZip}`,
      needsDelivery: row.needsDelivery,
      partnerOrganizationName: row.partnerOrganizationName,
      recipientName: `${row.recipientFirstName} ${row.recipientLastName}`,
      recipientEmail: row.recipientEmail,
    },
    transfer,
    schedulable,
    completable,
  };
}
