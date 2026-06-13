import { ADMIN_ROLE_CODE } from "./constants";
import type { RoleCode } from "@/types/statuses";

export type PermissionAction =
  | "approve_donor_item"
  | "approve_recipient_request"
  | "create_match"
  | "approve_match"
  | "schedule_transfer"
  | "view_exact_address"
  | "manage_users"
  | "view_audit_log";

const ADMIN_PERMISSIONS: PermissionAction[] = [
  "approve_donor_item",
  "approve_recipient_request",
  "create_match",
  "approve_match",
  "schedule_transfer",
  "view_exact_address",
  "manage_users",
  "view_audit_log",
];

export function isAdmin(roles: RoleCode[]): boolean {
  return roles.includes(ADMIN_ROLE_CODE);
}

export function can(roles: RoleCode[], action: PermissionAction): boolean {
  if (isAdmin(roles)) {
    return ADMIN_PERMISSIONS.includes(action);
  }
  return false;
}
