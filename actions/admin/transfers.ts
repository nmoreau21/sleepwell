"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/session";
import {
  parseTransferMethod,
  type ScheduleTransferInput,
} from "@/lib/validation/transfer";
import { getMatchDetailForAdmin } from "@/services/matches/get-match-detail";
import {
  ScheduleTransferError,
  scheduleTransfer,
} from "@/services/transfers/schedule-transfer";

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

export async function scheduleTransferForMatch(formData: FormData) {
  const session = await requireAdmin();

  const matchId = String(formData.get("matchId") ?? "").trim();
  const returnTo =
    String(formData.get("returnTo") ?? `/admin/matches/${matchId}`).trim();

  if (!matchId) {
    redirect("/admin/connections?error=missing_match");
  }

  const transferMethod = parseTransferMethod(
    String(formData.get("transferMethod") ?? "").trim(),
  );
  const scheduledStart = parseDateTime(
    String(formData.get("scheduledStart") ?? ""),
  );
  const scheduledEnd = parseDateTime(String(formData.get("scheduledEnd") ?? ""));

  if (!transferMethod || !scheduledStart || !scheduledEnd) {
    redirect(`${returnTo}?error=invalid_datetime`);
  }

  const pickupInstructions = String(
    formData.get("pickupInstructions") ?? "",
  ).trim();
  const deliveryInstructions = String(
    formData.get("deliveryInstructions") ?? "",
  ).trim();
  const coordinatorNotes = String(formData.get("coordinatorNotes") ?? "").trim();
  const donorContactConfirmed = formData.get("donorContactConfirmed") === "on";
  const recipientContactConfirmed =
    formData.get("recipientContactConfirmed") === "on";

  const detail = await getMatchDetailForAdmin(matchId);
  if (!detail) {
    redirect(`${returnTo}?error=not_found`);
  }

  const input: ScheduleTransferInput = {
    matchId,
    transferMethod,
    scheduledStart,
    scheduledEnd,
    pickupInstructions: pickupInstructions || undefined,
    deliveryInstructions: deliveryInstructions || undefined,
    coordinatorNotes: coordinatorNotes || undefined,
    donorContactConfirmed,
    recipientContactConfirmed,
  };

  try {
    await scheduleTransfer(input, {
      actorUserId: session.userId,
      donorUserId: detail.donorUserId,
      recipientUserId: detail.recipientUserId,
    });
  } catch (error) {
    if (error instanceof ScheduleTransferError) {
      const code = error.code.toLowerCase();
      redirect(`${returnTo}?error=${encodeURIComponent(code)}`);
    }
    redirect(`${returnTo}?error=schedule_failed`);
  }

  revalidatePath(returnTo);
  revalidatePath("/admin/connections");
  revalidatePath("/admin/items");
  revalidatePath("/admin/requests");
  revalidatePath("/admin/communications");

  redirect(`${returnTo}?success=transfer_scheduled`);
}
