import type { DonationSubmissionInput } from "@/lib/validation/donation";

type PostgresLikeError = {
  name?: string;
  message?: string;
  code?: string;
  detail?: string;
  hint?: string;
  constraint?: string;
  severity?: string;
  schema?: string;
  table?: string;
  column?: string;
};

/** Serialize DB/driver errors without leaking row data from detail fields. */
export function serializeDbError(error: unknown): Record<string, unknown> {
  if (error === null || error === undefined) {
    return { message: "Unknown error (null)" };
  }

  if (typeof error !== "object") {
    return { message: String(error) };
  }

  const err = error as PostgresLikeError & { cause?: unknown; stack?: string };

  const serialized: Record<string, unknown> = {
    name: err.name,
    message: err.message,
    code: err.code,
    detail: err.detail,
    hint: err.hint,
    constraint: err.constraint,
    severity: err.severity,
    schema: err.schema,
    table: err.table,
    column: err.column,
  };

  if (err.cause !== undefined) {
    serialized.cause = serializeDbError(err.cause);
  }

  if (error instanceof Error && error.stack) {
    serialized.stack = error.stack;
  }

  return Object.fromEntries(
    Object.entries(serialized).filter(([, value]) => value !== undefined),
  );
}

/** Log payload structure only — no names, email, phone, or street address. */
export function donationPayloadShape(
  data: DonationSubmissionInput,
): Record<string, unknown> {
  const emailParts = data.donor.email.split("@");

  return {
    donor: {
      hasFirstName: data.donor.firstName.length > 0,
      hasLastName: data.donor.lastName.length > 0,
      emailDomain: emailParts.length > 1 ? emailParts[1] : null,
      hasPhone: Boolean(data.donor.phone?.trim()),
      city: data.donor.city,
      state: data.donor.state,
      zipCode: data.donor.zipCode,
      locationPrivacyLevel: data.donor.locationPrivacyLevel,
      hasAddressLine1: Boolean(data.donor.addressLine1?.trim()),
      hasCrossStreet: Boolean(data.donor.crossStreet?.trim()),
      hasAvailabilityStart: Boolean(data.donor.availabilityStart),
      hasAvailabilityEnd: Boolean(data.donor.availabilityEnd),
      hasPickupConstraints: Boolean(data.donor.pickupConstraints?.trim()),
      hasNotes: Boolean(data.donor.notes?.trim()),
    },
    itemCount: data.items.length,
    items: data.items.map((item, index) => ({
      index,
      itemKind: item.itemKind,
      category: item.category,
      condition: item.condition,
      quantity: item.quantity,
      photosPending: item.photosPending,
      requiresTwoPerson: item.requiresTwoPerson ?? false,
      clothingType: item.clothingType ?? null,
      hasSize: Boolean(item.size?.trim()),
      genderCategory: item.genderCategory ?? null,
      hasTitle: Boolean(item.title?.trim()),
      hasDescription: Boolean(item.description?.trim()),
      hasNotes: Boolean(item.notes?.trim()),
    })),
  };
}

export function logDonationError(
  context: string,
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  console.error(`[donate] ${context}`, {
    ...extra,
    error: serializeDbError(error),
  });
}
