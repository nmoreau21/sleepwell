"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/session";
import { sendQueuedEmails } from "@/services/communications/send-queued-emails";

export async function sendEligibleCommunications(formData: FormData) {
  const session = await requireAdmin();
  const dryRun = formData.get("dryRun") === "true";

  const result = await sendQueuedEmails({
    actorUserId: session.userId,
    dryRun,
  });

  if (result.configError) {
    redirect(
      `/admin/communications?error=${encodeURIComponent(result.configError)}`,
    );
  }

  if (dryRun) {
    const previewPayload = encodeURIComponent(
      JSON.stringify(result.preview ?? []),
    );
    redirect(
      `/admin/communications?preview=1&eligible=${result.preview?.length ?? 0}&preview_data=${previewPayload}`,
    );
  }

  revalidatePath("/admin/communications");
  redirect(
    `/admin/communications?sent=${result.sent}&failed=${result.failed}&skipped=${result.skipped}`,
  );
}
