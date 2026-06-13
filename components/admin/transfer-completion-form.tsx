"use client";

import { useState } from "react";

import { completeTransferForMatch } from "@/actions/admin/transfer-completion";

export function TransferCompletionForm({
  matchId,
  transferId,
  returnTo,
}: Readonly<{
  matchId: string;
  transferId: string;
  returnTo: string;
}>) {
  const [outcome, setOutcome] = useState<"completed" | "failed" | "cancelled">(
    "completed",
  );
  const [reopenChoice, setReopenChoice] = useState<"reopen" | "keep_reserved">(
    "keep_reserved",
  );

  const needsReason = outcome === "failed" || outcome === "cancelled";

  return (
    <form action={completeTransferForMatch} className="space-y-4">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="transferId" value={transferId} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <div>
        <label htmlFor="outcome" className="block text-sm font-medium">
          Outcome
        </label>
        <select
          id="outcome"
          name="outcome"
          value={outcome}
          onChange={(event) =>
            setOutcome(
              event.target.value as "completed" | "failed" | "cancelled",
            )
          }
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div>
        <label htmlFor="completedAt" className="block text-sm font-medium">
          Completed at
        </label>
        <input
          id="completedAt"
          name="completedAt"
          type="datetime-local"
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Leave blank to use current time.
        </p>
      </div>

      <div>
        <label htmlFor="completionNotes" className="block text-sm font-medium">
          Completion notes
        </label>
        <textarea
          id="completionNotes"
          name="completionNotes"
          rows={3}
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Optional notes about how the transfer went."
        />
      </div>

      {needsReason && (
        <div>
          <label htmlFor="reason" className="block text-sm font-medium">
            {outcome === "failed" ? "Failure reason" : "Cancellation reason"}
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={2}
            required
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      )}

      {needsReason && (
        <div className="space-y-3 rounded-md border border-border p-3 text-sm">
          <p className="font-medium">After failure or cancellation</p>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="reopenChoice"
              value="keep_reserved"
              checked={reopenChoice === "keep_reserved"}
              onChange={() => setReopenChoice("keep_reserved")}
            />
            Keep item reserved for reschedule
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="reopenChoice"
              value="reopen"
              checked={reopenChoice === "reopen"}
              onChange={() => setReopenChoice("reopen")}
            />
            Reopen item and need for matching
          </label>

          {reopenChoice === "reopen" && (
            <div>
              <label htmlFor="reopenRequestStatus" className="block text-sm font-medium">
                Reopen request as
              </label>
              <select
                id="reopenRequestStatus"
                name="reopenRequestStatus"
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="queued">Queued (in matching queue)</option>
                <option value="approved">Approved (not yet queued)</option>
              </select>
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Save outcome
      </button>
    </form>
  );
}
