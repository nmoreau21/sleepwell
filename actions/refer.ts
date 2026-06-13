"use server";

import { redirect } from "next/navigation";

import { parseReferralFormData } from "@/lib/validation/referral";
import { createReferralFromPublicForm } from "@/services/referrals/create-from-public-form";

export async function submitReferral(formData: FormData) {
  const parsed = parseReferralFormData(formData);

  if (!parsed.ok) {
    redirect(`/refer?error=${encodeURIComponent(parsed.error)}`);
  }

  try {
    await createReferralFromPublicForm(parsed.data);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_PARTNER_CODE") {
      redirect(
        "/refer?error=Invalid%20partner%20referral%20code.%20Contact%20Sleepwell%20if%20you%20need%20help.",
      );
    }

    redirect("/refer?error=submission_failed");
  }

  redirect("/refer/success");
}
