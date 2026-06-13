import {
  FURNITURE_CATEGORIES,
  type FurnitureCategory,
} from "@/lib/validation/categories";
import {
  CLOTHING_CATEGORY,
  CLOTHING_GENDER_CATEGORIES,
  CLOTHING_TYPES,
  DONATION_ITEM_KINDS,
  type ClothingGenderCategory,
  type ClothingType,
  type DonationItemKind,
} from "@/lib/validation/clothing";
import { formatDonationItemLabel } from "@/lib/validation/donation-item-display";

export { FURNITURE_CATEGORIES, type FurnitureCategory };
export {
  CLOTHING_CATEGORY,
  CLOTHING_GENDER_CATEGORIES,
  CLOTHING_TYPES,
  DONATION_ITEM_KINDS,
  type ClothingGenderCategory,
  type ClothingType,
  type DonationItemKind,
};

export const ITEM_CONDITIONS = [
  { value: "excellent", label: "Excellent — like new" },
  { value: "good", label: "Good — gently used" },
  { value: "fair", label: "Fair — visible wear but functional" },
  { value: "poor", label: "Poor — needs repair" },
] as const;

export const LOCATION_PRIVACY_LEVELS = [
  { value: "zip_only", label: "City and ZIP only (recommended)" },
  { value: "cross_street", label: "Major cross streets" },
  { value: "exact", label: "Exact address for pickup" },
] as const;

export type ItemCondition = (typeof ITEM_CONDITIONS)[number]["value"];
export type LocationPrivacyLevel =
  (typeof LOCATION_PRIVACY_LEVELS)[number]["value"];

/** Per-item fields in a multi-item donation. */
export type DonationItemInput = {
  itemKind: DonationItemKind;
  category: string;
  title?: string;
  description?: string;
  condition: ItemCondition;
  quantity: number;
  requiresTwoPerson?: boolean;
  photosPending: boolean;
  clothingType?: ClothingType;
  size?: string;
  genderCategory?: ClothingGenderCategory;
  notes?: string;
};

/** Donor contact + shared pickup location (one per submission). */
export type DonorPickupInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  pickupConstraints?: string;
  availabilityStart?: string;
  availabilityEnd?: string;
  city: string;
  state: string;
  zipCode: string;
  crossStreet?: string;
  addressLine1?: string;
  locationPrivacyLevel: LocationPrivacyLevel;
  notes?: string;
};

export type DonationSubmissionInput = {
  donor: DonorPickupInput;
  items: DonationItemInput[];
};

export type DonationValidationResult =
  | { ok: true; data: DonationSubmissionInput }
  | { ok: false; error: string };

export type DonationItemValidationResult =
  | { ok: true; data: DonationItemInput }
  | { ok: false; error: string };

export type DonationSummaryItem = {
  itemKind: DonationItemKind;
  category: string;
  categoryLabel: string;
  title?: string;
  quantity: number;
  condition: string;
  conditionLabel: string;
  clothingType?: ClothingType;
  clothingTypeLabel?: string;
  size?: string;
  genderCategory?: ClothingGenderCategory;
  genderCategoryLabel?: string;
  notes?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_RE = /^\d{5}(-\d{4})?$/;
const STATE_RE = /^[A-Za-z]{2}$/;

function parseOptionalString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function conditionLabel(value: string): string {
  return ITEM_CONDITIONS.find((entry) => entry.value === value)?.label ?? value;
}

function clothingTypeLabel(value: ClothingType): string {
  return CLOTHING_TYPES.find((entry) => entry.value === value)?.label ?? value;
}

function genderCategoryLabel(value: ClothingGenderCategory): string {
  return (
    CLOTHING_GENDER_CATEGORIES.find((entry) => entry.value === value)?.label ??
    value
  );
}

function parseItemKind(raw: unknown): DonationItemKind {
  const value = String(raw ?? "furniture").trim();
  if (DONATION_ITEM_KINDS.some((entry) => entry.value === value)) {
    return value as DonationItemKind;
  }
  return "furniture";
}

export function validateDonationItem(
  raw: unknown,
): DonationItemValidationResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Invalid item data." };
  }

  const record = raw as Record<string, unknown>;
  const itemKind = parseItemKind(record.itemKind);
  const condition = String(record.condition ?? "").trim();
  const quantityRaw = String(record.quantity ?? "1").trim();
  const photosPending = record.photosPending !== false;

  if (!ITEM_CONDITIONS.some((entry) => entry.value === condition)) {
    return { ok: false, error: "Select the item condition." };
  }

  const quantity = Number.parseInt(quantityRaw, 10);
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > 20) {
    return { ok: false, error: "Quantity must be between 1 and 20." };
  }

  if (itemKind === "clothing") {
    const clothingType = String(record.clothingType ?? "").trim();
    const size = parseOptionalString(record.size);
    const genderCategory = String(record.genderCategory ?? "").trim();
    const notes = parseOptionalString(record.notes);

    if (!CLOTHING_TYPES.some((entry) => entry.value === clothingType)) {
      return { ok: false, error: "Select tops or bottoms." };
    }

    if (!size) {
      return { ok: false, error: "Enter a clothing size." };
    }

    if (
      !CLOTHING_GENDER_CATEGORIES.some((entry) => entry.value === genderCategory)
    ) {
      return { ok: false, error: "Select a gender category." };
    }

    return {
      ok: true,
      data: {
        itemKind: "clothing",
        category: CLOTHING_CATEGORY,
        condition: condition as ItemCondition,
        quantity,
        photosPending,
        clothingType: clothingType as ClothingType,
        size,
        genderCategory: genderCategory as ClothingGenderCategory,
        notes,
      },
    };
  }

  const category = String(record.category ?? "").trim();
  const title = parseOptionalString(record.title);
  const description = parseOptionalString(record.description);
  const requiresTwoPerson = record.requiresTwoPerson === true;

  if (!FURNITURE_CATEGORIES.some((entry) => entry.value === category)) {
    return { ok: false, error: "Select a furniture category." };
  }

  return {
    ok: true,
    data: {
      itemKind: "furniture",
      category,
      title,
      description,
      condition: condition as ItemCondition,
      quantity,
      requiresTwoPerson,
      photosPending,
    },
  };
}

export function validateDonorPickup(raw: unknown): DonationValidationResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Invalid donor information." };
  }

  const record = raw as Record<string, unknown>;
  const firstName = String(record.firstName ?? "").trim();
  const lastName = String(record.lastName ?? "").trim();
  const email = String(record.email ?? "").trim().toLowerCase();
  const phone = parseOptionalString(record.phone);
  const pickupConstraints = parseOptionalString(record.pickupConstraints);
  const availabilityStart = parseOptionalString(record.availabilityStart);
  const availabilityEnd = parseOptionalString(record.availabilityEnd);
  const city = String(record.city ?? "").trim();
  const state = String(record.state ?? "").trim().toUpperCase();
  const zipCode = String(record.zipCode ?? "").trim();
  const crossStreet = parseOptionalString(record.crossStreet);
  const addressLine1 = parseOptionalString(record.addressLine1);
  const locationPrivacyLevel = String(
    record.locationPrivacyLevel ?? "zip_only",
  ).trim();
  const notes = parseOptionalString(record.notes);

  if (!firstName || !lastName) {
    return { ok: false, error: "Enter your first and last name." };
  }

  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  if (!city) {
    return { ok: false, error: "Enter a city." };
  }

  if (!STATE_RE.test(state)) {
    return { ok: false, error: "Enter a two-letter state code (e.g. CA)." };
  }

  if (!ZIP_RE.test(zipCode)) {
    return { ok: false, error: "Enter a valid ZIP code." };
  }

  if (
    !LOCATION_PRIVACY_LEVELS.some(
      (entry) => entry.value === locationPrivacyLevel,
    )
  ) {
    return { ok: false, error: "Select a location privacy preference." };
  }

  if (locationPrivacyLevel === "exact" && !addressLine1) {
    return {
      ok: false,
      error: "Enter a pickup address when sharing exact location.",
    };
  }

  if (
    availabilityStart &&
    availabilityEnd &&
    availabilityStart > availabilityEnd
  ) {
    return {
      ok: false,
      error: "Availability end date must be on or after the start date.",
    };
  }

  return {
    ok: true,
    data: {
      donor: {
        firstName,
        lastName,
        email,
        phone,
        pickupConstraints,
        availabilityStart,
        availabilityEnd,
        city,
        state,
        zipCode,
        crossStreet,
        addressLine1,
        locationPrivacyLevel: locationPrivacyLevel as LocationPrivacyLevel,
        notes,
      },
      items: [],
    },
  };
}

export function parseDonationSubmissionJson(
  json: string,
): DonationValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "Invalid submission payload." };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "Invalid submission payload." };
  }

  const record = parsed as Record<string, unknown>;
  const donorResult = validateDonorPickup(record.donor);

  if (!donorResult.ok) {
    return donorResult;
  }

  if (!Array.isArray(record.items)) {
    return { ok: false, error: "Add at least one item to your donation." };
  }

  if (record.items.length === 0) {
    return {
      ok: false,
      error: "Add at least one item before submitting.",
    };
  }

  if (record.items.length > 20) {
    return { ok: false, error: "You can submit up to 20 items per donation." };
  }

  const items: DonationItemInput[] = [];

  for (let index = 0; index < record.items.length; index += 1) {
    const itemResult = validateDonationItem(record.items[index]);
    if (!itemResult.ok) {
      return {
        ok: false,
        error: `Item ${index + 1}: ${itemResult.error}`,
      };
    }
    items.push(itemResult.data);
  }

  return {
    ok: true,
    data: {
      donor: donorResult.data.donor,
      items,
    },
  };
}

export function toDonationSummaryItems(
  items: DonationItemInput[],
): DonationSummaryItem[] {
  return items.map((item) => ({
    itemKind: item.itemKind,
    category: item.category,
    categoryLabel: formatDonationItemLabel(item),
    title: item.title,
    quantity: item.quantity,
    condition: item.condition,
    conditionLabel: conditionLabel(item.condition),
    clothingType: item.clothingType,
    clothingTypeLabel: item.clothingType
      ? clothingTypeLabel(item.clothingType)
      : undefined,
    size: item.size,
    genderCategory: item.genderCategory,
    genderCategoryLabel: item.genderCategory
      ? genderCategoryLabel(item.genderCategory)
      : undefined,
    notes: item.notes,
  }));
}

/** Legacy single-item FormData parser (kept for compatibility). */
export function parseDonationFormData(formData: FormData): DonationValidationResult {
  const donorPayload = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    pickupConstraints: formData.get("pickupConstraints"),
    availabilityStart: formData.get("availabilityStart"),
    availabilityEnd: formData.get("availabilityEnd"),
    city: formData.get("city"),
    state: formData.get("state"),
    zipCode: formData.get("zipCode"),
    crossStreet: formData.get("crossStreet"),
    addressLine1: formData.get("addressLine1"),
    locationPrivacyLevel: formData.get("locationPrivacyLevel"),
    notes: formData.get("notes"),
  };

  const donorResult = validateDonorPickup(donorPayload);
  if (!donorResult.ok) {
    return donorResult;
  }

  const itemResult = validateDonationItem({
    itemKind: formData.get("itemKind") ?? "furniture",
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description"),
    condition: formData.get("condition"),
    quantity: formData.get("quantity"),
    requiresTwoPerson: formData.get("requiresTwoPerson") === "on",
    photosPending: formData.get("photosPending") === "on",
    clothingType: formData.get("clothingType"),
    size: formData.get("size"),
    genderCategory: formData.get("genderCategory"),
    notes: formData.get("notes"),
  });

  if (!itemResult.ok) {
    return itemResult;
  }

  return {
    ok: true,
    data: {
      donor: donorResult.data.donor,
      items: [itemResult.data],
    },
  };
}
