import Link from "next/link";
import { notFound } from "next/navigation";

import { MatchDetailView } from "@/components/admin/match-detail-view";
import { COMPLETE_TRANSFER_ERROR_MESSAGES } from "@/lib/validation/transfer-completion";
import { SCHEDULE_TRANSFER_ERROR_MESSAGES } from "@/lib/validation/transfer";
import { getMatchDetailForAdmin } from "@/services/matches/get-match-detail";

const SUCCESS_MESSAGES: Record<string, string> = {
  transfer_scheduled: "Transfer scheduled successfully.",
  transfer_completed: "Transfer marked completed.",
  transfer_failed: "Transfer marked failed.",
  transfer_cancelled: "Transfer cancelled.",
};

export default async function AdminMatchDetailPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}>) {
  const { id } = await params;
  const query = await searchParams;
  const returnTo = `/admin/matches/${id}`;

  const detail = await getMatchDetailForAdmin(id);

  if (!detail) {
    notFound();
  }

  const errorMessages = {
    ...SCHEDULE_TRANSFER_ERROR_MESSAGES,
    ...COMPLETE_TRANSFER_ERROR_MESSAGES,
  };

  const errorMessage = query.error
    ? (errorMessages[query.error.toLowerCase()] ??
        errorMessages[query.error] ??
        decodeURIComponent(query.error))
    : null;

  const successMessage = query.success
    ? (SUCCESS_MESSAGES[query.success] ?? null)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/connections"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to connections
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Match details
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review match context, schedule transfers, and record outcomes.
        </p>
      </div>

      {successMessage && (
        <div
          className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm"
          role="status"
        >
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <MatchDetailView detail={detail} returnTo={returnTo} />
    </div>
  );
}
