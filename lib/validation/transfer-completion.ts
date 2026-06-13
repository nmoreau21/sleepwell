export const TRANSFER_COMPLETION_OUTCOMES = [
  "completed",
  "failed",
  "cancelled",
] as const;

export type TransferCompletionOutcome =
  (typeof TRANSFER_COMPLETION_OUTCOMES)[number];

export const TRANSFER_COMPLETABLE_STATUSES = ["scheduled", "in_progress"] as const;

export const REOPEN_CHOICES = ["reopen", "keep_reserved"] as const;
export type ReopenChoice = (typeof REOPEN_CHOICES)[number];

export const REOPEN_REQUEST_STATUSES = ["queued", "approved"] as const;
export type ReopenRequestStatus = (typeof REOPEN_REQUEST_STATUSES)[number];

/** Max allowed future offset for completed_at (1 hour). */
export const MAX_COMPLETED_AT_FUTURE_MS = 60 * 60 * 1000;

export type CompleteTransferInput = {
  matchId: string;
  transferId: string;
  outcome: TransferCompletionOutcome;
  completionNotes?: string;
  reason?: string;
  completedAt: Date;
  reopenChoice?: ReopenChoice;
  reopenRequestStatus?: ReopenRequestStatus;
};

export type CompleteTransferValidationContext = {
  matchStatus: string;
  transferStatus: string;
};

export type CompleteTransferValidationResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export function parseTransferCompletionOutcome(
  value: string,
): TransferCompletionOutcome | null {
  if (TRANSFER_COMPLETION_OUTCOMES.includes(value as TransferCompletionOutcome)) {
    return value as TransferCompletionOutcome;
  }
  return null;
}

export function parseReopenChoice(value: string): ReopenChoice | null {
  if (REOPEN_CHOICES.includes(value as ReopenChoice)) {
    return value as ReopenChoice;
  }
  return null;
}

export function parseReopenRequestStatus(
  value: string,
): ReopenRequestStatus | null {
  if (REOPEN_REQUEST_STATUSES.includes(value as ReopenRequestStatus)) {
    return value as ReopenRequestStatus;
  }
  return null;
}

export function validateCompletedAt(completedAt: Date, now: Date): boolean {
  const maxFuture = now.getTime() + MAX_COMPLETED_AT_FUTURE_MS;
  return completedAt.getTime() <= maxFuture;
}

export function validateCompleteTransferInput(
  input: CompleteTransferInput,
  context: CompleteTransferValidationContext,
  now: Date,
): CompleteTransferValidationResult {
  if (context.matchStatus !== "scheduled") {
    return {
      ok: false,
      code: "MATCH_NOT_SCHEDULED",
      message: "Match must be scheduled before completing a transfer.",
    };
  }

  if (
    !TRANSFER_COMPLETABLE_STATUSES.includes(
      context.transferStatus as (typeof TRANSFER_COMPLETABLE_STATUSES)[number],
    )
  ) {
    return {
      ok: false,
      code: "TRANSFER_NOT_COMPLETABLE",
      message: "Transfer must be scheduled or in progress.",
    };
  }

  if (!validateCompletedAt(input.completedAt, now)) {
    return {
      ok: false,
      code: "INVALID_COMPLETED_AT",
      message: "Completed time cannot be more than one hour in the future.",
    };
  }

  if (
    (input.outcome === "failed" || input.outcome === "cancelled") &&
    !input.reason?.trim()
  ) {
    return {
      ok: false,
      code: "REASON_REQUIRED",
      message: "Enter a reason for failed or cancelled transfers.",
    };
  }

  if (input.outcome === "failed" || input.outcome === "cancelled") {
    const reopen = input.reopenChoice ?? "keep_reserved";
    if (!parseReopenChoice(reopen)) {
      return {
        ok: false,
        code: "INVALID_REOPEN_CHOICE",
        message: "Select whether to reopen or keep reserved.",
      };
    }

    if (reopen === "reopen") {
      const requestStatus = input.reopenRequestStatus ?? "queued";
      if (!parseReopenRequestStatus(requestStatus)) {
        return {
          ok: false,
          code: "INVALID_REOPEN_REQUEST_STATUS",
          message: "Select queued or approved when reopening.",
        };
      }
    }
  }

  return { ok: true };
}

export function computeRecipientRequestStatusAfterFulfillment(
  needLines: { essential: boolean; status: string }[],
): "fulfilled" | "partially_matched" {
  const essentialLines = needLines.filter((line) => line.essential);
  const linesToEvaluate =
    essentialLines.length > 0 ? essentialLines : needLines;

  const allFulfilled = linesToEvaluate.every((line) => line.status === "fulfilled");

  if (allFulfilled) {
    return "fulfilled";
  }

  return "partially_matched";
}

export const COMPLETE_TRANSFER_ERROR_MESSAGES: Record<string, string> = {
  not_found: "Match or transfer not found.",
  match_not_scheduled: "Match must be scheduled before completing a transfer.",
  transfer_not_completable: "Transfer must be scheduled or in progress.",
  invalid_completed_at: "Completed time cannot be far in the future.",
  reason_required: "Enter a reason for failed or cancelled transfers.",
  invalid_reopen_choice: "Select whether to reopen or keep reserved.",
  invalid_reopen_request_status: "Select queued or approved when reopening.",
  complete_failed: "Could not update transfer. Try again.",
  invalid_outcome: "Select a valid completion outcome.",
  invalid_datetime: "Enter a valid completion time.",
};

export function validateTransferCompletionRules(): string[] {
  const errors: string[] = [];
  const now = new Date("2026-06-10T12:00:00Z");

  const valid = validateCompleteTransferInput(
    {
      matchId: "m",
      transferId: "t",
      outcome: "completed",
      completedAt: now,
    },
    { matchStatus: "scheduled", transferStatus: "scheduled" },
    now,
  );

  if (!valid.ok) {
    errors.push("Expected valid completed baseline");
  }

  const needsReason = validateCompleteTransferInput(
    {
      matchId: "m",
      transferId: "t",
      outcome: "failed",
      completedAt: now,
      reopenChoice: "keep_reserved",
    },
    { matchStatus: "scheduled", transferStatus: "scheduled" },
    now,
  );

  if (needsReason.ok || needsReason.code !== "REASON_REQUIRED") {
    errors.push("Expected REASON_REQUIRED for failed without reason");
  }

  const fulfilled = computeRecipientRequestStatusAfterFulfillment([
    { essential: true, status: "fulfilled" },
    { essential: true, status: "fulfilled" },
  ]);

  if (fulfilled !== "fulfilled") {
    errors.push("Expected fulfilled when all essential lines fulfilled");
  }

  return errors;
}
