import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold tracking-tight">
            Sleepwell
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link
              href="/donate"
              className="text-muted-foreground hover:text-foreground"
            >
              Donate furniture
            </Link>
            <Link
              href="/refer"
              className="text-muted-foreground hover:text-foreground"
            >
              Request support
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
