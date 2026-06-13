import { Resend } from "resend";

import type { EmailConfig } from "@/lib/email/config";
import type { EmailProvider, EmailSendInput, EmailSendResult } from "@/lib/email/provider";

export function createResendProvider(config: EmailConfig): EmailProvider {
  const client = new Resend(config.apiKey);

  return {
    async send(input: EmailSendInput): Promise<EmailSendResult> {
      const result = await client.emails.send({
        from: config.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: input.replyTo ?? config.replyTo,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      const messageId = result.data?.id;
      if (!messageId) {
        throw new Error("Resend did not return a message id.");
      }

      return { providerMessageId: messageId };
    },
  };
}
