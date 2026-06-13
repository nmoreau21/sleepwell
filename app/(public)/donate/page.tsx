import Link from "next/link";

import { DonationForm } from "@/components/forms/donation-form";

export default async function DonatePage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ error?: string }>;
}>) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to home
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Donate furniture
        </h1>
        <p className="mt-2 text-muted-foreground">
          Share furniture directly with a neighbor transitioning into stable
          housing. Add one or more items to your donation — Sleepwell coordinates
          the match and items stay with you until pickup.
        </p>
      </div>

      <DonationForm error={params.error} />
    </div>
  );
}
