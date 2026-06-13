import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { roles } from "@/db/schema/roles";
import { userRoles } from "@/db/schema/user-roles";

import type { RoleCode } from "@/types/statuses";

import { ADMIN_ROLE_CODE, ADMIN_ROLE_ID } from "./constants";

export async function getActiveRoleCodesForUser(userId: string): Promise<RoleCode[]> {
  const db = getDb();

  const rows = await db
    .select({ code: roles.code })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(and(eq(userRoles.userId, userId), isNull(userRoles.revokedAt)));

  return rows.map((row) => row.code as RoleCode);
}

export async function userHasAdminRole(userId: string): Promise<boolean> {
  const db = getDb();

  const [row] = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, ADMIN_ROLE_ID),
        isNull(userRoles.revokedAt),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export function isAdminRoleCode(code: string): boolean {
  return code === ADMIN_ROLE_CODE;
}
