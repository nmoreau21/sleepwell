import {
  FURNITURE_ITEM_STATUS_LABELS,
  RECIPIENT_REQUEST_STATUS_LABELS,
} from "@/lib/validation/admin-status";

export function StatusBadge({
  status,
  kind,
}: Readonly<{
  status: string;
  kind: "item" | "request";
}>) {
  const label =
    kind === "item"
      ? FURNITURE_ITEM_STATUS_LABELS[status] ?? status
      : RECIPIENT_REQUEST_STATUS_LABELS[status] ?? status;

  return (
    <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
      {label}
    </span>
  );
}
