import { and, eq, isNull, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { donorProfiles } from "@/db/schema/donor-profiles";
import {
  furnitureItems,
  type DonationItemMetadata,
} from "@/db/schema/furniture-items";
import { userRoles } from "@/db/schema/user-roles";
import { users } from "@/db/schema/users";
import { DONOR_ROLE_ID } from "@/lib/auth/constants";
import { CLOTHING_CATEGORY } from "@/lib/validation/clothing";
import type {
  DonationItemInput,
  DonationSubmissionInput,
  DonationSummaryItem,
} from "@/lib/validation/donation";
import { toDonationSummaryItems } from "@/lib/validation/donation";
import { logAuditEvent } from "@/services/audit/log-event";
import { logCommunicationEvent } from "@/services/communications/log-event";

const PHOTO_PENDING_NOTE =
  "Photos pending — coordinator will follow up to collect images.";

function buildPickupConstraints(
  donor: DonationSubmissionInput["donor"],
  item: DonationItemInput,
): string | undefined {
  const parts: string[] = [];

  if (item.photosPending) {
    parts.push(PHOTO_PENDING_NOTE);
  }

  if (donor.notes) {
    parts.push(`Donor notes: ${donor.notes}`);
  }

  if (donor.pickupConstraints) {
    parts.push(donor.pickupConstraints);
  }

  if (parts.length === 0) {
    return undefined;
  }

  return parts.join("\n\n");
}

function buildDescription(item: DonationItemInput): string | undefined {
  if (item.itemKind === "clothing") {
    const notes = item.notes?.trim();
    return notes ? notes : undefined;
  }

  return item.description?.trim() ? item.description.trim() : undefined;
}

function buildClothingMetadata(item: DonationItemInput): DonationItemMetadata {
  return {
    clothing_type: item.clothingType,
    size: item.size,
    gender_category: item.genderCategory,
  };
}

function itemCategoryLabel(item: DonationItemInput): string {
  if (item.itemKind === "clothing") {
    return item.clothingType === "tops" ? "clothing:top" : "clothing:bottom";
  }
  return item.category;
}

export type CreateDonationResult = {
  userId: string;
  itemIds: string[];
  summaryItems: DonationSummaryItem[];
  donorName: string;
};

export async function createDonationFromPublicForm(
  input: DonationSubmissionInput,
): Promise<CreateDonationResult> {
  const db = getDb();
  const donor = input.donor;

  return db.transaction(async (tx) => {
    const [existingUser] = await tx
      .select()
      .from(users)
      .where(
        and(
          sql`lower(${users.email}) = ${donor.email}`,
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    let userId: string;
    let donorProfileId: string;

    if (existingUser) {
      userId = existingUser.id;

      await tx
        .update(users)
        .set({
          firstName: donor.firstName,
          lastName: donor.lastName,
          phone: donor.phone ?? existingUser.phone,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      const [existingProfile] = await tx
        .select()
        .from(donorProfiles)
        .where(eq(donorProfiles.userId, userId))
        .limit(1);

      if (existingProfile) {
        donorProfileId = existingProfile.id;
        await tx
          .update(donorProfiles)
          .set({
            pickupPrivacyLevel: donor.locationPrivacyLevel,
            updatedAt: new Date(),
          })
          .where(eq(donorProfiles.id, donorProfileId));
      } else {
        const [newProfile] = await tx
          .insert(donorProfiles)
          .values({
            userId,
            pickupPrivacyLevel: donor.locationPrivacyLevel,
            donorType: "individual",
          })
          .returning();

        if (!newProfile) {
          throw new Error("Failed to create donor profile");
        }

        donorProfileId = newProfile.id;
        await tx.insert(userRoles).values({ userId, roleId: DONOR_ROLE_ID });
      }
    } else {
      const [newUser] = await tx
        .insert(users)
        .values({
          email: donor.email,
          phone: donor.phone,
          firstName: donor.firstName,
          lastName: donor.lastName,
          communicationPreference: "email",
        })
        .returning();

      if (!newUser) {
        throw new Error("Failed to create user");
      }

      userId = newUser.id;

      const [newProfile] = await tx
        .insert(donorProfiles)
        .values({
          userId,
          pickupPrivacyLevel: donor.locationPrivacyLevel,
          donorType: "individual",
        })
        .returning();

      if (!newProfile) {
        throw new Error("Failed to create donor profile");
      }

      donorProfileId = newProfile.id;

      await tx.insert(userRoles).values({ userId, roleId: DONOR_ROLE_ID });
    }

    const itemIds: string[] = [];
    const txClient = tx as unknown as ReturnType<typeof getDb>;

    for (const item of input.items) {
      const isClothing = item.itemKind === "clothing";

      const [furnitureItem] = await tx
        .insert(furnitureItems)
        .values({
          donorProfileId,
          itemKind: item.itemKind,
          status: "submitted",
          category: isClothing ? CLOTHING_CATEGORY : item.category,
          title: isClothing ? undefined : item.title,
          description: buildDescription(item),
          condition: item.condition,
          quantity: item.quantity,
          metadata: isClothing ? buildClothingMetadata(item) : null,
          requiresTwoPerson: isClothing ? false : item.requiresTwoPerson ?? false,
          pickupConstraints: buildPickupConstraints(donor, item),
          availabilityStart: donor.availabilityStart ?? null,
          availabilityEnd: donor.availabilityEnd ?? null,
          addressLine1: donor.addressLine1 ?? null,
          city: donor.city,
          state: donor.state,
          zipCode: donor.zipCode,
          crossStreet: donor.crossStreet ?? null,
          locationPrivacyLevel: donor.locationPrivacyLevel,
        })
        .returning();

      if (!furnitureItem) {
        throw new Error("Failed to create furniture item");
      }

      itemIds.push(furnitureItem.id);

      await logAuditEvent(txClient, {
        action: "furniture_item.submitted",
        entityType: "furniture_item",
        entityId: furnitureItem.id,
        newValues: {
          status: furnitureItem.status,
          itemKind: furnitureItem.itemKind,
          category: furnitureItem.category,
          condition: furnitureItem.condition,
          zipCode: furnitureItem.zipCode,
        },
        metadata: {
          source: "public_donate_form",
          photosPending: item.photosPending,
          batchSize: input.items.length,
        },
      });
    }

    const categoryList = input.items.map((item) => itemCategoryLabel(item)).join(", ");

    await logCommunicationEvent(txClient, {
      userId,
      channel: "email",
      direction: "outbound",
      templateCode: "donation_received",
      subject: "Sleepwell donation received",
      bodyPreview: `Donation submission received with ${input.items.length} item(s): ${categoryList}.`,
      relatedEntityType: "furniture_item",
      relatedEntityId: itemIds[0],
      status: "queued",
    });

    return {
      userId,
      itemIds,
      summaryItems: toDonationSummaryItems(input.items),
      donorName: `${donor.firstName} ${donor.lastName}`,
    };
  });
}
