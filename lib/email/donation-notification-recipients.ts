/** Comma-separated coordinator inboxes for new donation alerts. */
export function getDonationNotificationRecipients(): string[] {
  const raw = process.env.DONATION_NOTIFICATION_EMAILS?.trim();
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}
