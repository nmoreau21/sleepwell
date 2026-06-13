import {
  FURNITURE_ITEM_ADMIN_TRANSITIONS,
  FURNITURE_ITEM_QUEUE_STATUSES,
  RECIPIENT_REQUEST_ADMIN_TRANSITIONS,
  RECIPIENT_REQUEST_QUEUE_STATUSES,
  type FurnitureItemAdminTransition,
  type RecipientRequestAdminTransition,
} from "@/types/statuses";

export function isFurnitureItemQueueStatus(
  value: string,
): value is FurnitureItemAdminTransition | "submitted" | "under_review" {
  return (
    FURNITURE_ITEM_QUEUE_STATUSES.includes(
      value as (typeof FURNITURE_ITEM_QUEUE_STATUSES)[number],
    ) ||
    FURNITURE_ITEM_ADMIN_TRANSITIONS.includes(
      value as FurnitureItemAdminTransition,
    )
  );
}

export function parseFurnitureItemStatus(
  value: string,
): FurnitureItemAdminTransition | null {
  if (
    FURNITURE_ITEM_ADMIN_TRANSITIONS.includes(
      value as FurnitureItemAdminTransition,
    )
  ) {
    return value as FurnitureItemAdminTransition;
  }
  return null;
}

export function isRecipientRequestQueueStatus(
  value: string,
): value is RecipientRequestAdminTransition | "submitted" | "pending_verification" | "under_review" {
  return (
    RECIPIENT_REQUEST_QUEUE_STATUSES.includes(
      value as (typeof RECIPIENT_REQUEST_QUEUE_STATUSES)[number],
    ) ||
    RECIPIENT_REQUEST_ADMIN_TRANSITIONS.includes(
      value as RecipientRequestAdminTransition,
    )
  );
}

export function parseRecipientRequestStatus(
  value: string,
): RecipientRequestAdminTransition | null {
  if (
    RECIPIENT_REQUEST_ADMIN_TRANSITIONS.includes(
      value as RecipientRequestAdminTransition,
    )
  ) {
    return value as RecipientRequestAdminTransition;
  }
  return null;
}

export const FURNITURE_ITEM_STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  available: "Available",
  rejected: "Rejected",
  expired: "Expired",
};

export const RECIPIENT_REQUEST_STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  pending_verification: "Pending verification",
  under_review: "Under review",
  approved: "Approved",
  queued: "Waiting (in queue)",
  denied: "Denied",
  closed: "Closed",
};

export function buildStatusSelectOptions(
  currentStatus: string,
  transitions: readonly string[],
  labels: Record<string, string>,
): { value: string; label: string }[] {
  const values = new Set<string>([currentStatus, ...transitions]);
  return [...values].map((value) => ({
    value,
    label: labels[value] ?? value,
  }));
}
