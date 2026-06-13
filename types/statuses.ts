/**
 * Status enums aligned with docs/workflows.md and docs/database-design.md.
 * Expand as tables are added in Step 2.
 */

export const USER_STATUSES = ["active", "inactive", "suspended"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const ROLE_CODES = [
  "donor",
  "recipient",
  "volunteer",
  "partner_user",
  "admin",
] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

/** Default admin item review queue */
export const FURNITURE_ITEM_QUEUE_STATUSES = [
  "submitted",
  "under_review",
] as const;
export type FurnitureItemQueueStatus =
  (typeof FURNITURE_ITEM_QUEUE_STATUSES)[number];

/** Statuses an admin can set from the review queue */
export const FURNITURE_ITEM_ADMIN_TRANSITIONS = [
  "under_review",
  "approved",
  "available",
  "rejected",
  "expired",
] as const;
export type FurnitureItemAdminTransition =
  (typeof FURNITURE_ITEM_ADMIN_TRANSITIONS)[number];

/** Default admin request review queue */
export const RECIPIENT_REQUEST_QUEUE_STATUSES = [
  "submitted",
  "pending_verification",
  "under_review",
] as const;
export type RecipientRequestQueueStatus =
  (typeof RECIPIENT_REQUEST_QUEUE_STATUSES)[number];

/** Statuses an admin can set from the review queue */
export const RECIPIENT_REQUEST_ADMIN_TRANSITIONS = [
  "under_review",
  "approved",
  "queued",
  "denied",
  "closed",
] as const;
export type RecipientRequestAdminTransition =
  (typeof RECIPIENT_REQUEST_ADMIN_TRANSITIONS)[number];
