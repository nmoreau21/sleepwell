import { updateItemStatus } from "@/actions/admin/items";
import { formatAdminLocation } from "@/lib/format/location";
import type { AdminDonationSubmissionGroup } from "@/lib/admin/group-furniture-submissions";
import {
  formatAdminClothingDetails,
  formatAdminDonationItemLabel,
} from "@/lib/validation/donation-item-display";
import {
  buildStatusSelectOptions,
  FURNITURE_ITEM_STATUS_LABELS,
} from "@/lib/validation/admin-status";
import { FURNITURE_ITEM_ADMIN_TRANSITIONS } from "@/types/statuses";
import type { AdminFurnitureItemRow } from "@/services/admin/list-furniture-items";

import { AdminEmptyState } from "./empty-state";
import { StatusBadge } from "./status-badge";
import { StatusUpdateForm } from "./status-update-form";

function formatDateValue(value: string | Date | null): string | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return value;
}

function formatAvailability(
  start: string | Date | null,
  end: string | Date | null,
): string {
  const startLabel = formatDateValue(start);
  const endLabel = formatDateValue(end);

  if (!startLabel && !endLabel) {
    return "Not specified";
  }
  if (startLabel && endLabel) {
    return `${startLabel} – ${endLabel}`;
  }
  return startLabel ?? endLabel ?? "Not specified";
}

export function ItemsQueue({
  groups,
  statusFilter,
}: Readonly<{
  groups: AdminDonationSubmissionGroup[];
  statusFilter: string;
}>) {
  if (groups.length === 0) {
    return (
      <AdminEmptyState
        title="No items in this queue"
        description="Submitted donor furniture will appear here for coordinator review."
      />
    );
  }

  const returnTo =
    statusFilter === "queue"
      ? "/admin/items"
      : `/admin/items?status=${encodeURIComponent(statusFilter)}`;

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <DonationSubmissionCard
          key={group.key}
          group={group}
          returnTo={returnTo}
        />
      ))}
    </div>
  );
}

function DonationSubmissionCard({
  group,
  returnTo,
}: Readonly<{
  group: AdminDonationSubmissionGroup;
  returnTo: string;
}>) {
  const itemCount = group.items.length;
  const locationLabel = formatAdminLocation({
    city: group.city,
    state: group.state,
    zipCode: group.zipCode,
    addressLine1: group.addressLine1,
    crossStreet: group.crossStreet,
    displayLocation: group.displayLocation,
    privacyLevel: group.locationPrivacyLevel as
      | "exact"
      | "cross_street"
      | "zip_only",
  });

  return (
    <article className="rounded-lg border border-border bg-card shadow-sm">
      <header className="border-b border-border bg-muted/30 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-medium">
              {group.donorFirstName} {group.donorLastName}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {group.donorEmail ?? "No email"}
              {group.donorPhone ? ` · ${group.donorPhone}` : ""}
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>{group.submittedAt.toLocaleString()}</p>
            <p className="mt-1 font-medium text-foreground">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Pickup location" value={locationLabel} />
          <Field
            label="Privacy level"
            value={group.locationPrivacyLevel.replace(/_/g, " ")}
          />
          <Field
            label="Availability"
            value={formatAvailability(
              group.availabilityStart,
              group.availabilityEnd,
            )}
          />
        </dl>

        {group.pickupConstraints && (
          <div className="mt-3 text-sm">
            <p className="font-medium text-muted-foreground">
              Pickup notes & constraints
            </p>
            <p className="mt-1 whitespace-pre-wrap">{group.pickupConstraints}</p>
          </div>
        )}
      </header>

      <ul className="divide-y divide-border">
        {group.items.map((item) => (
          <DonationItemRow
            key={item.id}
            item={item}
            returnTo={returnTo}
          />
        ))}
      </ul>
    </article>
  );
}

function DonationItemRow({
  item,
  returnTo,
}: Readonly<{
  item: AdminFurnitureItemRow;
  returnTo: string;
}>) {
  const statusOptions = buildStatusSelectOptions(
    item.status,
    FURNITURE_ITEM_ADMIN_TRANSITIONS,
    FURNITURE_ITEM_STATUS_LABELS,
  );

  const itemLabel = formatAdminDonationItemLabel({
    itemKind: item.itemKind,
    category: item.category,
    title: item.title,
    metadata: item.metadata,
  });

  const clothingDetails = formatAdminClothingDetails(item.metadata);

  return (
    <li className="px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">
              {itemLabel}
              {item.quantity > 1 ? ` × ${item.quantity}` : ""}
            </h3>
            <StatusBadge status={item.status} kind="item" />
            {item.itemKind === "clothing" && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Clothing
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Condition: {item.condition}
            {clothingDetails.length > 0
              ? ` · ${clothingDetails.join(" · ")}`
              : ""}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {item.createdAt.toLocaleString()}
        </p>
      </div>

      {item.description && (
        <p className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground">
          {item.description}
        </p>
      )}

      <div className="mt-4 border-t border-border pt-4">
        <StatusUpdateForm
          action={updateItemStatus}
          entityIdField="itemId"
          entityId={item.id}
          currentStatus={item.status}
          options={statusOptions}
          returnTo={returnTo}
          reasonField="rejectionReason"
          reasonLabel="Rejection reason"
          reasonStatuses={["rejected"]}
        />
      </div>
    </li>
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
