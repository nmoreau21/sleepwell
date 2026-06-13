import Link from "next/link";

import { requireAdmin } from "@/lib/auth/session";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Coordinator workspace for reviewing intake and preparing matches.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Donor items"
          description="Review and approve furniture submissions."
          href="/admin/items"
        />
        <DashboardCard
          title="Recipient requests"
          description="Verify referrals and household needs."
          href="/admin/requests"
        />
        <DashboardCard
          title="Connections"
          description="Supply vs demand and potential pairings."
          href="/admin/connections"
        />
        <DashboardCard
          title="Communications"
          description="Queued emails and transfer notifications."
          href="/admin/communications"
        />
        <DashboardCard
          title="Impact & reporting"
          description="Completed transfers and pipeline metrics."
          href="/admin/impact"
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-4 text-sm">
        <p className="font-medium">Signed in as</p>
        <p className="mt-1 text-muted-foreground">{session.email}</p>
        <p className="mt-1 text-muted-foreground">
          Roles: {session.roles.join(", ") || "none"}
        </p>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
  status,
}: Readonly<{
  title: string;
  description: string;
  href?: string;
  status?: string;
}>) {
  const content = (
    <>
      <h2 className="font-medium">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {status ? (
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {status}
        </p>
      ) : (
        <p className="mt-3 text-sm font-medium text-primary">Open queue →</p>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">{content}</div>
  );
}
