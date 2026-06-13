"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/session";
import { updateRecipientRequestStatus } from "@/services/admin/update-recipient-request-status";

export async function updateRequestStatus(formData: FormData) {
  const session = await requireAdmin();

  const requestId = String(formData.get("requestId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const closedReason = String(formData.get("closedReason") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "/admin/requests").trim();

  if (!requestId) {
    redirect(`${returnTo}?error=missing_request`);
  }

  try {
    await updateRecipientRequestStatus({
      requestId,
      status,
      actorUserId: session.userId,
      closedReason: closedReason || undefined,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_STATUS") {
      redirect(`${returnTo}?error=invalid_status`);
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      redirect(`${returnTo}?error=not_found`);
    }
    redirect(`${returnTo}?error=update_failed`);
  }

  revalidatePath("/admin/requests");
  redirect(returnTo);
}
