import { getDb } from "@/db";
import { communications } from "@/db/schema/communications";

type DbClient = ReturnType<typeof getDb>;

export async function logCommunicationEvent(
  db: DbClient,
  event: {
    userId?: string | null;
    sentByUserId?: string | null;
    channel: "email" | "sms" | "phone" | "in_app";
    direction: "outbound" | "inbound";
    templateCode?: string;
    subject?: string;
    bodyPreview?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    status?: "queued" | "sent" | "delivered" | "failed";
  },
) {
  await db.insert(communications).values({
    userId: event.userId ?? null,
    sentByUserId: event.sentByUserId ?? null,
    channel: event.channel,
    direction: event.direction,
    templateCode: event.templateCode ?? null,
    subject: event.subject ?? null,
    bodyPreview: event.bodyPreview ?? null,
    relatedEntityType: event.relatedEntityType ?? null,
    relatedEntityId: event.relatedEntityId ?? null,
    status: event.status ?? "queued",
  });
}
