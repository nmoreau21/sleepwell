"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/session";
import { updateImpactStoryApproval } from "@/services/impact/update-story-approval";

export async function toggleImpactStoryApproval(formData: FormData) {
  const session = await requireAdmin();

  const impactRecordId = String(formData.get("impactRecordId") ?? "").trim();
  const approved = formData.get("storyPublicApproved") === "true";
  const returnTo = String(formData.get("returnTo") ?? "/admin/impact").trim();

  if (!impactRecordId) {
    redirect(`${returnTo}?error=missing_record`);
  }

  try {
    await updateImpactStoryApproval({
      impactRecordId,
      storyPublicApproved: approved,
      actorUserId: session.userId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      redirect(`${returnTo}?error=missing_record`);
    }
    redirect(`${returnTo}?error=update_failed`);
  }

  revalidatePath("/admin/impact");
  redirect(returnTo);
}
