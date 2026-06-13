import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { resolveAppUserFromAuth } from "./link-user";
import { getActiveRoleCodesForUser, userHasAdminRole } from "./roles";
import type { RoleCode } from "@/types/statuses";

export type AppSession = {
  authId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: RoleCode[];
  isAdmin: boolean;
};

/**
 * Returns the current application session, or null if unauthenticated
 * or not linked to an application user record.
 */
export async function getSession(): Promise<AppSession | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const appUser = await resolveAppUserFromAuth(authUser);
  if (!appUser) {
    return null;
  }

  const roles = await getActiveRoleCodesForUser(appUser.id);
  const isAdmin = await userHasAdminRole(appUser.id);

  return {
    authId: authUser.id,
    userId: appUser.id,
    email: appUser.email ?? authUser.email ?? "",
    firstName: appUser.firstName,
    lastName: appUser.lastName,
    roles,
    isAdmin,
  };
}

/**
 * Requires an authenticated user with active admin/coordinator role.
 * Redirects to login when unauthenticated; forbidden when not admin.
 */
export async function requireAdmin(): Promise<AppSession> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const appUser = await resolveAppUserFromAuth(authUser);
  if (!appUser) {
    redirect("/login?error=not_provisioned");
  }

  const isAdmin = await userHasAdminRole(appUser.id);
  if (!isAdmin) {
    redirect("/login?error=forbidden");
  }

  const roles = await getActiveRoleCodesForUser(appUser.id);

  return {
    authId: authUser.id,
    userId: appUser.id,
    email: appUser.email ?? authUser.email ?? "",
    firstName: appUser.firstName,
    lastName: appUser.lastName,
    roles,
    isAdmin,
  };
}

/** Alias for coordinator access — MVP combines coordinator and administrator. */
export async function requireCoordinator(): Promise<AppSession> {
  return requireAdmin();
}
