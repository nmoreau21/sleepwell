import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Sleepwell</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        A nonprofit resource coordination network. Furniture and household
        resources move directly from donors to neighbors transitioning into
        stable housing.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/donate"
          className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Donate furniture
        </Link>
        <Link
          href="/refer"
          className="inline-flex rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Request furniture support
        </Link>
      </div>
    </div>
  );
}
