type CountRow = {
  key: string;
  count: number;
};

type LocationRow = {
  city: string;
  state: string;
  zipCode: string;
  count: number;
};

export function StatCards({
  items,
}: Readonly<{
  items: { label: string; value: number | string }[];
}>) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-border bg-card px-4 py-3"
        >
          <p className="text-sm text-muted-foreground">{item.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function CountTable({
  title,
  rows,
  emptyLabel,
  keyLabel = "Category",
  formatKey,
}: Readonly<{
  title: string;
  rows: CountRow[];
  emptyLabel: string;
  keyLabel?: string;
  formatKey?: (key: string) => string;
}>) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-medium">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="pb-2">{keyLabel}</th>
              <th className="pb-2 text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-border/60">
                <td className="py-2">
                  {formatKey ? formatKey(row.key) : row.key}
                </td>
                <td className="py-2 text-right tabular-nums">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function LocationTable({
  title,
  rows,
  emptyLabel,
}: Readonly<{
  title: string;
  rows: LocationRow[];
  emptyLabel: string;
}>) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-medium">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="pb-2">Location</th>
              <th className="pb-2 text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.city}-${row.state}-${row.zipCode}`}
                className="border-t border-border/60"
              >
                <td className="py-2">
                  {row.city}, {row.state} {row.zipCode}
                </td>
                <td className="py-2 text-right tabular-nums">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
