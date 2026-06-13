type LocationPrivacyLevel = "exact" | "cross_street" | "zip_only";

type AdminLocationInput = {
  city: string;
  state: string;
  zipCode: string;
  addressLine1?: string | null;
  crossStreet?: string | null;
  displayLocation?: string | null;
  privacyLevel?: LocationPrivacyLevel;
};

/**
 * Privacy-safe location for admin lists. Exact addresses only when privacy
 * level allows; coordinators see full address for transfer scheduling.
 */
export function formatAdminLocation(input: AdminLocationInput): string {
  if (input.displayLocation?.trim()) {
    return input.displayLocation.trim();
  }

  const base = `${input.city}, ${input.state} ${input.zipCode}`;
  const privacy = input.privacyLevel ?? "zip_only";

  if (privacy === "exact" && input.addressLine1?.trim()) {
    return `${input.addressLine1.trim()}, ${base}`;
  }

  if (privacy === "cross_street" && input.crossStreet?.trim()) {
    return `${base} (near ${input.crossStreet.trim()})`;
  }

  return base;
}

/** Request locations — city/state/ZIP only for table rows. */
export function formatRequestArea(input: {
  city: string;
  state: string;
  zipCode: string;
}): string {
  return `${input.city}, ${input.state} ${input.zipCode}`;
}
