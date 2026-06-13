import type { AdminFurnitureItemRow } from "@/services/admin/list-furniture-items";

/** Items from one multi-item submit share a donor and land within seconds. */
const SUBMISSION_BATCH_WINDOW_MS = 30_000;

export type AdminDonationSubmissionGroup = {
  key: string;
  donorProfileId: string;
  submittedAt: Date;
  donorFirstName: string;
  donorLastName: string;
  donorEmail: string | null;
  donorPhone: string | null;
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
  items: AdminFurnitureItemRow[];
};

function groupHeaderFromItem(item: AdminFurnitureItemRow): Omit<
  AdminDonationSubmissionGroup,
  "key" | "items"
> {
  return {
    donorProfileId: item.donorProfileId,
    submittedAt: item.createdAt,
    donorFirstName: item.donorFirstName,
    donorLastName: item.donorLastName,
    donorEmail: item.donorEmail,
    donorPhone: item.donorPhone,
    city: item.city,
    state: item.state,
    zipCode: item.zipCode,
    addressLine1: item.addressLine1,
    crossStreet: item.crossStreet,
    displayLocation: item.displayLocation,
    locationPrivacyLevel: item.locationPrivacyLevel,
    availabilityStart: item.availabilityStart,
    availabilityEnd: item.availabilityEnd,
    pickupConstraints: item.pickupConstraints,
  };
}

export function groupFurnitureItemsBySubmission(
  items: AdminFurnitureItemRow[],
): AdminDonationSubmissionGroup[] {
  if (items.length === 0) {
    return [];
  }

  const groups: AdminDonationSubmissionGroup[] = [];

  for (const item of items) {
    const lastGroup = groups.at(-1);

    if (
      lastGroup &&
      lastGroup.donorProfileId === item.donorProfileId &&
      Math.abs(item.createdAt.getTime() - lastGroup.submittedAt.getTime()) <=
        SUBMISSION_BATCH_WINDOW_MS
    ) {
      lastGroup.items.push(item);
      if (item.createdAt < lastGroup.submittedAt) {
        lastGroup.submittedAt = item.createdAt;
        lastGroup.key = `${item.donorProfileId}-${item.createdAt.getTime()}`;
      }
      continue;
    }

    groups.push({
      key: `${item.donorProfileId}-${item.createdAt.getTime()}`,
      ...groupHeaderFromItem(item),
      items: [item],
    });
  }

  return groups;
}
