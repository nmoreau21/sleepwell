export type EmailSendInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type EmailSendResult = {
  providerMessageId: string;
};

export type EmailProvider = {
  send(input: EmailSendInput): Promise<EmailSendResult>;
};
