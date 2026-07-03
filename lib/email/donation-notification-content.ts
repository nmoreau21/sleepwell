import type { DonorPickupInput, DonationItemInput } from "@/lib/validation/donation";
import { ITEM_CONDITIONS } from "@/lib/validation/donation";
import { formatDonationItemLabel } from "@/lib/validation/donation-item-display";

export type DonationNotificationContentInput = {
  donorName: string;
  donor: DonorPickupInput;
  items: DonationItemInput[];
  itemIds: string[];
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function conditionLabel(condition: string): string {
  return ITEM_CONDITIONS.find((entry) => entry.value === condition)?.label ?? condition;
}

export function formatDonorLocation(donor: DonorPickupInput): string {
  const cityStateZip = `${donor.city}, ${donor.state} ${donor.zipCode}`;

  if (donor.locationPrivacyLevel === "exact" && donor.addressLine1?.trim()) {
    return `${donor.addressLine1.trim()}, ${cityStateZip}`;
  }

  if (donor.locationPrivacyLevel === "cross_street" && donor.crossStreet?.trim()) {
    return `${cityStateZip} (near ${donor.crossStreet.trim()})`;
  }

  return cityStateZip;
}

function formatItemText(item: DonationItemInput, index: number): string {
  const label = formatDonationItemLabel(item);
  const condition = conditionLabel(item.condition);
  const photosPending = item.photosPending ? "Yes" : "No";

  return `${index + 1}. ${label} — Qty ${item.quantity}, ${condition}, Photos pending: ${photosPending}`;
}

export function buildDonationNotificationEmail(
  input: DonationNotificationContentInput,
): { subject: string; text: string; html: string } {
  const location = formatDonorLocation(input.donor);
  const itemLines = input.items.map((item, index) => formatItemText(item, index));
  const subject = `New Sleepwell donation from ${input.donorName}`;

  const text = [
    "A new donation was submitted on the public donate form.",
    "",
    `Donor: ${input.donorName}`,
    `Email: ${input.donor.email}`,
    `Location: ${location}`,
    "",
    "Items:",
    ...itemLines,
    "",
    `Item IDs: ${input.itemIds.join(", ")}`,
  ].join("\n");

  const htmlItems = itemLines
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");

  const html = `
    <p>A new donation was submitted on the public donate form.</p>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Donor</td><td>${escapeHtml(input.donorName)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Email</td><td><a href="mailto:${escapeHtml(input.donor.email)}">${escapeHtml(input.donor.email)}</a></td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Location</td><td>${escapeHtml(location)}</td></tr>
    </table>
    <p style="font-weight:600;margin-bottom:8px;">Items</p>
    <ul>${htmlItems}</ul>
    <p style="color:#666;font-size:12px;">Item IDs: ${escapeHtml(input.itemIds.join(", "))}</p>
  `.trim();

  return { subject, text, html };
}
