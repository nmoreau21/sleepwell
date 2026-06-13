import { FURNITURE_CATEGORIES } from "@/lib/validation/categories";

function categoryLabel(category: string): string {
  const entry = FURNITURE_CATEGORIES.find((item) => item.value === category);
  if (entry) {
    return entry.label.toLowerCase();
  }
  return category.replace(/_/g, " ");
}

/**
 * Privacy-safe impact summary — no names, addresses, or identifying details.
 */
export function buildImpactSummary(category: string, quantity: number): string {
  const label = categoryLabel(category);
  const lead =
    quantity > 1
      ? `${quantity} donated ${label} items were`
      : `A donated ${label} was`;

  return `${lead} successfully transferred to support a recipient transitioning into stable housing.`;
}
