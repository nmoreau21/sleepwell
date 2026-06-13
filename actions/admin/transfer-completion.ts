"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/session";
import {
  parseReopenChoice,
  parseReopenRequestStatus,
  parseTransferCompletionOutcome,
  type CompleteTransferInput,
} from "@/lib/validation/transfer-completion";
import { getMatchDetailForAdmin } from "@/services/matches/get-match-detail";
import {
  CompleteTransferError,
  completeTransfer,
} from "@/services/transfers/complete-transfer";

function parseDateTime(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export async function completeTransferForMatch(formData: FormData) {
  const session = await requireAdmin();

  const matchId = String(formData.get("matchId") ?? "").trim();
  const transferId = String(formData.get("transferId") ?? "").trim();
  const returnTo =
    String(formData.get("returnTo") ?? `/admin/matches/${matchId}`).trim();

  if (!matchId || !transferId) {
    redirect(`${returnTo}?error=not_found`);
  }

  const outcome = parseTransferCompletionOutcome(
    String(formData.get("outcome") ?? "").trim(),
  );

  if (!outcome) {
    redirect(`${returnTo}?error=invalid_outcome`);
  }

  const completedAtRaw = String(formData.get("completedAt") ?? "").trim();
  const completedAt = completedAtRaw
    ? parseDateTime(completedAtRaw)
    : new Date();

  if (!completedAt) {
    redirect(`${returnTo}?error=invalid_datetime`);
  }

  const completionNotes = String(formData.get("completionNotes") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const reopenChoiceRaw = String(formData.get("reopenChoice") ?? "keep_reserved").trim();
  const reopenRequestStatusRaw = String(
    formData.get("reopenRequestStatus") ?? "queued",
  ).trim();

  const reopenChoice = parseReopenChoice(reopenChoiceRaw);
  const reopenRequestStatus = parseReopenRequestStatus(reopenRequestStatusRaw);

  const detail = await getMatchDetailForAdmin(matchId);
  if (!detail) {
    redirect(`${returnTo}?error=not_found`);
  }

  const input: CompleteTransferInput = {
    matchId,
    transferId,
    outcome,
    completedAt,
    completionNotes: completionNotes || undefined,
    reason: reason || undefined,
    reopenChoice: reopenChoice ?? undefined,
    reopenRequestStatus: reopenRequestStatus ?? undefined,
  };

  try {
    const result = await completeTransfer(input, {
      actorUserId: session.userId,
      donorUserId: detail.donorUserId,
      recipientUserId: detail.recipientUserId,
    });

    revalidatePath(returnTo);
    revalidatePath("/admin/connections");
    revalidatePath("/admin/items");
    revalidatePath("/admin/requests");
    revalidatePath("/admin/impact");
    revalidatePath("/admin/communications");

    redirect(`${returnTo}?success=transfer_${result.outcome}`);
  } catch (error) {
    if (error instanceof CompleteTransferError) {
      redirect(`${returnTo}?error=${encodeURIComponent(error.code.toLowerCase())}`);
    }
    redirect(`${returnTo}?error=complete_failed`);
  }
}
