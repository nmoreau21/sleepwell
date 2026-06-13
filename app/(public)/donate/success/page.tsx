import Link from "next/link";
import { cookies } from "next/headers";

import type { DonationSummaryItem } from "@/lib/validation/donation";

type DonationSummaryCookie = {
  donorName?: string;
  items?: DonationSummaryItem[];
};

export default async function DonateSuccessPage() {
  const cookieStore = await cookies();
  const summaryRaw = cookieStore.get("donation_summary")?.value;

  let summary: DonationSummaryCookie | null = null;

  if (summaryRaw) {
    try {
      summary = JSON.parse(summaryRaw) as DonationSummaryCookie;
    } catch {
      summary = null;
    }
  }

  const items = summary?.items ?? [];
  const itemCount = items.length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Thank you</h1>
      <p className="mt-4 text-muted-foreground">
        {itemCount > 0
          ? `Your donation of ${itemCount} item${itemCount === 1 ? "" : "s"} has been submitted. A Sleepwell coordinator will review everything and contact you about photos, pickup timing, and matching.`
          : "Your donation has been submitted. A Sleepwell coordinator will review your items and contact you about photos, pickup timing, and matching."}
      </p>

      {summary?.donorName && (
        <p className="mt-2 text-sm text-muted-foreground">
          Submitted by {summary.donorName}
        </p>
      )}

      {items.length > 0 && (
        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-medium">Items submitted</h2>
          <ul className="space-y-3">
            {items.map((item, index) => (
              <li
                key={`${item.category}-${index}`}
                className="rounded-md border border-border bg-card p-4 text-sm"
              >
                <p className="font-medium">{item.categoryLabel}</p>
                <p className="mt-1 text-muted-foreground">
                  {item.conditionLabel} · Qty {item.quantity}
                </p>
                {item.itemKind === "clothing" && (
                  <p className="mt-2 text-muted-foreground">
                    {item.size && `Size ${item.size}`}
                    {item.size && item.genderCategoryLabel ? " · " : ""}
                    {item.genderCategoryLabel}
                  </p>
                )}
                {item.notes && (
                  <p className="mt-2 text-muted-foreground">{item.notes}</p>
                )}
                {item.title && item.itemKind === "furniture" && (
                  <p className="mt-2 text-muted-foreground">{item.title}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        Most reviews happen within two business days. If you indicated photos are
        pending, we will reach out to collect them.
      </p>
      <div className="mt-8 flex gap-4 text-sm">
        <Link
          href="/"
          className="font-medium text-primary hover:opacity-90"
        >
          Return home
        </Link>
        <Link
          href="/donate"
          className="text-muted-foreground hover:text-foreground"
        >
          Submit another donation
        </Link>
      </div>
    </div>
  );
}
