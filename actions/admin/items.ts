"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/session";
import { updateFurnitureItemStatus } from "@/services/admin/update-furniture-item-status";

export async function updateItemStatus(formData: FormData) {
  const session = await requireAdmin();

  const itemId = String(formData.get("itemId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const rejectionReason = String(formData.get("rejectionReason") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "/admin/items").trim();

  if (!itemId) {
    redirect(`${returnTo}?error=missing_item`);
  }

  try {
    await updateFurnitureItemStatus({
      itemId,
      status,
      actorUserId: session.userId,
      rejectionReason: rejectionReason || undefined,
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

  revalidatePath("/admin/items");
  redirect(returnTo);
}
