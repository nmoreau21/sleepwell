"use client";

import { useState } from "react";

type StatusOption = {
  value: string;
  label: string;
};

export function StatusUpdateForm({
  action,
  entityIdField,
  entityId,
  currentStatus,
  options,
  returnTo,
  reasonField,
  reasonLabel,
  reasonStatuses,
}: Readonly<{
  action: (formData: FormData) => void;
  entityIdField: string;
  entityId: string;
  currentStatus: string;
  options: StatusOption[];
  returnTo: string;
  reasonField?: string;
  reasonLabel?: string;
  reasonStatuses?: string[];
}>) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  const showReason =
    reasonField &&
    reasonStatuses?.includes(selectedStatus) &&
    selectedStatus !== currentStatus;

  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <input type="hidden" name={entityIdField} value={entityId} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <div className="min-w-[10rem]">
        <label className="block text-xs font-medium text-muted-foreground">
          Update status
        </label>
        <select
          name="status"
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
          className="mt-1 block w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {showReason && (
        <div className="min-w-[12rem] flex-1">
          <label className="block text-xs font-medium text-muted-foreground">
            {reasonLabel}
          </label>
          <input
            name={reasonField}
            type="text"
            className="mt-1 block w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            placeholder="Brief reason"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={selectedStatus === currentStatus}
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        Save
      </button>
    </form>
  );
}
