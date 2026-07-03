import { getDonationNotificationRecipients } from "@/lib/email/donation-notification-recipients";
import {
  buildDonationNotificationEmail,
  type DonationNotificationContentInput,
} from "@/lib/email/donation-notification-content";
import { getEmailConfig } from "@/lib/email/config";
import { createResendProvider } from "@/lib/email/resend-provider";
import { logDonationError } from "@/lib/logging/donation-submission";

export async function sendDonationNotificationEmail(
  input: DonationNotificationContentInput,
): Promise<void> {
  const recipients = getDonationNotificationRecipients();

  if (recipients.length === 0) {
    console.error("[donate] donation notification skipped: no recipients configured");
    return;
  }

  const configResult = getEmailConfig();
  if (!configResult.ok) {
    console.error("[donate] donation notification skipped:", configResult.error);
    return;
  }

  const { subject, text, html } = buildDonationNotificationEmail(input);
  const provider = createResendProvider(configResult.config);

  try {
    const result = await provider.send({
      to: recipients,
      subject,
      text,
      html,
      replyTo: input.donor.email,
    });

    console.error("[donate] donation notification sent", {
      recipientCount: recipients.length,
      providerMessageId: result.providerMessageId,
      itemCount: input.items.length,
    });
  } catch (error) {
    logDonationError("donation notification email failed", error, {
      recipientCount: recipients.length,
      itemCount: input.items.length,
    });
  }
}
