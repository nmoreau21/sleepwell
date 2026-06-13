import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { communications } from "@/db/schema/communications";
import { users } from "@/db/schema/users";

export type AdminCommunicationRow = {
  id: string;
  status: string;
  channel: string;
  templateCode: string | null;
  subject: string | null;
  bodyPreview: string | null;
  recipientEmail: string | null;
  recipientName: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  providerMessageId: string | null;
  errorMessage: string | null;
  sentAt: Date | null;
  createdAt: Date;
};

export async function listCommunicationsForAdmin(
  statusFilter: "queued" | "sent" | "failed" | "all" = "all",
): Promise<AdminCommunicationRow[]> {
  const db = getDb();

  const rows = await db
    .select({
      id: communications.id,
      status: communications.status,
      channel: communications.channel,
      templateCode: communications.templateCode,
      subject: communications.subject,
      bodyPreview: communications.bodyPreview,
      relatedEntityType: communications.relatedEntityType,
      relatedEntityId: communications.relatedEntityId,
      providerMessageId: communications.providerMessageId,
      errorMessage: communications.errorMessage,
      sentAt: communications.sentAt,
      createdAt: communications.createdAt,
      recipientEmail: users.email,
      recipientFirstName: users.firstName,
      recipientLastName: users.lastName,
    })
    .from(communications)
    .leftJoin(users, eq(communications.userId, users.id))
    .where(
      statusFilter === "all"
        ? undefined
        : eq(communications.status, statusFilter),
    )
    .orderBy(desc(communications.createdAt))
    .limit(200);

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    channel: row.channel,
    templateCode: row.templateCode,
    subject: row.subject,
    bodyPreview: row.bodyPreview,
    recipientEmail: row.recipientEmail,
    recipientName:
      row.recipientFirstName && row.recipientLastName
        ? `${row.recipientFirstName} ${row.recipientLastName}`
        : null,
    relatedEntityType: row.relatedEntityType,
    relatedEntityId: row.relatedEntityId,
    providerMessageId: row.providerMessageId,
    errorMessage: row.errorMessage,
    sentAt: row.sentAt,
    createdAt: row.createdAt,
  }));
}
