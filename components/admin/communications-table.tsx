import type { AdminCommunicationRow } from "@/services/communications/list-for-admin";
import { SENDABLE_EMAIL_TEMPLATE_LABELS } from "@/lib/email/templates";

function templateLabel(code: string | null): string {
  if (!code) {
    return "—";
  }
  return (
    SENDABLE_EMAIL_TEMPLATE_LABELS[
      code as keyof typeof SENDABLE_EMAIL_TEMPLATE_LABELS
    ] ?? code
  );
}

export function CommunicationsTable({
  rows,
  emptyLabel,
}: Readonly<{
  rows: AdminCommunicationRow[];
  emptyLabel: string;
}>) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <th className="px-3 py-2">Created</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Channel</th>
            <th className="px-3 py-2">Template</th>
            <th className="px-3 py-2">Recipient</th>
            <th className="px-3 py-2">Related</th>
            <th className="px-3 py-2">Subject</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-border/60">
              <td className="px-3 py-2 text-muted-foreground">
                {row.createdAt.toLocaleString()}
              </td>
              <td className="px-3 py-2">{row.status}</td>
              <td className="px-3 py-2">{row.channel}</td>
              <td className="px-3 py-2">{templateLabel(row.templateCode)}</td>
              <td className="px-3 py-2">
                {row.recipientName ?? "—"}
                {row.recipientEmail ? (
                  <span className="block text-xs text-muted-foreground">
                    {row.recipientEmail}
                  </span>
                ) : null}
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground">
                {row.relatedEntityType && row.relatedEntityId
                  ? `${row.relatedEntityType}:${row.relatedEntityId.slice(0, 8)}…`
                  : "—"}
              </td>
              <td className="px-3 py-2 max-w-[14rem] truncate">
                {row.subject ?? row.bodyPreview ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
