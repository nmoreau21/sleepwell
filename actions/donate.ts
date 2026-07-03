"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  donationPayloadShape,
  logDonationError,
} from "@/lib/logging/donation-submission";
import {
  parseDonationFormData,
  parseDonationSubmissionJson,
} from "@/lib/validation/donation";
import { createDonationFromPublicForm } from "@/services/donations/create-from-public-form";

const DONATION_SUMMARY_COOKIE = "donation_summary";

export async function submitDonation(formData: FormData) {
  const payloadJson = formData.get("payload");
  const usedJsonPayload =
    typeof payloadJson === "string" && payloadJson.trim().length > 0;

  console.error("[donate] submitDonation started", {
    usedJsonPayload,
    payloadBytes: usedJsonPayload ? payloadJson.length : 0,
  });

  const parsed = usedJsonPayload
    ? parseDonationSubmissionJson(payloadJson)
    : parseDonationFormData(formData);

  if (!parsed.ok) {
    console.error("[donate] validation failed", {
      error: parsed.error,
      usedJsonPayload,
    });
    redirect(`/donate?error=${encodeURIComponent(parsed.error)}`);
  }

  console.error("[donate] validation succeeded", donationPayloadShape(parsed.data));

  try {
    const result = await createDonationFromPublicForm(parsed.data);

    console.error("[donate] submission persisted", {
      userId: result.userId,
      itemIds: result.itemIds,
      itemCount: result.summaryItems.length,
    });

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
  } catch (error) {
    logDonationError("submitDonation failed", error, {
      stage: "createDonationFromPublicForm",
      payload: donationPayloadShape(parsed.data),
    });
    redirect("/donate?error=submission_failed");
  }

  redirect("/donate/success");
}
