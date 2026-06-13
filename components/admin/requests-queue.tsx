import { updateRequestStatus } from "@/actions/admin/requests";
import { formatRequestArea } from "@/lib/format/location";
import {
  buildStatusSelectOptions,
  RECIPIENT_REQUEST_STATUS_LABELS,
} from "@/lib/validation/admin-status";
import { RECIPIENT_REQUEST_ADMIN_TRANSITIONS } from "@/types/statuses";
import { FURNITURE_CATEGORIES } from "@/lib/validation/categories";
import type { AdminRecipientRequestRow } from "@/services/admin/list-recipient-requests";

import { AdminEmptyState } from "./empty-state";
import { StatusBadge } from "./status-badge";
import { StatusUpdateForm } from "./status-update-form";

function categoryLabel(value: string): string {
  return FURNITURE_CATEGORIES.find((entry) => entry.value === value)?.label ?? value;
}

export function RequestsQueue({
  requests,
  statusFilter,
}: Readonly<{
  requests: AdminRecipientRequestRow[];
  statusFilter: string;
}>) {
  if (requests.length === 0) {
    return (
      <AdminEmptyState
        title="No requests in this queue"
        description="Recipient and partner referral requests will appear here for review."
      />
    );
  }

  const returnTo =
    statusFilter === "queue"
      ? "/admin/requests"
      : `/admin/requests?status=${encodeURIComponent(statusFilter)}`;

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const statusOptions = buildStatusSelectOptions(
          request.status,
          RECIPIENT_REQUEST_ADMIN_TRANSITIONS,
          RECIPIENT_REQUEST_STATUS_LABELS,
        );

        return (
        <article
          key={request.id}
          className="rounded-lg border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-medium">
                  {request.recipientFirstName} {request.recipientLastName}
                </h2>
                <StatusBadge status={request.status} kind="request" />
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {request.priority}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {request.recipientEmail ?? "No email"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {request.createdAt.toLocaleDateString()}
            </p>
          </div>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Area"
              value={formatRequestArea({
                city: request.city,
                state: request.state,
                zipCode: request.zipCode,
              })}
            />
            <Field
              label="Delivery"
              value={request.needsDelivery ? "Needs delivery" : "Can pick up"}
            />
            <Field
              label="Partner referral"
              value={
                request.partnerOrganizationName
                  ? request.partnerOrganizationName
                  : "Direct / self request"
              }
            />
            {request.moveInDate && (
              <Field
                label="Move-in date"
                value={
                  request.moveInDate instanceof Date
                    ? request.moveInDate.toISOString().slice(0, 10)
                    : request.moveInDate
                }
              />
            )}
          </dl>

          {request.housingAddressLine1 && (
            <div className="mt-3 rounded-md bg-muted/40 px-3 py-2 text-sm">
              <p className="font-medium text-muted-foreground">
                Housing address (coordinator only)
              </p>
              <p className="mt-1">
                {request.housingAddressLine1},{" "}
                {formatRequestArea({
                  city: request.city,
                  state: request.state,
                  zipCode: request.zipCode,
                })}
              </p>
            </div>
          )}

          {request.accessNotes && (
            <div className="mt-3 text-sm">
              <p className="font-medium text-muted-foreground">Access notes</p>
              <p className="mt-1 whitespace-pre-wrap">{request.accessNotes}</p>
            </div>
          )}

          {request.needLines.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-muted-foreground">
                Needed items
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {request.needLines.map((line) => (
                  <li key={line.id}>
                    {categoryLabel(line.category)} × {line.quantityNeeded}
                    {line.sizePreference ? ` (${line.sizePreference})` : ""}
                    {line.essential ? "" : " · optional"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {request.notes && (
            <div className="mt-3 text-sm">
              <p className="font-medium text-muted-foreground">Notes</p>
              <p className="mt-1 whitespace-pre-wrap">{request.notes}</p>
            </div>
          )}

          <div className="mt-4 border-t border-border pt-4">
            <StatusUpdateForm
              action={updateRequestStatus}
              entityIdField="requestId"
              entityId={request.id}
              currentStatus={request.status}
              options={statusOptions}
              returnTo={returnTo}
              reasonField="closedReason"
              reasonLabel="Reason"
              reasonStatuses={["closed", "denied"]}
            />
          </div>
        </article>
        );
      })}
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
