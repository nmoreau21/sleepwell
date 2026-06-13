import Link from "next/link";

type FilterOption = {
  value: string;
  label: string;
};

export function StatusFilter({
  basePath,
  current,
  options,
}: Readonly<{
  basePath: string;
  current: string;
  options: FilterOption[];
}>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = current === option.value;
        const href =
          option.value === "queue" || option.value === "all"
            ? basePath
            : `${basePath}?status=${encodeURIComponent(option.value)}`;

        return (
          <Link
            key={option.value}
            href={href}
            className={`rounded-md px-3 py-1.5 text-sm ${
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
