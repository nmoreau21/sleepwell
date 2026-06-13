import Link from "next/link";

import { signOut } from "@/actions/auth";
import type { AppSession } from "@/lib/auth/session";

export function AdminShell({
  session,
  children,
}: Readonly<{
  session: AppSession;
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold tracking-tight">
              Sleepwell Admin
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/admin/items"
                className="text-muted-foreground hover:text-foreground"
              >
                Items
              </Link>
              <Link
                href="/admin/requests"
                className="text-muted-foreground hover:text-foreground"
              >
                Requests
              </Link>
              <Link
                href="/admin/connections"
                className="text-muted-foreground hover:text-foreground"
              >
                Connections
              </Link>
              <Link
                href="/admin/communications"
                className="text-muted-foreground hover:text-foreground"
              >
                Communications
              </Link>
              <Link
                href="/admin/impact"
                className="text-muted-foreground hover:text-foreground"
              >
                Impact
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              {session.firstName} {session.lastName}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
