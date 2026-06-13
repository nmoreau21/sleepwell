/** Templates allowed for automated email sending in Step 11 MVP. */
export const SENDABLE_EMAIL_TEMPLATES = [
  "transfer_scheduled_donor",
  "transfer_scheduled_recipient",
  "transfer_completed_donor",
  "transfer_completed_recipient",
] as const;

export type SendableEmailTemplate =
  (typeof SENDABLE_EMAIL_TEMPLATES)[number];

export const SENDABLE_EMAIL_TEMPLATE_LABELS: Record<
  SendableEmailTemplate,
  string
> = {
  transfer_scheduled_donor: "Transfer scheduled (donor)",
  transfer_scheduled_recipient: "Transfer scheduled (recipient)",
  transfer_completed_donor: "Transfer completed (donor)",
  transfer_completed_recipient: "Transfer completed (recipient)",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmailAddress(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function isSendableEmailTemplate(
  templateCode: string | null | undefined,
): templateCode is SendableEmailTemplate {
  if (!templateCode) {
    return false;
  }
  return SENDABLE_EMAIL_TEMPLATES.includes(templateCode as SendableEmailTemplate);
}

export function buildEmailContent(input: {
  templateCode: SendableEmailTemplate;
  subject?: string | null;
  bodyPreview?: string | null;
}): { subject: string; html: string; text: string } {
  const subject =
    input.subject?.trim() ||
    SENDABLE_EMAIL_TEMPLATE_LABELS[input.templateCode];

  const body =
    input.bodyPreview?.trim() ||
    "Sleepwell has an update about your furniture coordination request.";

  const html = `
    <div style="font-family: sans-serif; line-height: 1.5; color: #111;">
      <p>${escapeHtml(body)}</p>
      <p style="color: #666; font-size: 14px;">
        — Sleepwell coordination team
      </p>
    </div>
  `.trim();

  return {
    subject,
    html,
    text: `${body}\n\n— Sleepwell coordination team`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
