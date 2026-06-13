import { ItemsQueue } from "@/components/admin/items-queue";
import { StatusFilter } from "@/components/admin/status-filter";
import { FURNITURE_ITEM_STATUS_LABELS } from "@/lib/validation/admin-status";
import { FURNITURE_ITEM_QUEUE_STATUSES } from "@/types/statuses";
import { listFurnitureSubmissionGroupsForAdmin } from "@/services/admin/list-furniture-items";

const FILTER_OPTIONS = [
  { value: "queue", label: "Review queue" },
  ...FURNITURE_ITEM_QUEUE_STATUSES.map((status) => ({
    value: status,
    label: FURNITURE_ITEM_STATUS_LABELS[status] ?? status,
  })),
  { value: "all", label: "All statuses" },
];

const ERROR_MESSAGES: Record<string, string> = {
  missing_item: "No item selected.",
  invalid_status: "That status change is not allowed.",
  not_found: "Item not found.",
  update_failed: "Could not update item status. Try again.",
};

export default async function AdminItemsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ status?: string; error?: string }>;
}>) {
  const params = await searchParams;
  const statusFilter = params.status ?? "queue";
  const groups = await listFurnitureSubmissionGroupsForAdmin(statusFilter);
  const errorMessage = params.error
    ? (ERROR_MESSAGES[params.error] ?? decodeURIComponent(params.error))
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Donor items</h1>
        <p className="mt-2 text-muted-foreground">
          Review submitted furniture before matching. Donor inventory is never
          shown publicly.
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
        basePath="/admin/items"
        current={statusFilter}
        options={FILTER_OPTIONS}
      />

      <ItemsQueue groups={groups} statusFilter={statusFilter} />
    </div>
  );
}
