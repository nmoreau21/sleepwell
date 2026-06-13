import { FURNITURE_CATEGORIES } from "@/lib/validation/categories";
import {
  CLOTHING_GENDER_CATEGORIES,
  CLOTHING_TYPES,
  type ClothingGenderCategory,
  type ClothingType,
  type DonationItemKind,
} from "@/lib/validation/clothing";
import type { DonationItemInput } from "@/lib/validation/donation";

export function clothingTypeLabel(value: ClothingType | string | undefined): string {
  return CLOTHING_TYPES.find((entry) => entry.value === value)?.label ?? value ?? "";
}

export function genderCategoryLabel(
  value: ClothingGenderCategory | string | undefined,
): string {
  return (
    CLOTHING_GENDER_CATEGORIES.find((entry) => entry.value === value)?.label ??
    value ??
    ""
  );
}

export function furnitureCategoryLabel(category: string): string {
  return (
    FURNITURE_CATEGORIES.find((entry) => entry.value === category)?.label ??
    category
  );
}

/** Primary label for review/success: "Dresser", "Clothing: Top", etc. */
export function formatDonationItemLabel(item: DonationItemInput): string {
  if (item.itemKind === "clothing") {
    const typeLabel =
      item.clothingType === "tops"
        ? "Top"
        : item.clothingType === "bottoms"
          ? "Bottom"
          : "Clothing";
    return `Clothing: ${typeLabel}`;
  }

  const label = furnitureCategoryLabel(item.category);
  const title = item.title?.trim();
  return title ? `${label} — ${title}` : label;
}

export function formatDonationItemDetails(item: DonationItemInput): string[] {
  const details: string[] = [];

  if (item.itemKind === "clothing") {
    if (item.size) {
      details.push(`Size ${item.size}`);
    }
    if (item.genderCategory) {
      details.push(genderCategoryLabel(item.genderCategory));
    }
    if (item.notes) {
      details.push(item.notes);
    }
  } else {
    if (item.description) {
      details.push(item.description);
    }
    if (item.requiresTwoPerson) {
      details.push("Two-person move");
    }
  }

  return details;
}

export type AdminItemDisplayInput = {
  itemKind: DonationItemKind | string;
  category: string;
  title?: string | null;
  metadata?: {
    clothing_type?: ClothingType | string;
    size?: string;
    gender_category?: ClothingGenderCategory | string;
  } | null;
};

export function formatAdminDonationItemLabel(input: AdminItemDisplayInput): string {
  if (input.itemKind === "clothing" || input.category === "clothing") {
    const clothingType = input.metadata?.clothing_type;
    const typeLabel =
      clothingType === "tops"
        ? "Top"
        : clothingType === "bottoms"
          ? "Bottom"
          : "Clothing";
    return `Clothing: ${typeLabel}`;
  }

  const label = furnitureCategoryLabel(input.category);
  const title = input.title?.trim();
  return title ? `${label} — ${title}` : label;
}

export function formatAdminClothingDetails(
  metadata: AdminItemDisplayInput["metadata"],
): string[] {
  if (!metadata) {
    return [];
  }

  const parts: string[] = [];
  if (metadata.size) {
    parts.push(`Size: ${metadata.size}`);
  }
  if (metadata.gender_category) {
    parts.push(genderCategoryLabel(metadata.gender_category));
  }
  return parts;
}
