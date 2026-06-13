import { and, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/db";
import { partnerOrganizations } from "@/db/schema/partner-organizations";
import { recipientProfiles } from "@/db/schema/recipient-profiles";
import { recipientRequests } from "@/db/schema/recipient-requests";
import { requestNeedLines } from "@/db/schema/request-need-lines";
import { users } from "@/db/schema/users";
import { RECIPIENT_REQUEST_QUEUE_STATUSES } from "@/types/statuses";

export type AdminNeedLineRow = {
  id: string;
  category: string;
  quantityNeeded: number;
  sizePreference: string | null;
  essential: boolean;
  status: string;
};

export type AdminRecipientRequestRow = {
  id: string;
  status: string;
  priority: string;
  city: string;
  state: string;
  zipCode: string;
  housingAddressLine1: string | null;
  needsDelivery: boolean;
  moveInDate: string | Date | null;
  accessNotes: string | null;
  notes: string | null;
  createdAt: Date;
  recipientFirstName: string;
  recipientLastName: string;
  recipientEmail: string | null;
  partnerOrganizationName: string | null;
  partnerReferralId: string | null;
  needLines: AdminNeedLineRow[];
};

export async function listRecipientRequestsForAdmin(
  statusFilter = "queue",
): Promise<AdminRecipientRequestRow[]> {
  const db = getDb();

  const conditions: ReturnType<typeof eq>[] = [];

  if (statusFilter === "all") {
    // No status filter
  } else if (statusFilter === "queue") {
    conditions.push(
      inArray(recipientRequests.status, [...RECIPIENT_REQUEST_QUEUE_STATUSES]),
    );
  } else {
    conditions.push(eq(recipientRequests.status, statusFilter));
  }

  const requestRows = await db
    .select({
      id: recipientRequests.id,
      status: recipientRequests.status,
      priority: recipientRequests.priority,
      city: recipientRequests.city,
      state: recipientRequests.state,
      zipCode: recipientRequests.zipCode,
      housingAddressLine1: recipientRequests.housingAddressLine1,
      needsDelivery: recipientRequests.needsDelivery,
      moveInDate: recipientRequests.moveInDate,
      accessNotes: recipientRequests.accessNotes,
      notes: recipientRequests.notes,
      createdAt: recipientRequests.createdAt,
      partnerReferralId: recipientRequests.partnerReferralId,
      recipientFirstName: users.firstName,
      recipientLastName: users.lastName,
      recipientEmail: users.email,
      partnerOrganizationName: partnerOrganizations.name,
    })
    .from(recipientRequests)
    .innerJoin(
      recipientProfiles,
      eq(recipientRequests.recipientProfileId, recipientProfiles.id),
    )
    .innerJoin(users, eq(recipientProfiles.userId, users.id))
    .leftJoin(
      partnerOrganizations,
      eq(recipientRequests.partnerOrganizationId, partnerOrganizations.id),
    )
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(recipientRequests.createdAt));

  const requestIds = requestRows.map((row) => row.id);

  if (requestIds.length === 0) {
    return [];
  }

  const needLineRows = await db
    .select({
      id: requestNeedLines.id,
      recipientRequestId: requestNeedLines.recipientRequestId,
      category: requestNeedLines.category,
      quantityNeeded: requestNeedLines.quantityNeeded,
      sizePreference: requestNeedLines.sizePreference,
      essential: requestNeedLines.essential,
      status: requestNeedLines.status,
    })
    .from(requestNeedLines)
    .where(inArray(requestNeedLines.recipientRequestId, requestIds));

  const needsByRequest = new Map<string, AdminNeedLineRow[]>();

  for (const line of needLineRows) {
    const bucket = needsByRequest.get(line.recipientRequestId) ?? [];
    bucket.push({
      id: line.id,
      category: line.category,
      quantityNeeded: Number(line.quantityNeeded),
      sizePreference: line.sizePreference,
      essential: line.essential,
      status: line.status,
    });
    needsByRequest.set(line.recipientRequestId, bucket);
  }

  return requestRows.map((row) => ({
    id: row.id,
    status: row.status,
    priority: row.priority,
    city: row.city,
    state: row.state,
    zipCode: row.zipCode,
    housingAddressLine1: row.housingAddressLine1,
    needsDelivery: row.needsDelivery,
    moveInDate: row.moveInDate ?? null,
    accessNotes: row.accessNotes,
    notes: row.notes,
    createdAt: row.createdAt,
    recipientFirstName: row.recipientFirstName,
    recipientLastName: row.recipientLastName,
    recipientEmail: row.recipientEmail,
    partnerOrganizationName: row.partnerOrganizationName,
    partnerReferralId: row.partnerReferralId,
    needLines: needsByRequest.get(row.id) ?? [],
  }));
}
