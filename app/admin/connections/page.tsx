import Link from "next/link";

import {
  MatchCreatedBanner,
  PotentialConnectionsList,
} from "@/components/admin/potential-connections-list";
import {
  CountTable,
  LocationTable,
  StatCards,
} from "@/components/admin/metrics-panel";
import { FURNITURE_CATEGORIES } from "@/lib/validation/categories";
import { getConnectionDashboardMetrics } from "@/services/connections/get-dashboard-metrics";
import { getPotentialConnections } from "@/services/connections/get-potential-connections";

function categoryLabel(value: string): string {
  return FURNITURE_CATEGORIES.find((entry) => entry.value === value)?.label ?? value;
}

function urgencyLabel(value: string): string {
  if (value === "emergency") return "Emergency";
  if (value === "urgent") return "Urgent";
  if (value === "standard") return "Standard";
  return value;
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_pair: "Select a valid item and need line to create a match.",
  match_create_failed: "Could not create match. Try again.",
};

export default async function AdminConnectionsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{
    success?: string;
    matchId?: string;
    error?: string;
  }>;
}>) {
  const params = await searchParams;
  const [metrics, connections] = await Promise.all([
    getConnectionDashboardMetrics(),
    getPotentialConnections(),
  ]);

  const errorMessage = params.error
    ? (ERROR_MESSAGES[params.error] ?? decodeURIComponent(params.error))
    : null;

  return (
    <div className="space-y-10">
      <div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/admin/items"
            className="text-muted-foreground hover:text-foreground"
          >
            ← Donor items
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link
            href="/admin/requests"
            className="text-muted-foreground hover:text-foreground"
          >
            Recipient requests
          </Link>
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Connection dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Supply and demand overview with manual match creation. Donor inventory
          is never shown publicly.
        </p>
      </div>

      {params.success === "match_created" && params.matchId && (
        <MatchCreatedBanner matchId={params.matchId} />
      )}

      {errorMessage && (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Supply summary</h2>
        <StatCards
          items={[
            { label: "Submitted items", value: metrics.supply.submitted },
            { label: "Approved items", value: metrics.supply.approved },
            { label: "Available items", value: metrics.supply.available },
          ]}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <CountTable
            title="Items by category"
            rows={metrics.supply.byCategory}
            emptyLabel="No items in the supply pipeline yet."
            formatKey={categoryLabel}
          />
          <LocationTable
            title="Items by city / ZIP"
            rows={metrics.supply.byLocation}
            emptyLabel="No location data for supply pipeline items."
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Demand summary</h2>
        <StatCards
          items={[
            { label: "Pending requests", value: metrics.demand.pending },
            { label: "Approved requests", value: metrics.demand.approved },
            { label: "Queued requests", value: metrics.demand.queued },
          ]}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <CountTable
            title="Open need lines by category"
            rows={metrics.demand.needLinesByCategory}
            emptyLabel="No open need lines on active requests."
            formatKey={categoryLabel}
          />
          <CountTable
            title="Requests by urgency"
            rows={metrics.demand.byUrgency}
            emptyLabel="No active demand requests."
            keyLabel="Urgency"
            formatKey={urgencyLabel}
          />
        </div>
        <LocationTable
          title="Requests by city / ZIP"
          rows={metrics.demand.byLocation}
          emptyLabel="No location data for active demand."
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Potential connections</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Category-matched pairings where items are available and requests are
            approved or queued. Sorted by simple geography and urgency score.
          </p>
        </div>
        <PotentialConnectionsList connections={connections} />
      </section>
    </div>
  );
}
