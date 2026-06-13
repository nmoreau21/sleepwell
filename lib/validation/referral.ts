import {
  FURNITURE_CATEGORIES,
  type FurnitureCategory,
} from "@/lib/validation/categories";

export const INTAKE_MODES = ["self", "partner"] as const;
export type IntakeMode = (typeof INTAKE_MODES)[number];

export const URGENCY_LEVELS = [
  { value: "emergency", label: "Emergency — housing needed within days" },
  { value: "urgent", label: "Urgent — move-in within two weeks" },
  { value: "standard", label: "Standard" },
] as const;

export type UrgencyLevel = (typeof URGENCY_LEVELS)[number]["value"];

export type NeedLineInput = {
  category: FurnitureCategory;
  quantityNeeded: number;
  essential: boolean;
  sizePreference?: string;
  notes?: string;
};

export type ReferralFormInput = {
  intakeMode: IntakeMode;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  householdSize?: number;
  urgency: UrgencyLevel;
  moveInDate?: string;
  housingAddressLine1?: string;
  city: string;
  state: string;
  zipCode: string;
  accessNotes?: string;
  needsDelivery: boolean;
  hasVehicle: boolean;
  canPickupLargeItems: boolean;
  notes?: string;
  needLines: NeedLineInput[];
  referralCode?: string;
  housingConfirmed?: boolean;
  partnerContactName?: string;
  partnerContactEmail?: string;
  partnerNotes?: string;
};

export type ReferralValidationResult =
  | { ok: true; data: ReferralFormInput }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_RE = /^\d{5}(-\d{4})?$/;
const STATE_RE = /^[A-Za-z]{2}$/;

function parseOptionalString(value: FormDataEntryValue | null): string | undefined {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseNeedLines(formData: FormData): NeedLineInput[] | null {
  const categories = formData
    .getAll("needCategory")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (categories.length === 0) {
    return null;
  }

  const needLines: NeedLineInput[] = [];

  for (const category of categories) {
    if (!FURNITURE_CATEGORIES.some((entry) => entry.value === category)) {
      return null;
    }

    const quantityKey = `needQuantity_${category}`;
    const quantityRaw = String(formData.get(quantityKey) ?? "1").trim();
    const quantity = Number.parseInt(quantityRaw, 10);
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 10) {
      return null;
    }

    const sizePreference = parseOptionalString(
      formData.get(`needSize_${category}`),
    );
    const notes = parseOptionalString(formData.get(`needNotes_${category}`));

    needLines.push({
      category: category as FurnitureCategory,
      quantityNeeded: quantity,
      essential: true,
      sizePreference,
      notes,
    });
  }

  return needLines;
}

export function parseReferralFormData(formData: FormData): ReferralValidationResult {
  const intakeMode = String(formData.get("intakeMode") ?? "").trim();

  if (!INTAKE_MODES.includes(intakeMode as IntakeMode)) {
    return { ok: false, error: "Select how you are submitting this request." };
  }

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = parseOptionalString(formData.get("phone"));

  const householdSizeRaw = parseOptionalString(formData.get("householdSize"));
  const urgency = String(formData.get("urgency") ?? "standard").trim();
  const moveInDate = parseOptionalString(formData.get("moveInDate"));

  const housingAddressLine1 = parseOptionalString(
    formData.get("housingAddressLine1"),
  );
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim().toUpperCase();
  const zipCode = String(formData.get("zipCode") ?? "").trim();
  const accessNotes = parseOptionalString(formData.get("accessNotes"));
  const notes = parseOptionalString(formData.get("notes"));

  const deliveryAbility = String(formData.get("deliveryAbility") ?? "").trim();
  const hasVehicle = formData.get("hasVehicle") === "on";
  const canPickupLargeItems = formData.get("canPickupLargeItems") === "on";

  const referralCode = parseOptionalString(formData.get("referralCode"));
  const housingConfirmed = formData.get("housingConfirmed") === "on";
  const partnerContactName = parseOptionalString(formData.get("partnerContactName"));
  const partnerContactEmail = parseOptionalString(
    formData.get("partnerContactEmail"),
  );
  const partnerNotes = parseOptionalString(formData.get("partnerNotes"));

  if (!firstName || !lastName) {
    return { ok: false, error: "Enter the recipient's first and last name." };
  }

  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  if (!URGENCY_LEVELS.some((entry) => entry.value === urgency)) {
    return { ok: false, error: "Select an urgency level." };
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

  let householdSize: number | undefined;
  if (householdSizeRaw) {
    householdSize = Number.parseInt(householdSizeRaw, 10);
    if (!Number.isFinite(householdSize) || householdSize < 1 || householdSize > 20) {
      return {
        ok: false,
        error: "Household size must be between 1 and 20.",
      };
    }
  }

  const needLines = parseNeedLines(formData);
  if (!needLines) {
    return {
      ok: false,
      error: "Select at least one needed item category with valid quantities.",
    };
  }

  let needsDelivery = true;
  if (deliveryAbility === "can_pickup") {
    needsDelivery = false;
  } else if (deliveryAbility === "needs_delivery") {
    needsDelivery = true;
  } else {
    return { ok: false, error: "Select whether delivery help is needed." };
  }

  if (intakeMode === "partner") {
    if (!referralCode) {
      return { ok: false, error: "Enter your organization's partner referral code." };
    }

    if (!housingConfirmed) {
      return {
        ok: false,
        error: "Confirm that stable housing is secured for this client.",
      };
    }
  }

  return {
    ok: true,
    data: {
      intakeMode: intakeMode as IntakeMode,
      firstName,
      lastName,
      email,
      phone,
      householdSize,
      urgency: urgency as UrgencyLevel,
      moveInDate,
      housingAddressLine1,
      city,
      state,
      zipCode,
      accessNotes,
      needsDelivery,
      hasVehicle,
      canPickupLargeItems,
      notes,
      needLines,
      referralCode: intakeMode === "partner" ? referralCode : undefined,
      housingConfirmed: intakeMode === "partner" ? housingConfirmed : false,
      partnerContactName:
        intakeMode === "partner" ? partnerContactName : undefined,
      partnerContactEmail:
        intakeMode === "partner" ? partnerContactEmail : undefined,
      partnerNotes: intakeMode === "partner" ? partnerNotes : undefined,
    },
  };
}
