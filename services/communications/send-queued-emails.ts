import { and, asc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { communications } from "@/db/schema/communications";
import { users } from "@/db/schema/users";
import { getEmailConfig } from "@/lib/email/config";
import { createResendProvider } from "@/lib/email/resend-provider";
import {
  buildEmailContent,
  isSendableEmailTemplate,
  isValidEmailAddress,
  type SendableEmailTemplate,
} from "@/lib/email/templates";
import { logAuditEvent } from "@/services/audit/log-event";

type DbClient = ReturnType<typeof getDb>;

export type SendQueuedEmailsPreviewItem = {
  communicationId: string;
  templateCode: string;
  recipientEmail: string;
  subject: string;
};

export type SendQueuedEmailsResult = {
  sent: number;
  failed: number;
  skipped: number;
  configError?: string;
  preview?: SendQueuedEmailsPreviewItem[];
};

type QueuedRow = {
  id: string;
  userId: string | null;
  templateCode: SendableEmailTemplate;
  subject: string | null;
  bodyPreview: string | null;
  recipientEmail: string;
};

async function loadEligibleQueuedEmails(): Promise<QueuedRow[]> {
  const db = getDb();

  const rows = await db
    .select({
      id: communications.id,
      userId: communications.userId,
      templateCode: communications.templateCode,
      subject: communications.subject,
      bodyPreview: communications.bodyPreview,
      recipientEmail: users.email,
    })
    .from(communications)
    .leftJoin(users, eq(communications.userId, users.id))
    .where(
      and(eq(communications.status, "queued"), eq(communications.channel, "email")),
    )
    .orderBy(asc(communications.createdAt));

  const eligible: QueuedRow[] = [];

  for (const row of rows) {
    if (!isSendableEmailTemplate(row.templateCode)) {
      continue;
    }
    if (!row.recipientEmail || !isValidEmailAddress(row.recipientEmail)) {
      continue;
    }
    eligible.push({
      id: row.id,
      userId: row.userId,
      templateCode: row.templateCode,
      subject: row.subject,
      bodyPreview: row.bodyPreview,
      recipientEmail: row.recipientEmail.trim().toLowerCase(),
    });
  }

  return eligible;
}

export async function sendQueuedEmails(input: {
  actorUserId: string;
  dryRun?: boolean;
}): Promise<SendQueuedEmailsResult> {
  const configResult = getEmailConfig();
  if (!configResult.ok) {
    return {
      sent: 0,
      failed: 0,
      skipped: 0,
      configError: configResult.error,
    };
  }

  const eligible = await loadEligibleQueuedEmails();

  if (input.dryRun) {
    const preview: SendQueuedEmailsPreviewItem[] = eligible
      .slice(0, 25)
      .map((row) => {
        const content = buildEmailContent({
          templateCode: row.templateCode,
          subject: row.subject,
          bodyPreview: row.bodyPreview,
        });
        return {
          communicationId: row.id,
          templateCode: row.templateCode,
          recipientEmail: row.recipientEmail,
          subject: content.subject,
        };
      });

    return {
      sent: 0,
      failed: 0,
      skipped: 0,
      preview,
    };
  }

  const provider = createResendProvider(configResult.config);
  const db = getDb();

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of eligible) {
    const templateCode = row.templateCode;
    const recipientEmail = row.recipientEmail;
    const content = buildEmailContent({
      templateCode,
      subject: row.subject,
      bodyPreview: row.bodyPreview,
    });

    try {
      const sendResult = await provider.send({
        to: recipientEmail,
        subject: content.subject,
        html: content.html,
        text: content.text,
        replyTo: configResult.config.replyTo,
      });

      const now = new Date();

      await db.transaction(async (tx) => {
        const txClient = tx as unknown as DbClient;

        const updated = await tx
          .update(communications)
          .set({
            status: "sent",
            providerMessageId: sendResult.providerMessageId,
            sentAt: now,
            errorMessage: null,
          })
          .where(
            and(
              eq(communications.id, row.id),
              eq(communications.status, "queued"),
            ),
          )
          .returning({ id: communications.id });

        if (updated.length === 0) {
          throw new Error("Communication already processed.");
        }

        await logAuditEvent(txClient, {
          action: "communication.sent",
          entityType: "communication",
          entityId: row.id,
          actorUserId: input.actorUserId,
          newValues: {
            status: "sent",
            templateCode,
            recipientEmail,
            providerMessageId: sendResult.providerMessageId,
          },
          metadata: { source: "admin_communications" },
        });
      });

      sent += 1;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown email send error.";
      const now = new Date();

      await db.transaction(async (tx) => {
        const txClient = tx as unknown as DbClient;

        await tx
          .update(communications)
          .set({
            status: "failed",
            errorMessage: message,
          })
          .where(
            and(
              eq(communications.id, row.id),
              eq(communications.status, "queued"),
            ),
          );

        await logAuditEvent(txClient, {
          action: "communication.failed",
          entityType: "communication",
          entityId: row.id,
          actorUserId: input.actorUserId,
          newValues: {
            status: "failed",
            templateCode,
            recipientEmail,
            errorMessage: message,
          },
          metadata: { source: "admin_communications" },
        });
      });

      failed += 1;
    }
  }

  return { sent, failed, skipped };
}

export async function countEligibleQueuedEmails(): Promise<number> {
  const eligible = await loadEligibleQueuedEmails();
  return eligible.length;
}
