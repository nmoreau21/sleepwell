import Link from "next/link";

import { ImpactRecordsList } from "@/components/admin/impact-records-list";
import { CountTable, StatCards } from "@/components/admin/metrics-panel";
import { FURNITURE_CATEGORIES } from "@/lib/validation/categories";
import { getImpactReport } from "@/services/reporting/get-impact-report";

function categoryLabel(value: string): string {
  return FURNITURE_CATEGORIES.find((entry) => entry.value === value)?.label ?? value;
}

export default async function AdminImpactPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ error?: string }>;
}>) {
  const params = await searchParams;
  const report = await getImpactReport();
  const returnTo = "/admin/impact";

  const errorMessage =
    params.error === "update_failed"
      ? "Could not update story approval."
      : params.error === "missing_record"
        ? "Impact record not found."
        : null;

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Impact & reporting
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Outcomes from completed transfers and operational pipeline metrics.
          Public story publishing is not enabled yet.
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

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Impact summary</h2>
        <StatCards
          items={[
            {
              label: "Completed transfers",
              value: report.totalCompletedTransfers,
            },
            { label: "Impact records", value: report.totalImpactRecords },
            {
              label: "Recipients supported",
              value: report.recipientsSupported,
            },
            {
              label: "Donors contributing",
              value: report.donorsContributing,
            },
            { label: "Stories approved", value: report.storiesApproved },
            { label: "Stories pending review", value: report.storiesPending },
          ]}
        />
        <CountTable
          title="Items transferred by category"
          rows={report.itemsByCategory.map((row) => ({
            key: row.key,
            count: row.count,
          }))}
          emptyLabel="No impact records yet."
          formatKey={categoryLabel}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Operations dashboard</h2>
        <StatCards
          items={[
            {
              label: "Submitted items",
              value: report.operations.submittedItems,
            },
            {
              label: "Available items",
              value: report.operations.availableItems,
            },
            {
              label: "Queued requests",
              value: report.operations.queuedRequests,
            },
            {
              label: "Matches scheduled",
              value: report.operations.matchesScheduled,
            },
            {
              label: "Transfers completed",
              value: report.operations.transfersCompleted,
            },
            {
              label: "Transfers failed",
              value: report.operations.transfersFailed,
            },
            {
              label: "Transfers cancelled",
              value: report.operations.transfersCancelled,
            },
            {
              label: "Fulfilled requests",
              value: report.operations.fulfilledRequests,
            },
            {
              label: "Avg days submission → completion",
              value:
                report.operations.averageDaysSubmissionToCompletion ?? "—",
            },
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Recent impact records</h2>
        <ImpactRecordsList records={report.recentRecords} returnTo={returnTo} />
      </section>
    </div>
  );
}
