import { scheduleTransferForMatch } from "@/actions/admin/transfers";
import { TRANSFER_METHODS } from "@/lib/validation/transfer";

export function TransferScheduleForm({
  matchId,
  returnTo,
}: Readonly<{
  matchId: string;
  returnTo: string;
}>) {
  return (
    <form action={scheduleTransferForMatch} className="space-y-4">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <div>
        <label htmlFor="transferMethod" className="block text-sm font-medium">
          Transfer method
        </label>
        <select
          id="transferMethod"
          name="transferMethod"
          required
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {TRANSFER_METHODS.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DateTimeField label="Scheduled start" name="scheduledStart" required />
        <DateTimeField label="Scheduled end" name="scheduledEnd" required />
      </div>

      <TextAreaField
        label="Pickup instructions"
        name="pickupInstructions"
        placeholder="Donor access, parking, stairs, contact preferences."
      />
      <TextAreaField
        label="Delivery instructions"
        name="deliveryInstructions"
        placeholder="Recipient access, delivery window constraints."
      />
      <TextAreaField
        label="Coordinator notes"
        name="coordinatorNotes"
        placeholder="Internal coordination notes."
      />

      <div className="flex flex-col gap-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="donorContactConfirmed" className="rounded border-input" />
          Donor contact confirmed
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="recipientContactConfirmed"
            className="rounded border-input"
          />
          Recipient contact confirmed
        </label>
      </div>

      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Schedule transfer
      </button>
    </form>
  );
}

function DateTimeField({
  label,
  name,
  required,
}: Readonly<{
  label: string;
  name: string;
  required?: boolean;
}>) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="datetime-local"
        required={required}
        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}

function TextAreaField({
  label,
  name,
  placeholder,
}: Readonly<{
  label: string;
  name: string;
  placeholder?: string;
}>) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={3}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}
