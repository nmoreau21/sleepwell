import { StatusBadge } from "@/components/admin/status-badge";
import { TransferCompletionForm } from "@/components/admin/transfer-completion-form";
import { TransferScheduleForm } from "@/components/admin/transfer-schedule-form";
import { FURNITURE_CATEGORIES } from "@/lib/validation/categories";
import { TRANSFER_METHODS } from "@/lib/validation/transfer";
import type { AdminMatchDetail } from "@/services/matches/get-match-detail";

function categoryLabel(value: string): string {
  return FURNITURE_CATEGORIES.find((entry) => entry.value === value)?.label ?? value;
}

function transferMethodLabel(value: string): string {
  return TRANSFER_METHODS.find((entry) => entry.value === value)?.label ?? value;
}

function formatDateTime(value: Date | null): string {
  if (!value) {
    return "—";
  }
  return value.toLocaleString();
}

export function MatchDetailView({
  detail,
  returnTo,
}: Readonly<{
  detail: AdminMatchDetail;
  returnTo: string;
}>) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-medium">Match</h2>
          <StatusBadge status={detail.status} kind="request" />
          {detail.matchScore && (
            <span className="text-sm text-muted-foreground">
              Score {detail.matchScore}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Created {detail.createdAt.toLocaleString()}
        </p>
        {detail.transferMethod && (
          <p className="mt-1 text-sm text-muted-foreground">
            Transfer method: {transferMethodLabel(detail.transferMethod)}
          </p>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard
          title="Donor item"
          lines={[
            `${categoryLabel(detail.item.category)} · ${detail.item.condition}`,
            `Qty ${detail.item.quantity} · ${detail.item.status}`,
            detail.item.locationLabel,
            `${detail.item.donorName}${detail.item.donorEmail ? ` · ${detail.item.donorEmail}` : ""}`,
          ]}
        />
        <InfoCard
          title="Recipient request"
          lines={[
            `${detail.request.recipientName}${detail.request.recipientEmail ? ` · ${detail.request.recipientEmail}` : ""}`,
            `${detail.request.priority} urgency · ${detail.request.status}`,
            detail.request.locationLabel,
            detail.request.needsDelivery ? "Needs delivery" : "Can pick up",
            detail.request.partnerOrganizationName
              ? `Partner: ${detail.request.partnerOrganizationName}`
              : "Direct request",
            `${categoryLabel(detail.need.category)} need · ${detail.need.status}`,
            `Qty needed ${detail.need.quantityNeeded} (matched ${detail.need.quantityMatched})`,
            detail.need.sizePreference ? `Size: ${detail.need.sizePreference}` : null,
          ].filter(Boolean) as string[]}
        />
      </div>

      {detail.transfer ? (
        <section className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h2 className="font-medium">Transfer</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Field label="Status" value={detail.transfer.status} />
            <Field
              label="Method"
              value={transferMethodLabel(detail.transfer.transferType)}
            />
            <Field
              label="Scheduled start"
              value={formatDateTime(detail.transfer.scheduledStart)}
            />
            <Field
              label="Scheduled end"
              value={formatDateTime(detail.transfer.scheduledEnd)}
            />
            <Field
              label="Donor contact confirmed"
              value={detail.transfer.donorContactConfirmed ? "Yes" : "No"}
            />
            <Field
              label="Recipient contact confirmed"
              value={detail.transfer.recipientContactConfirmed ? "Yes" : "No"}
            />
            {detail.transfer.completedAt && (
              <Field
                label="Completed at"
                value={formatDateTime(detail.transfer.completedAt)}
              />
            )}
            {detail.transfer.failureReason && (
              <Field label="Reason" value={detail.transfer.failureReason} />
            )}
          </dl>
          {detail.transfer.pickupInstructions && (
            <NoteBlock label="Pickup instructions" text={detail.transfer.pickupInstructions} />
          )}
          {detail.transfer.deliveryInstructions && (
            <NoteBlock
              label="Delivery instructions"
              text={detail.transfer.deliveryInstructions}
            />
          )}
          {detail.transfer.coordinatorNotes && (
            <NoteBlock label="Notes" text={detail.transfer.coordinatorNotes} />
          )}

          {detail.completable && (
            <div className="border-t border-border pt-4">
              <h3 className="font-medium">Complete transfer</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Mark the transfer completed, failed, or cancelled.
              </p>
              <div className="mt-4">
                <TransferCompletionForm
                  matchId={detail.id}
                  transferId={detail.transfer.id}
                  returnTo={returnTo}
                />
              </div>
            </div>
          )}
        </section>
      ) : detail.schedulable ? (
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-medium">Schedule transfer</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Set pickup or delivery window and coordination details.
          </p>
          <div className="mt-4">
            <TransferScheduleForm matchId={detail.id} returnTo={returnTo} />
          </div>
        </section>
      ) : (
        <section className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
          This match is not ready for transfer scheduling. It must be approved
          with a reserved item and no active transfer.
        </section>
      )}
    </div>
  );
}

function InfoCard({
  title,
  lines,
}: Readonly<{
  title: string;
  lines: string[];
}>) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-sm">
      <h2 className="font-medium">{title}</h2>
      <ul className="mt-2 space-y-1 text-muted-foreground">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

function Field({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

function NoteBlock({
  label,
  text,
}: Readonly<{
  label: string;
  text: string;
}>) {
  return (
    <div className="text-sm">
      <p className="font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap">{text}</p>
    </div>
  );
}
