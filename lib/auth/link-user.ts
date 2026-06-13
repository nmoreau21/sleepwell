import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { users } from "@/db/schema/users";

export type AppUserRow = typeof users.$inferSelect;

/**
 * Resolve application user from Supabase Auth user.
 * Links by auth_id, or by email on first login (pre-provisioned coordinators only).
 */
export async function resolveAppUserFromAuth(
  authUser: SupabaseAuthUser,
): Promise<AppUserRow | null> {
  if (!authUser.email) {
    return null;
  }

  const db = getDb();

  const [byAuthId] = await db
    .select()
    .from(users)
    .where(and(eq(users.authId, authUser.id), isNull(users.deletedAt)))
    .limit(1);

  if (byAuthId) {
    return byAuthId;
  }

  const [byEmail] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, authUser.email), isNull(users.deletedAt)))
    .limit(1);

  if (!byEmail) {
    return null;
  }

  const [linked] = await db
    .update(users)
    .set({
      authId: authUser.id,
      updatedAt: new Date(),
    })
    .where(eq(users.id, byEmail.id))
    .returning();

  return linked ?? null;
}
