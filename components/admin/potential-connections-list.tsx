import Link from "next/link";

import { FURNITURE_CATEGORIES } from "@/lib/validation/categories";
import type { PotentialConnection } from "@/services/connections/get-potential-connections";

import { CreateMatchForm } from "./create-match-form";
import { AdminEmptyState } from "./empty-state";

function categoryLabel(value: string): string {
  return FURNITURE_CATEGORIES.find((entry) => entry.value === value)?.label ?? value;
}

export function PotentialConnectionsList({
  connections,
  returnTo = "/admin/connections",
}: Readonly<{
  connections: PotentialConnection[];
  returnTo?: string;
}>) {
  if (connections.length === 0) {
    return (
      <AdminEmptyState
        title="No potential connections yet"
        description="Mark donor items as available, queue recipient requests, and ensure item quantity covers open needs. Matched pairs disappear after you create a match."
      />
    );
  }

  return (
    <div className="space-y-4">
      {connections.map((connection) => (
        <article
          key={`${connection.itemId}-${connection.needLineId}`}
          className="rounded-lg border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Potential connection
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                Score {connection.score}
              </p>
            </div>
          </div>

          <ul className="mt-3 flex flex-wrap gap-2">
            {connection.reasons.map((reason) => (
              <li
                key={reason}
                className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground"
              >
                {reason}
              </li>
            ))}
          </ul>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ConnectionSide
              title="Available item"
              lines={[
                `${categoryLabel(connection.item.category)} · ${connection.item.condition}`,
                `Qty ${connection.item.quantity}`,
                connection.item.locationLabel,
              ]}
            />
            <ConnectionSide
              title="Recipient need"
              lines={[
                `${categoryLabel(connection.need.category)} · ${connection.request.priority} urgency`,
                `Need qty ${connection.need.quantityNeeded} (matched ${connection.need.quantityMatched}, remaining ${connection.need.remainingQuantity})`,
                connection.need.sizePreference
                  ? `Size: ${connection.need.sizePreference}`
                  : null,
                connection.request.locationLabel,
                connection.request.needsDelivery
                  ? "Needs delivery"
                  : "Can pick up",
                connection.request.partnerOrganizationName
                  ? `Partner: ${connection.request.partnerOrganizationName}`
                  : "Direct request",
              ].filter(Boolean) as string[]}
            />
          </div>

          <CreateMatchForm
            itemId={connection.itemId}
            needLineId={connection.needLineId}
            returnTo={returnTo}
          />
        </article>
      ))}
    </div>
  );
}

function ConnectionSide({
  title,
  lines,
}: Readonly<{
  title: string;
  lines: string[];
}>) {
  return (
    <div className="rounded-md bg-muted/40 px-3 py-3 text-sm">
      <p className="font-medium">{title}</p>
      <ul className="mt-2 space-y-1 text-muted-foreground">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

export function MatchCreatedBanner({
  matchId,
}: Readonly<{
  matchId: string;
}>) {
  return (
    <div
      className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm"
      role="status"
    >
      Match created successfully.{" "}
      <Link
        href={`/admin/matches/${matchId}`}
        className="font-medium text-primary hover:opacity-90"
      >
        View match details
      </Link>
    </div>
  );
}
