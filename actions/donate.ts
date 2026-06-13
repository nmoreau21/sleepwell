"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createDonationFromPublicForm } from "@/services/donations/create-from-public-form";
import {
  parseDonationFormData,
  parseDonationSubmissionJson,
} from "@/lib/validation/donation";

const DONATION_SUMMARY_COOKIE = "donation_summary";

export async function submitDonation(formData: FormData) {
  const payloadJson = formData.get("payload");

  const parsed =
    typeof payloadJson === "string" && payloadJson.trim().length > 0
      ? parseDonationSubmissionJson(payloadJson)
      : parseDonationFormData(formData);

  if (!parsed.ok) {
    redirect(`/donate?error=${encodeURIComponent(parsed.error)}`);
  }

  try {
    const result = await createDonationFromPublicForm(parsed.data);

    const cookieStore = await cookies();
    cookieStore.set(
      DONATION_SUMMARY_COOKIE,
      JSON.stringify({
        donorName: result.donorName,
        items: result.summaryItems,
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 120,
        path: "/",
      },
    );
  } catch {
    redirect("/donate?error=submission_failed");
  }

  redirect("/donate/success");
}
