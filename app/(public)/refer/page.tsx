import Link from "next/link";

import { ReferralForm } from "@/components/forms/referral-form";

export default async function ReferPage({
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
          Request furniture support
        </h1>
        <p className="mt-2 text-muted-foreground">
          Sleepwell coordinates donated furniture for neighbors moving into
          stable housing. We match needs with community donors — there is no
          public furniture catalog.
        </p>
      </div>

      <ReferralForm error={params.error} />
    </div>
  );
}
