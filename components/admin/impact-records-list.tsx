import Link from "next/link";

import { toggleImpactStoryApproval } from "@/actions/admin/impact";
import { FURNITURE_CATEGORIES } from "@/lib/validation/categories";
import type { ImpactRecordRow } from "@/services/reporting/get-impact-report";

function categoryLabel(value: string): string {
  return FURNITURE_CATEGORIES.find((entry) => entry.value === value)?.label ?? value;
}

export function ImpactRecordsList({
  records,
  returnTo,
}: Readonly<{
  records: ImpactRecordRow[];
  returnTo: string;
}>) {
  if (records.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No impact records yet. Records are created when transfers are marked
        completed.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <article
          key={record.id}
          className="rounded-lg border border-border bg-card p-4 text-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">
                {categoryLabel(record.category)} × {record.quantity}
              </p>
              <p className="mt-1 text-muted-foreground">
                {record.createdAt.toLocaleString()}
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                record.storyPublicApproved
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {record.storyPublicApproved
                ? "Story approved for future use"
                : "Story not approved"}
            </span>
          </div>

          <p className="mt-3">{record.impactSummary}</p>

          <p className="mt-2 text-xs text-muted-foreground">
            Donor: {record.donorName} · Recipient: {record.recipientName} ·{" "}
            <Link
              href={`/admin/matches/${record.matchId}`}
              className="text-primary hover:opacity-90"
            >
              View match
            </Link>
          </p>

          <form action={toggleImpactStoryApproval} className="mt-4">
            <input type="hidden" name="impactRecordId" value={record.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <input
              type="hidden"
              name="storyPublicApproved"
              value={record.storyPublicApproved ? "false" : "true"}
            />
            <button
              type="submit"
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              {record.storyPublicApproved
                ? "Revoke story approval"
                : "Approve story for future public use"}
            </button>
          </form>
        </article>
      ))}
    </div>
  );
}
