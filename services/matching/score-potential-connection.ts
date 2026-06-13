/**
 * Pure scoring for MVP potential connections (zip/city/urgency/pickup).
 * No distance calculation — deferred to Phase 6.
 */

export type PotentialConnectionScoreInput = {
  itemZip: string;
  itemCity: string;
  itemState: string;
  requestZip: string;
  requestCity: string;
  requestState: string;
  priority: string;
  needsDelivery: boolean;
};

export type PotentialConnectionScoreResult = {
  score: number;
  reasons: string[];
};

const URGENCY_SCORE: Record<string, number> = {
  emergency: 25,
  urgent: 15,
  standard: 5,
};

function normalizeZip(zip: string): string {
  return zip.trim().slice(0, 5);
}

function normalizeCity(city: string): string {
  return city.trim().toLowerCase();
}

function normalizeState(state: string): string {
  return state.trim().toUpperCase();
}

/**
 * Score a category-matched item/need pairing. Category match is required
 * before calling — callers filter on category equality first.
 */
export function scorePotentialConnection(
  input: PotentialConnectionScoreInput,
): PotentialConnectionScoreResult {
  const reasons: string[] = ["Same category"];
  let score = 10;

  const sameZip =
    normalizeZip(input.itemZip) === normalizeZip(input.requestZip);
  const sameCity =
    normalizeCity(input.itemCity) === normalizeCity(input.requestCity) &&
    normalizeState(input.itemState) === normalizeState(input.requestState);

  if (sameZip) {
    score += 30;
    reasons.push("Same ZIP");
  } else if (sameCity) {
    score += 20;
    reasons.push("Same city");
  }

  const urgencyPoints = URGENCY_SCORE[input.priority] ?? URGENCY_SCORE.standard;
  score += urgencyPoints;

  if (input.priority === "emergency" || input.priority === "urgent") {
    reasons.push("Urgent request");
  }

  if (!input.needsDelivery) {
    score += 10;
    reasons.push("Recipient can pick up");
  }

  return { score, reasons };
}

/** Console-safe sanity checks for scoring rules (no test runner required). */
export function validatePotentialConnectionScoring(): string[] {
  const errors: string[] = [];

  const zipMatch = scorePotentialConnection({
    itemZip: "90210",
    itemCity: "Beverly Hills",
    itemState: "CA",
    requestZip: "90210",
    requestCity: "Beverly Hills",
    requestState: "CA",
    priority: "emergency",
    needsDelivery: false,
  });

  if (zipMatch.score < 50) {
    errors.push(`Expected high zip+urgency score, got ${zipMatch.score}`);
  }

  if (!zipMatch.reasons.includes("Same ZIP")) {
    errors.push("Expected Same ZIP reason");
  }

  const cityOnly = scorePotentialConnection({
    itemZip: "90211",
    itemCity: "Beverly Hills",
    itemState: "CA",
    requestZip: "90210",
    requestCity: "Beverly Hills",
    requestState: "CA",
    priority: "standard",
    needsDelivery: true,
  });

  if (!cityOnly.reasons.includes("Same city")) {
    errors.push("Expected Same city reason when ZIP differs");
  }

  if (zipMatch.score <= cityOnly.score) {
    errors.push("ZIP match should outrank city-only match");
  }

  return errors;
}
