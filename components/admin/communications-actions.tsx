import { sendEligibleCommunications } from "@/actions/admin/communications";

export function CommunicationsActions({
  eligibleCount,
  emailConfigured,
}: Readonly<{
  eligibleCount: number;
  emailConfigured: boolean;
}>) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <form action={sendEligibleCommunications}>
        <input type="hidden" name="dryRun" value="true" />
        <button
          type="submit"
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          Preview eligible sends ({eligibleCount})
        </button>
      </form>

      <form action={sendEligibleCommunications}>
        <input type="hidden" name="dryRun" value="false" />
        <button
          type="submit"
          disabled={!emailConfigured || eligibleCount === 0}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Send eligible queued emails
        </button>
      </form>
    </div>
  );
}
