export type EmailConfig = {
  apiKey: string;
  from: string;
  replyTo?: string;
};

export type EmailConfigResult =
  | { ok: true; config: EmailConfig }
  | { ok: false; error: string };

export function getEmailConfig(): EmailConfigResult {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const replyTo = process.env.EMAIL_REPLY_TO?.trim();

  if (!apiKey) {
    return {
      ok: false,
      error:
        "Email is not configured. Set RESEND_API_KEY in your environment.",
    };
  }

  if (!from) {
    return {
      ok: false,
      error: "Email is not configured. Set EMAIL_FROM in your environment.",
    };
  }

  return {
    ok: true,
    config: {
      apiKey,
      from,
      replyTo: replyTo || undefined,
    },
  };
}
