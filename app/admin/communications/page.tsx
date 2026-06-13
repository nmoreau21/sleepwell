import Link from "next/link";

import { CommunicationsActions } from "@/components/admin/communications-actions";
import { CommunicationsTable } from "@/components/admin/communications-table";
import { StatusFilter } from "@/components/admin/status-filter";
import { getEmailConfig } from "@/lib/email/config";
import { countEligibleQueuedEmails } from "@/services/communications/send-queued-emails";
import { listCommunicationsForAdmin } from "@/services/communications/list-for-admin";

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "queued", label: "Queued" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
];

type PreviewItem = {
  communicationId: string;
  templateCode: string;
  recipientEmail: string;
  subject: string;
};

export default async function AdminCommunicationsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{
    status?: string;
    error?: string;
    sent?: string;
    failed?: string;
    skipped?: string;
    preview?: string;
    eligible?: string;
    preview_data?: string;
  }>;
}>) {
  const params = await searchParams;
  const statusFilter =
    params.status === "queued" ||
    params.status === "sent" ||
    params.status === "failed"
      ? params.status
      : "all";

  const [rows, eligibleCount, emailConfig] = await Promise.all([
    listCommunicationsForAdmin(statusFilter),
    countEligibleQueuedEmails(),
    getEmailConfig(),
  ]);

  let previewItems: PreviewItem[] = [];
  if (params.preview === "1" && params.preview_data) {
    try {
      previewItems = JSON.parse(decodeURIComponent(params.preview_data)) as PreviewItem[];
    } catch {
      previewItems = [];
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Communications
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review queued messages and send eligible transfer notification emails.
        </p>
      </div>

      {!emailConfig.ok && (
        <div
          className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100"
          role="alert"
        >
          {emailConfig.error}
        </div>
      )}

      {params.error && (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {decodeURIComponent(params.error)}
        </div>
      )}

      {params.sent && (
        <div
          className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm"
          role="status"
        >
          Sent {params.sent} email(s)
          {params.failed ? `, ${params.failed} failed` : ""}
          {params.skipped ? `, ${params.skipped} skipped` : ""}.
        </div>
      )}

      {previewItems.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 text-sm">
          <h2 className="font-medium">Dry-run preview</h2>
          <p className="mt-1 text-muted-foreground">
            {params.eligible ?? previewItems.length} eligible email(s). Showing
            preview only — nothing was sent.
          </p>
          <ul className="mt-3 space-y-2">
            {previewItems.map((item) => (
              <li
                key={item.communicationId}
                className="rounded-md bg-muted/40 px-3 py-2"
              >
                <span className="font-medium">{item.templateCode}</span>
                <span className="text-muted-foreground">
                  {" "}
                  → {item.recipientEmail}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {item.subject}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <CommunicationsActions
        eligibleCount={eligibleCount}
        emailConfigured={emailConfig.ok}
      />

      <StatusFilter
        basePath="/admin/communications"
        current={statusFilter}
        options={FILTER_OPTIONS}
      />

      <CommunicationsTable
        rows={rows}
        emptyLabel="No communications match this filter."
      />
    </div>
  );
}
