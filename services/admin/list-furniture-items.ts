import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import type { DonationItemMetadata } from "@/db/schema/furniture-items";
import { donorProfiles } from "@/db/schema/donor-profiles";
import { furnitureItems } from "@/db/schema/furniture-items";
import { users } from "@/db/schema/users";
import {
  groupFurnitureItemsBySubmission,
  type AdminDonationSubmissionGroup,
} from "@/lib/admin/group-furniture-submissions";
import { FURNITURE_ITEM_QUEUE_STATUSES } from "@/types/statuses";

export type AdminFurnitureItemRow = {
  id: string;
  donorProfileId: string;
  itemKind: string;
  status: string;
  category: string;
  title: string | null;
  description: string | null;
  condition: string;
  quantity: number;
  metadata: DonationItemMetadata | null;
  city: string;
  state: string;
  zipCode: string;
  addressLine1: string | null;
  crossStreet: string | null;
  displayLocation: string | null;
  locationPrivacyLevel: string;
  availabilityStart: string | Date | null;
  availabilityEnd: string | Date | null;
  pickupConstraints: string | null;
  createdAt: Date;
  donorFirstName: string;
  donorLastName: string;
  donorEmail: string | null;
  donorPhone: string | null;
};

export async function listFurnitureItemsForAdmin(
  statusFilter = "queue",
): Promise<AdminFurnitureItemRow[]> {
  const db = getDb();

  const conditions = [isNull(furnitureItems.deletedAt)];

  if (statusFilter === "all") {
    // No status filter — show all non-deleted items
  } else if (statusFilter === "queue") {
    conditions.push(
      inArray(furnitureItems.status, [...FURNITURE_ITEM_QUEUE_STATUSES]),
    );
  } else {
    conditions.push(eq(furnitureItems.status, statusFilter));
  }

  const rows = await db
    .select({
      id: furnitureItems.id,
      donorProfileId: furnitureItems.donorProfileId,
      itemKind: furnitureItems.itemKind,
      status: furnitureItems.status,
      category: furnitureItems.category,
      title: furnitureItems.title,
      description: furnitureItems.description,
      condition: furnitureItems.condition,
      quantity: furnitureItems.quantity,
      metadata: furnitureItems.metadata,
      city: furnitureItems.city,
      state: furnitureItems.state,
      zipCode: furnitureItems.zipCode,
      addressLine1: furnitureItems.addressLine1,
      crossStreet: furnitureItems.crossStreet,
      displayLocation: furnitureItems.displayLocation,
      locationPrivacyLevel: furnitureItems.locationPrivacyLevel,
      availabilityStart: furnitureItems.availabilityStart,
      availabilityEnd: furnitureItems.availabilityEnd,
      pickupConstraints: furnitureItems.pickupConstraints,
      createdAt: furnitureItems.createdAt,
      donorFirstName: users.firstName,
      donorLastName: users.lastName,
      donorEmail: users.email,
      donorPhone: users.phone,
    })
    .from(furnitureItems)
    .innerJoin(
      donorProfiles,
      eq(furnitureItems.donorProfileId, donorProfiles.id),
    )
    .innerJoin(users, eq(donorProfiles.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(furnitureItems.createdAt));

  return rows.map((row) => ({
    ...row,
    quantity: Number(row.quantity),
    availabilityStart: row.availabilityStart ?? null,
    availabilityEnd: row.availabilityEnd ?? null,
  }));
}

export async function listFurnitureSubmissionGroupsForAdmin(
  statusFilter = "queue",
): Promise<AdminDonationSubmissionGroup[]> {
  const items = await listFurnitureItemsForAdmin(statusFilter);
  return groupFurnitureItemsBySubmission(items);
}
