import { createMatchFromConnection } from "@/actions/admin/matches";

export function CreateMatchForm({
  itemId,
  needLineId,
  returnTo,
}: Readonly<{
  itemId: string;
  needLineId: string;
  returnTo: string;
}>) {
  return (
    <form action={createMatchFromConnection} className="mt-4">
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="needLineId" value={needLineId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button
        type="submit"
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Create match
      </button>
    </form>
  );
}
