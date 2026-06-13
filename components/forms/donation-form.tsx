"use client";

import { useState } from "react";

import { submitDonation } from "@/actions/donate";
import {
  CLOTHING_GENDER_CATEGORIES,
  CLOTHING_TYPES,
  DONATION_ITEM_KINDS,
  ITEM_CONDITIONS,
  LOCATION_PRIVACY_LEVELS,
  type DonationItemInput,
  type DonationItemKind,
  type DonorPickupInput,
  validateDonationItem,
  validateDonorPickup,
} from "@/lib/validation/donation";
import {
  formatDonationItemDetails,
  formatDonationItemLabel,
} from "@/lib/validation/donation-item-display";
import { FURNITURE_CATEGORIES } from "@/lib/validation/categories";

const ERROR_MESSAGES: Record<string, string> = {
  submission_failed:
    "We could not save your donation. Please try again or contact Sleepwell.",
};

type CartItem = DonationItemInput & { id: string };

type View = "entry" | "review";

function createEmptyDonor(): DonorPickupInput {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    zipCode: "",
    locationPrivacyLevel: "zip_only",
    pickupConstraints: "",
    availabilityStart: "",
    availabilityEnd: "",
    notes: "",
    crossStreet: "",
    addressLine1: "",
  };
}

function createEmptyItemForm(): {
  itemKind: DonationItemKind;
  category: string;
  title: string;
  description: string;
  condition: string;
  quantity: string;
  requiresTwoPerson: boolean;
  photosPending: boolean;
  clothingType: string;
  size: string;
  genderCategory: string;
  notes: string;
} {
  return {
    itemKind: "furniture",
    category: "",
    title: "",
    description: "",
    condition: "",
    quantity: "1",
    requiresTwoPerson: false,
    photosPending: true,
    clothingType: "",
    size: "",
    genderCategory: "",
    notes: "",
  };
}

export function DonationForm({
  error,
}: Readonly<{
  error?: string;
}>) {
  const urlErrorMessage =
    error && ERROR_MESSAGES[error]
      ? ERROR_MESSAGES[error]
      : error
        ? decodeURIComponent(error)
        : null;

  const [view, setView] = useState<View>("entry");
  const [donor, setDonor] = useState<DonorPickupInput>(createEmptyDonor);
  const [donationItems, setDonationItems] = useState<CartItem[]>([]);
  const [itemForm, setItemForm] = useState(createEmptyItemForm);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(urlErrorMessage);

  const errorMessage = localError ?? urlErrorMessage;

  function clearItemForm() {
    setItemForm(createEmptyItemForm());
    setEditingItemId(null);
  }

  function handleAddOrUpdateItem() {
    setLocalError(null);

    const donorResult = validateDonorPickup(donor);
    if (!donorResult.ok) {
      setLocalError(donorResult.error);
      return;
    }

    const itemResult = validateDonationItem({
      itemKind: itemForm.itemKind,
      category: itemForm.category,
      title: itemForm.title,
      description: itemForm.description,
      condition: itemForm.condition,
      quantity: itemForm.quantity,
      requiresTwoPerson: itemForm.requiresTwoPerson,
      photosPending: itemForm.photosPending,
      clothingType: itemForm.clothingType,
      size: itemForm.size,
      genderCategory: itemForm.genderCategory,
      notes: itemForm.notes,
    });

    if (!itemResult.ok) {
      setLocalError(itemResult.error);
      return;
    }

    if (editingItemId) {
      setDonationItems((items) =>
        items.map((item) =>
          item.id === editingItemId
            ? { ...itemResult.data, id: editingItemId }
            : item,
        ),
      );
    } else {
      setDonationItems((items) => [
        ...items,
        { ...itemResult.data, id: crypto.randomUUID() },
      ]);
    }

    clearItemForm();
    setView("review");
  }

  function handleEditItem(id: string) {
    const item = donationItems.find((entry) => entry.id === id);
    if (!item) {
      return;
    }

    setItemForm({
      itemKind: item.itemKind,
      category: item.itemKind === "furniture" ? item.category : "",
      title: item.title ?? "",
      description: item.description ?? "",
      condition: item.condition,
      quantity: String(item.quantity),
      requiresTwoPerson: item.requiresTwoPerson ?? false,
      photosPending: item.photosPending,
      clothingType: item.clothingType ?? "",
      size: item.size ?? "",
      genderCategory: item.genderCategory ?? "",
      notes: item.notes ?? "",
    });
    setEditingItemId(id);
    setView("entry");
    setLocalError(null);
  }

  function handleRemoveItem(id: string) {
    const nextItems = donationItems.filter((item) => item.id !== id);
    setDonationItems(nextItems);
    if (editingItemId === id) {
      clearItemForm();
    }
    if (nextItems.length === 0) {
      setView("entry");
    }
  }

  function handleAddAnother() {
    clearItemForm();
    setView("entry");
    setLocalError(null);
  }

  async function handleSubmitDonation() {
    setLocalError(null);

    if (donationItems.length === 0) {
      setLocalError("Add at least one item before submitting.");
      return;
    }

    const donorResult = validateDonorPickup(donor);
    if (!donorResult.ok) {
      setLocalError(donorResult.error);
      setView("entry");
      return;
    }

    const payload = {
      donor: donorResult.data.donor,
      items: donationItems.map((cartItem) => ({
        itemKind: cartItem.itemKind,
        category: cartItem.category,
        title: cartItem.title,
        description: cartItem.description,
        condition: cartItem.condition,
        quantity: cartItem.quantity,
        requiresTwoPerson: cartItem.requiresTwoPerson,
        photosPending: cartItem.photosPending,
        clothingType: cartItem.clothingType,
        size: cartItem.size,
        genderCategory: cartItem.genderCategory,
        notes: cartItem.notes,
      })),
    };

    const formData = new FormData();
    formData.set("payload", JSON.stringify(payload));

    try {
      await submitDonation(formData);
    } catch {
      setLocalError(ERROR_MESSAGES.submission_failed);
    }
  }

  return (
    <div className="space-y-8">
      {errorMessage && (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {view === "review" && donationItems.length > 0 && (
        <DonationReview
          donor={donor}
          items={donationItems}
          onAddAnother={handleAddAnother}
          onEdit={handleEditItem}
          onRemove={handleRemoveItem}
          onSubmit={handleSubmitDonation}
        />
      )}

      {view === "entry" && (
        <div className="space-y-8">
          {donationItems.length > 0 && (
            <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm">
              <p className="font-medium">
                {donationItems.length} item
                {donationItems.length === 1 ? "" : "s"} in your donation
              </p>
              <button
                type="button"
                onClick={() => setView("review")}
                className="mt-2 text-primary hover:opacity-90"
              >
                Review donation →
              </button>
            </div>
          )}

          <DonorSections donor={donor} onChange={setDonor} />

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-medium">Donation item</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {editingItemId
                  ? "Update this item, then return to your donation summary."
                  : "Add furniture or clothing one item at a time. You can add more after reviewing."}
              </p>
            </div>

            <ItemFields itemForm={itemForm} onChange={setItemForm} />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAddOrUpdateItem}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                {editingItemId ? "Save item changes" : "Add item to donation"}
              </button>
              {editingItemId && (
                <button
                  type="button"
                  onClick={() => {
                    clearItemForm();
                    setView("review");
                  }}
                  className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function DonorSections({
  donor,
  onChange,
}: Readonly<{
  donor: DonorPickupInput;
  onChange: (donor: DonorPickupInput) => void;
}>) {
  function update<K extends keyof DonorPickupInput>(
    key: K,
    value: DonorPickupInput[K],
  ) {
    onChange({ ...donor, [key]: value });
  }

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Your contact information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <ControlledField
            label="First name"
            value={donor.firstName}
            onChange={(value) => update("firstName", value)}
            required
          />
          <ControlledField
            label="Last name"
            value={donor.lastName}
            onChange={(value) => update("lastName", value)}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ControlledField
            label="Email"
            type="email"
            value={donor.email}
            onChange={(value) => update("email", value)}
            required
            autoComplete="email"
          />
          <ControlledField
            label="Phone"
            type="tel"
            value={donor.phone ?? ""}
            onChange={(value) => update("phone", value)}
            hint="Optional — for scheduling pickup only."
            autoComplete="tel"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Pickup location</h2>
        <ControlledSelect
          label="Location privacy"
          value={donor.locationPrivacyLevel}
          onChange={(value) =>
            update(
              "locationPrivacyLevel",
              value as DonorPickupInput["locationPrivacyLevel"],
            )
          }
          required
        >
          {LOCATION_PRIVACY_LEVELS.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </ControlledSelect>
        <ControlledField
          label="Street address"
          value={donor.addressLine1 ?? ""}
          onChange={(value) => update("addressLine1", value)}
          hint="Required only if you chose exact address above."
        />
        <ControlledField
          label="Cross streets"
          value={donor.crossStreet ?? ""}
          onChange={(value) => update("crossStreet", value)}
          placeholder="e.g. Main & 5th"
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <ControlledField
            label="City"
            value={donor.city}
            onChange={(value) => update("city", value)}
            required
          />
          <ControlledField
            label="State"
            value={donor.state}
            onChange={(value) => update("state", value.toUpperCase())}
            required
            placeholder="CA"
            maxLength={2}
          />
          <ControlledField
            label="ZIP code"
            value={donor.zipCode}
            onChange={(value) => update("zipCode", value)}
            required
            placeholder="90210"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Pickup availability</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <ControlledField
            label="Available from"
            type="date"
            value={donor.availabilityStart ?? ""}
            onChange={(value) => update("availabilityStart", value)}
          />
          <ControlledField
            label="Available until"
            type="date"
            value={donor.availabilityEnd ?? ""}
            onChange={(value) => update("availabilityEnd", value)}
          />
        </div>
        <ControlledTextArea
          label="Pickup constraints"
          value={donor.pickupConstraints ?? ""}
          onChange={(value) => update("pickupConstraints", value)}
          placeholder="Stairs, driveway access, best times, disassembly needed, etc."
        />
        <ControlledTextArea
          label="Additional notes"
          value={donor.notes ?? ""}
          onChange={(value) => update("notes", value)}
          placeholder="Anything else coordinators should know."
        />
      </section>
    </>
  );
}

function ItemFields({
  itemForm,
  onChange,
}: Readonly<{
  itemForm: ReturnType<typeof createEmptyItemForm>;
  onChange: (form: ReturnType<typeof createEmptyItemForm>) => void;
}>) {
  function update<K extends keyof ReturnType<typeof createEmptyItemForm>>(
    key: K,
    value: ReturnType<typeof createEmptyItemForm>[K],
  ) {
    onChange({ ...itemForm, [key]: value });
  }

  function handleItemKindChange(kind: DonationItemKind) {
    onChange({
      ...createEmptyItemForm(),
      itemKind: kind,
      condition: itemForm.condition,
      quantity: itemForm.quantity,
      photosPending: itemForm.photosPending,
    });
  }

  const isClothing = itemForm.itemKind === "clothing";

  return (
    <div className="space-y-4">
      <ControlledSelect
        label="Item type"
        value={itemForm.itemKind}
        onChange={(value) => handleItemKindChange(value as DonationItemKind)}
        required
      >
        {DONATION_ITEM_KINDS.map((entry) => (
          <option key={entry.value} value={entry.value}>
            {entry.label}
          </option>
        ))}
      </ControlledSelect>

      {isClothing ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <ControlledSelect
              label="Clothing type"
              value={itemForm.clothingType}
              onChange={(value) => update("clothingType", value)}
              required
            >
              <option value="">Select type</option>
              {CLOTHING_TYPES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </ControlledSelect>
            <ControlledSelect
              label="Gender category"
              value={itemForm.genderCategory}
              onChange={(value) => update("genderCategory", value)}
              required
            >
              <option value="">Select category</option>
              {CLOTHING_GENDER_CATEGORIES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </ControlledSelect>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ControlledField
              label="Size"
              value={itemForm.size}
              onChange={(value) => update("size", value)}
              placeholder="e.g. M, L, 10"
              required
            />
            <ControlledSelect
              label="Condition"
              value={itemForm.condition}
              onChange={(value) => update("condition", value)}
              required
            >
              <option value="">Select condition</option>
              {ITEM_CONDITIONS.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </ControlledSelect>
          </div>
          <ControlledField
            label="Quantity"
            type="number"
            value={itemForm.quantity}
            onChange={(value) => update("quantity", value)}
            required
            min={1}
            max={20}
          />
          <ControlledTextArea
            label="Notes"
            value={itemForm.notes}
            onChange={(value) => update("notes", value)}
            placeholder="Brand, fabric, style, or anything coordinators should know."
          />
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <ControlledSelect
              label="Furniture category"
              value={itemForm.category}
              onChange={(value) => update("category", value)}
              required
            >
              <option value="">Select category</option>
              {FURNITURE_CATEGORIES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </ControlledSelect>
            <ControlledSelect
              label="Condition"
              value={itemForm.condition}
              onChange={(value) => update("condition", value)}
              required
            >
              <option value="">Select condition</option>
              {ITEM_CONDITIONS.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </ControlledSelect>
          </div>
          <ControlledField
            label="Short title"
            value={itemForm.title}
            onChange={(value) => update("title", value)}
            placeholder="e.g. Queen bed frame"
          />
          <ControlledTextArea
            label="Description"
            value={itemForm.description}
            onChange={(value) => update("description", value)}
            placeholder="Size, brand, material, and anything a neighbor should know."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <ControlledField
              label="Quantity"
              type="number"
              value={itemForm.quantity}
              onChange={(value) => update("quantity", value)}
              required
              min={1}
              max={20}
            />
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={itemForm.requiresTwoPerson}
                onChange={(event) =>
                  update("requiresTwoPerson", event.target.checked)
                }
                className="mt-1 rounded border-input"
              />
              <span>
                Requires two people to move
                <span className="block text-muted-foreground">
                  Heavy or bulky items (couches, large dressers).
                </span>
              </span>
            </label>
          </div>
        </>
      )}

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={itemForm.photosPending}
          onChange={(event) => update("photosPending", event.target.checked)}
          className="mt-1 rounded border-input"
        />
        <span>
          I will provide photos when a coordinator contacts me
          <span className="block text-muted-foreground">
            Photo upload is not available on this form yet.
          </span>
        </span>
      </label>
    </div>
  );
}

function DonationReview({
  donor,
  items,
  onAddAnother,
  onEdit,
  onRemove,
  onSubmit,
}: Readonly<{
  donor: DonorPickupInput;
  items: CartItem[];
  onAddAnother: () => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onSubmit: () => void;
}>) {
  const privacyLabel =
    LOCATION_PRIVACY_LEVELS.find(
      (entry) => entry.value === donor.locationPrivacyLevel,
    )?.label ?? donor.locationPrivacyLevel;

  return (
    <section className="space-y-6 rounded-lg border border-border bg-card p-6">
      <div>
        <h2 className="text-lg font-medium">Review your donation</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm your items before submitting. You can add more, edit, or remove
          items.
        </p>
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
        <h3 className="font-medium">Contact & pickup</h3>
        <p className="mt-2">
          {donor.firstName} {donor.lastName}
        </p>
        <p className="text-muted-foreground">{donor.email}</p>
        {donor.phone && (
          <p className="text-muted-foreground">{donor.phone}</p>
        )}
        <p className="mt-2">
          {donor.city}, {donor.state} {donor.zipCode}
        </p>
        <p className="text-muted-foreground">{privacyLabel}</p>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium">
          Items ({items.length})
        </h3>
        <ul className="space-y-3">
          {items.map((item) => {
            const conditionLabel =
              ITEM_CONDITIONS.find((entry) => entry.value === item.condition)
                ?.label ?? item.condition;
            const detailLines = formatDonationItemDetails(item);

            return (
              <li
                key={item.id}
                className="rounded-md border border-border p-4 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{formatDonationItemLabel(item)}</p>
                    <p className="mt-1 text-muted-foreground">
                      {conditionLabel} · Qty {item.quantity}
                    </p>
                    {detailLines.length > 0 && (
                      <ul className="mt-2 space-y-1 text-muted-foreground">
                        {detailLines.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(item.id)}
                      className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="rounded-md border border-border px-3 py-1.5 text-sm text-destructive hover:bg-muted"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onAddAnother}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Add another item
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Submit donation
        </button>
      </div>
    </section>
  );
}

function ControlledField({
  label,
  value,
  onChange,
  type = "text",
  required,
  hint,
  placeholder,
  autoComplete,
  min,
  max,
  maxLength,
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  autoComplete?: string;
  min?: number;
  max?: number;
  maxLength?: number;
}>) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        min={min}
        max={max}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none ring-ring focus-visible:ring-2"
      />
      {hint && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function ControlledSelect({
  label,
  value,
  onChange,
  required,
  children,
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  children: React.ReactNode;
}>) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <select
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none ring-ring focus-visible:ring-2"
      >
        {children}
      </select>
    </div>
  );
}

function ControlledTextArea({
  label,
  value,
  onChange,
  placeholder,
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}>) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <textarea
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none ring-ring focus-visible:ring-2"
      />
    </div>
  );
}
