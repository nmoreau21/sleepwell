import { RequestsQueue } from "@/components/admin/requests-queue";
import { StatusFilter } from "@/components/admin/status-filter";
import { RECIPIENT_REQUEST_STATUS_LABELS } from "@/lib/validation/admin-status";
import { RECIPIENT_REQUEST_QUEUE_STATUSES } from "@/types/statuses";
import { listRecipientRequestsForAdmin } from "@/services/admin/list-recipient-requests";

const FILTER_OPTIONS = [
  { value: "queue", label: "Review queue" },
  ...RECIPIENT_REQUEST_QUEUE_STATUSES.map((status) => ({
    value: status,
    label: RECIPIENT_REQUEST_STATUS_LABELS[status] ?? status,
  })),
  { value: "all", label: "All statuses" },
];

const ERROR_MESSAGES: Record<string, string> = {
  missing_request: "No request selected.",
  invalid_status: "That status change is not allowed.",
  not_found: "Request not found.",
  update_failed: "Could not update request status. Try again.",
};

export default async function AdminRequestsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ status?: string; error?: string }>;
}>) {
  const params = await searchParams;
  const statusFilter = params.status ?? "queue";
  const requests = await listRecipientRequestsForAdmin(statusFilter);
  const errorMessage = params.error
    ? (ERROR_MESSAGES[params.error] ?? decodeURIComponent(params.error))
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Recipient requests
        </h1>
        <p className="mt-2 text-muted-foreground">
          Verify housing needs and move requests into the matching queue when
          ready.
        </p>
      </div>

      {errorMessage && (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <StatusFilter
        basePath="/admin/requests"
        current={statusFilter}
        options={FILTER_OPTIONS}
      />

      <RequestsQueue requests={requests} statusFilter={statusFilter} />
    </div>
  );
}
