import { and, eq, inArray, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { furnitureItems } from "@/db/schema/furniture-items";
import { partnerOrganizations } from "@/db/schema/partner-organizations";
import { recipientRequests } from "@/db/schema/recipient-requests";
import { requestNeedLines } from "@/db/schema/request-need-lines";
import { formatAdminLocation } from "@/lib/format/location";
import { scorePotentialConnection } from "@/services/matching/score-potential-connection";
import { remainingNeedQuantity } from "@/services/matches/validate-create-match";

export type PotentialConnection = {
  itemId: string;
  needLineId: string;
  requestId: string;
  score: number;
  reasons: string[];
  item: {
    category: string;
    condition: string;
    quantity: number;
    city: string;
    state: string;
    zipCode: string;
    locationLabel: string;
  };
  need: {
    category: string;
    quantityNeeded: number;
    quantityMatched: number;
    remainingQuantity: number;
    sizePreference: string | null;
  };
  request: {
    priority: string;
    city: string;
    state: string;
    zipCode: string;
    locationLabel: string;
    needsDelivery: boolean;
    partnerOrganizationName: string | null;
  };
};

const MATCHABLE_REQUEST_STATUSES = ["approved", "queued"] as const;

const MAX_CONNECTIONS = 100;

function formatRequestLocation(row: {
  city: string;
  state: string;
  zipCode: string;
}): string {
  return `${row.city}, ${row.state} ${row.zipCode}`;
}

export async function getPotentialConnections(): Promise<PotentialConnection[]> {
  const db = getDb();

  const rows = await db
    .select({
      itemId: furnitureItems.id,
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
      needLineId: requestNeedLines.id,
      needCategory: requestNeedLines.category,
      quantityNeeded: requestNeedLines.quantityNeeded,
      quantityMatched: requestNeedLines.quantityMatched,
      sizePreference: requestNeedLines.sizePreference,
      requestId: recipientRequests.id,
      requestPriority: recipientRequests.priority,
      requestCity: recipientRequests.city,
      requestState: recipientRequests.state,
      requestZip: recipientRequests.zipCode,
      needsDelivery: recipientRequests.needsDelivery,
      partnerOrganizationName: partnerOrganizations.name,
    })
    .from(furnitureItems)
    .innerJoin(
      requestNeedLines,
      and(
        eq(requestNeedLines.category, furnitureItems.category),
        eq(requestNeedLines.status, "open"),
      ),
    )
    .innerJoin(
      recipientRequests,
      and(
        eq(recipientRequests.id, requestNeedLines.recipientRequestId),
        inArray(recipientRequests.status, [...MATCHABLE_REQUEST_STATUSES]),
      ),
    )
    .leftJoin(
      partnerOrganizations,
      eq(recipientRequests.partnerOrganizationId, partnerOrganizations.id),
    )
    .where(
      and(
        eq(furnitureItems.status, "available"),
        isNull(furnitureItems.deletedAt),
      ),
    );

  const connections: PotentialConnection[] = [];

  for (const row of rows) {
    const quantityNeeded = Number(row.quantityNeeded);
    const quantityMatched = Number(row.quantityMatched);
    const itemQuantity = Number(row.itemQuantity);
    const remainingQuantity = remainingNeedQuantity(
      quantityNeeded,
      quantityMatched,
    );

    if (itemQuantity < remainingQuantity || remainingQuantity <= 0) {
      continue;
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

    connections.push({
      itemId: row.itemId,
      needLineId: row.needLineId,
      requestId: row.requestId,
      score,
      reasons,
      item: {
        category: row.itemCategory,
        condition: row.itemCondition,
        quantity: itemQuantity,
        city: row.itemCity,
        state: row.itemState,
        zipCode: row.itemZip,
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
      },
      need: {
        category: row.needCategory,
        quantityNeeded,
        quantityMatched,
        remainingQuantity,
        sizePreference: row.sizePreference,
      },
      request: {
        priority: row.requestPriority,
        city: row.requestCity,
        state: row.requestState,
        zipCode: row.requestZip,
        locationLabel: formatRequestLocation({
          city: row.requestCity,
          state: row.requestState,
          zipCode: row.requestZip,
        }),
        needsDelivery: row.needsDelivery,
        partnerOrganizationName: row.partnerOrganizationName,
      },
    });
  }

  connections.sort((a, b) => b.score - a.score);

  return connections.slice(0, MAX_CONNECTIONS);
}
