const MATCHABLE_REQUEST_STATUSES = ["approved", "queued"] as const;

const ACTIVE_MATCH_TERMINAL_STATUSES = [
  "completed",
  "cancelled",
  "match_rejected",
  "match_expired",
] as const;

export type CreateMatchValidationInput = {
  itemStatus: string;
  itemCategory: string;
  itemQuantity: number;
  needLineStatus: string;
  needCategory: string;
  quantityNeeded: number;
  quantityMatched: number;
  requestStatus: string;
  hasActiveItemMatch: boolean;
  hasActiveNeedMatch: boolean;
};

export type CreateMatchValidationResult =
  | { ok: true; remainingQuantity: number }
  | { ok: false; code: string; message: string };

export function remainingNeedQuantity(
  quantityNeeded: number,
  quantityMatched: number,
): number {
  return Math.max(0, quantityNeeded - quantityMatched);
}

export function validateCreateMatchInput(
  input: CreateMatchValidationInput,
): CreateMatchValidationResult {
  if (input.itemStatus !== "available") {
    return {
      ok: false,
      code: "ITEM_NOT_AVAILABLE",
      message: "Item is not available for matching.",
    };
  }

  if (input.needLineStatus !== "open") {
    return {
      ok: false,
      code: "NEED_LINE_NOT_OPEN",
      message: "This need line is no longer open.",
    };
  }

  if (
    !MATCHABLE_REQUEST_STATUSES.includes(
      input.requestStatus as (typeof MATCHABLE_REQUEST_STATUSES)[number],
    )
  ) {
    return {
      ok: false,
      code: "REQUEST_NOT_MATCHABLE",
      message: "Recipient request is not approved or queued for matching.",
    };
  }

  if (input.itemCategory !== input.needCategory) {
    return {
      ok: false,
      code: "CATEGORY_MISMATCH",
      message: "Item category does not match the need line.",
    };
  }

  const remaining = remainingNeedQuantity(
    input.quantityNeeded,
    input.quantityMatched,
  );

  if (remaining <= 0) {
    return {
      ok: false,
      code: "NEED_ALREADY_FULFILLED",
      message: "This need line is already fully matched.",
    };
  }

  if (input.itemQuantity < remaining) {
    return {
      ok: false,
      code: "INSUFFICIENT_QUANTITY",
      message: `Item quantity (${input.itemQuantity}) is less than remaining need (${remaining}).`,
    };
  }

  if (input.hasActiveItemMatch) {
    return {
      ok: false,
      code: "DUPLICATE_ITEM_MATCH",
      message: "This item already has an active match.",
    };
  }

  if (input.hasActiveNeedMatch) {
    return {
      ok: false,
      code: "DUPLICATE_NEED_MATCH",
      message: "This need line already has an active match.",
    };
  }

  return { ok: true, remainingQuantity: remaining };
}

export function isActiveMatchStatus(status: string): boolean {
  return !ACTIVE_MATCH_TERMINAL_STATUSES.includes(
    status as (typeof ACTIVE_MATCH_TERMINAL_STATUSES)[number],
  );
}

export function computeRecipientRequestStatusAfterMatch(
  needLines: { essential: boolean; status: string }[],
): "partially_matched" | "fully_matched" | null {
  const essentialLines = needLines.filter((line) => line.essential);

  const linesToEvaluate =
    essentialLines.length > 0 ? essentialLines : needLines;

  if (linesToEvaluate.length === 0) {
    return null;
  }

  const isSatisfied = (status: string) =>
    status === "matched" || status === "fulfilled";

  const satisfiedCount = linesToEvaluate.filter((line) =>
    isSatisfied(line.status),
  ).length;
  const openCount = linesToEvaluate.filter((line) => line.status === "open").length;

  if (satisfiedCount === 0) {
    return null;
  }

  if (openCount === 0) {
    return "fully_matched";
  }

  return "partially_matched";
}

/** Console-safe checks for match creation rules. */
export function validateCreateMatchRules(): string[] {
  const errors: string[] = [];

  const valid = validateCreateMatchInput({
    itemStatus: "available",
    itemCategory: "bed",
    itemQuantity: 2,
    needLineStatus: "open",
    needCategory: "bed",
    quantityNeeded: 2,
    quantityMatched: 0,
    requestStatus: "queued",
    hasActiveItemMatch: false,
    hasActiveNeedMatch: false,
  });

  if (!valid.ok) {
    errors.push("Expected valid baseline match input");
  }

  const insufficient = validateCreateMatchInput({
    itemStatus: "available",
    itemCategory: "bed",
    itemQuantity: 1,
    needLineStatus: "open",
    needCategory: "bed",
    quantityNeeded: 2,
    quantityMatched: 0,
    requestStatus: "approved",
    hasActiveItemMatch: false,
    hasActiveNeedMatch: false,
  });

  if (insufficient.ok || insufficient.code !== "INSUFFICIENT_QUANTITY") {
    errors.push("Expected INSUFFICIENT_QUANTITY when item qty < need");
  }

  const statusAfterPartial = computeRecipientRequestStatusAfterMatch([
    { essential: true, status: "matched" },
    { essential: true, status: "open" },
  ]);

  if (statusAfterPartial !== "partially_matched") {
    errors.push("Expected partially_matched when essential lines remain open");
  }

  const statusAfterFull = computeRecipientRequestStatusAfterMatch([
    { essential: true, status: "matched" },
    { essential: true, status: "fulfilled" },
  ]);

  if (statusAfterFull !== "fully_matched") {
    errors.push("Expected fully_matched when all essential lines satisfied");
  }

  return errors;
}
