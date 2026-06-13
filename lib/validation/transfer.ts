export const TRANSFER_METHODS = [
  { value: "recipient_pickup", label: "Recipient pickup" },
  { value: "volunteer_delivery", label: "Volunteer delivery" },
  { value: "paid_delivery", label: "Paid delivery" },
  { value: "storage_exception", label: "Storage exception" },
] as const;

export type TransferMethod = (typeof TRANSFER_METHODS)[number]["value"];

export const TRANSFER_METHOD_VALUES = TRANSFER_METHODS.map(
  (entry) => entry.value,
);

export const ACTIVE_TRANSFER_TERMINAL_STATUSES = [
  "completed",
  "cancelled",
  "failed",
] as const;

export type ScheduleTransferInput = {
  matchId: string;
  transferMethod: TransferMethod;
  scheduledStart: Date;
  scheduledEnd: Date;
  pickupInstructions?: string;
  deliveryInstructions?: string;
  coordinatorNotes?: string;
  donorContactConfirmed: boolean;
  recipientContactConfirmed: boolean;
};

export type ScheduleTransferValidationContext = {
  matchStatus: string;
  itemStatus: string;
  hasActiveTransfer: boolean;
};

export type ScheduleTransferValidationResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export function parseTransferMethod(value: string): TransferMethod | null {
  if (TRANSFER_METHOD_VALUES.includes(value as TransferMethod)) {
    return value as TransferMethod;
  }
  return null;
}

export function validateScheduleTransferInput(
  input: ScheduleTransferInput,
  context: ScheduleTransferValidationContext,
): ScheduleTransferValidationResult {
  if (context.matchStatus !== "approved") {
    return {
      ok: false,
      code: "MATCH_NOT_APPROVED",
      message: "Match must be approved before scheduling a transfer.",
    };
  }

  if (context.itemStatus !== "reserved") {
    return {
      ok: false,
      code: "ITEM_NOT_RESERVED",
      message: "Item must be reserved before scheduling a transfer.",
    };
  }

  if (context.hasActiveTransfer) {
    return {
      ok: false,
      code: "TRANSFER_ALREADY_EXISTS",
      message: "An active transfer already exists for this match.",
    };
  }

  if (!parseTransferMethod(input.transferMethod)) {
    return {
      ok: false,
      code: "INVALID_TRANSFER_METHOD",
      message: "Select a valid transfer method.",
    };
  }

  if (input.scheduledEnd <= input.scheduledStart) {
    return {
      ok: false,
      code: "INVALID_SCHEDULE_WINDOW",
      message: "Scheduled end must be after scheduled start.",
    };
  }

  return { ok: true };
}

export const SCHEDULE_TRANSFER_ERROR_MESSAGES: Record<string, string> = {
  not_found: "Match not found.",
  match_not_approved: "Match must be approved before scheduling.",
  item_not_reserved: "Item must be reserved before scheduling.",
  transfer_already_exists: "A transfer is already scheduled for this match.",
  invalid_transfer_method: "Select a valid transfer method.",
  invalid_schedule_window: "Scheduled end must be after scheduled start.",
  create_failed: "Could not schedule transfer. Try again.",
  invalid_datetime: "Enter valid scheduled start and end times.",
  schedule_failed: "Could not schedule transfer. Try again.",
};

export function validateScheduleTransferRules(): string[] {
  const errors: string[] = [];

  const valid = validateScheduleTransferInput(
    {
      matchId: "test",
      transferMethod: "recipient_pickup",
      scheduledStart: new Date("2026-06-10T10:00:00Z"),
      scheduledEnd: new Date("2026-06-10T12:00:00Z"),
      donorContactConfirmed: true,
      recipientContactConfirmed: false,
    },
    {
      matchStatus: "approved",
      itemStatus: "reserved",
      hasActiveTransfer: false,
    },
  );

  if (!valid.ok) {
    errors.push("Expected valid baseline schedule input");
  }

  const badWindow = validateScheduleTransferInput(
    {
      matchId: "test",
      transferMethod: "volunteer_delivery",
      scheduledStart: new Date("2026-06-10T12:00:00Z"),
      scheduledEnd: new Date("2026-06-10T10:00:00Z"),
      donorContactConfirmed: false,
      recipientContactConfirmed: false,
    },
    {
      matchStatus: "approved",
      itemStatus: "reserved",
      hasActiveTransfer: false,
    },
  );

  if (badWindow.ok || badWindow.code !== "INVALID_SCHEDULE_WINDOW") {
    errors.push("Expected INVALID_SCHEDULE_WINDOW for end <= start");
  }

  return errors;
}
