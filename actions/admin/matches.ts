"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/session";
import {
  CreateMatchError,
  createManualMatch,
} from "@/services/matches/create-manual-match";

const ERROR_MESSAGES: Record<string, string> = {
  NOT_FOUND: "Item or need line not found.",
  PAIR_MISMATCH: "Could not pair this item with the selected need.",
  ITEM_NOT_AVAILABLE: "Item is not available for matching.",
  NEED_LINE_NOT_OPEN: "This need line is no longer open.",
  REQUEST_NOT_MATCHABLE: "Recipient request is not approved or queued.",
  CATEGORY_MISMATCH: "Item category does not match the need.",
  NEED_ALREADY_FULFILLED: "This need line is already fulfilled.",
  INSUFFICIENT_QUANTITY: "Item quantity is less than the remaining need.",
  DUPLICATE_ITEM_MATCH: "This item already has an active match.",
  DUPLICATE_NEED_MATCH: "This need line already has an active match.",
  CREATE_FAILED: "Failed to create match. Try again.",
};

export async function createMatchFromConnection(formData: FormData) {
  const session = await requireAdmin();

  const itemId = String(formData.get("itemId") ?? "").trim();
  const needLineId = String(formData.get("needLineId") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "/admin/connections").trim();

  if (!itemId || !needLineId) {
    redirect(`${returnTo}?error=missing_pair`);
  }

  try {
    const result = await createManualMatch({
      itemId,
      needLineId,
      actorUserId: session.userId,
    });

    revalidatePath("/admin/connections");
    revalidatePath("/admin/items");
    revalidatePath("/admin/requests");
    revalidatePath("/admin/communications");
    revalidatePath(`/admin/matches/${result.matchId}`);

    redirect(
      `${returnTo}?success=match_created&matchId=${encodeURIComponent(result.matchId)}`,
    );
  } catch (error) {
    if (error instanceof CreateMatchError) {
      const message =
        ERROR_MESSAGES[error.code] ?? error.message ?? "Match creation failed.";
      redirect(
        `${returnTo}?error=${encodeURIComponent(message)}`,
      );
    }

    redirect(`${returnTo}?error=match_create_failed`);
  }
}
