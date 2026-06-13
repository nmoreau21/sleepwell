import Link from "next/link";

export default function ReferSuccessPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Request received</h1>
      <p className="mt-4 text-muted-foreground">
        Thank you. A Sleepwell coordinator will review your request and contact
        you about verification, matching, and delivery or pickup options.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Partner referrals are typically reviewed within two business days.
        Direct requests may require additional housing verification before
        matching begins.
      </p>
      <div className="mt-8 flex gap-4 text-sm">
        <Link href="/" className="font-medium text-primary hover:opacity-90">
          Return home
        </Link>
      </div>
    </div>
  );
}
