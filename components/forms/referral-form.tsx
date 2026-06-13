"use client";

import { useState } from "react";

import { submitReferral } from "@/actions/refer";
import { FURNITURE_CATEGORIES } from "@/lib/validation/categories";
import { URGENCY_LEVELS, type IntakeMode } from "@/lib/validation/referral";

const ERROR_MESSAGES: Record<string, string> = {
  submission_failed:
    "We could not save your request. Please try again or contact Sleepwell.",
};

export function ReferralForm({
  error,
}: Readonly<{
  error?: string;
}>) {
  const [intakeMode, setIntakeMode] = useState<IntakeMode>("partner");

  const errorMessage =
    error && ERROR_MESSAGES[error]
      ? ERROR_MESSAGES[error]
      : error
        ? decodeURIComponent(error)
        : null;

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

      <div className="flex flex-wrap gap-2">
        <ModeButton
          active={intakeMode === "partner"}
          onClick={() => setIntakeMode("partner")}
        >
          Partner referral
        </ModeButton>
        <ModeButton
          active={intakeMode === "self"}
          onClick={() => setIntakeMode("self")}
        >
          Request for myself
        </ModeButton>
      </div>

      <p className="text-sm text-muted-foreground">
        {intakeMode === "partner"
          ? "For case managers, partner organizations, and trusted referrers with an active referral code."
          : "If you do not have a partner referral code, you may still request help. A coordinator will verify your housing situation before matching."}
      </p>

      <form action={submitReferral} className="space-y-8">
        <input type="hidden" name="intakeMode" value={intakeMode} />

        {intakeMode === "partner" && (
          <section className="space-y-4 rounded-lg border border-border p-4">
            <h2 className="text-lg font-medium">Partner information</h2>
            <Field
              label="Partner referral code"
              name="referralCode"
              required
              placeholder="e.g. HOPE-2026"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your name (referrer)" name="partnerContactName" />
              <Field
                label="Your email (referrer)"
                name="partnerContactEmail"
                type="email"
              />
            </div>
            <TextAreaField
              label="Partner notes"
              name="partnerNotes"
              placeholder="Brief context for coordinators — avoid unnecessary personal history."
            />
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="housingConfirmed"
                required={intakeMode === "partner"}
                className="mt-1 rounded border-input"
              />
              <span>
                I confirm this client has stable housing secured (lease, keys,
                or move-in date confirmed).
              </span>
            </label>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-medium">
            {intakeMode === "partner" ? "Client information" : "Your information"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" name="firstName" required />
            <Field label="Last name" name="lastName" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
            <Field
              label="Phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              hint="Optional — for scheduling only."
            />
          </div>
          <Field
            label="Household size"
            name="householdSize"
            type="number"
            min={1}
            max={20}
            hint="Number of people in the home, including children."
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium">Housing & timing</h2>
          <SelectField label="Urgency" name="urgency" required defaultValue="standard">
            {URGENCY_LEVELS.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </SelectField>
          <Field label="Move-in date" name="moveInDate" type="date" />
          <Field
            label="Housing address"
            name="housingAddressLine1"
            hint="Used only for coordination — not shown publicly."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City" name="city" required />
            <Field
              label="State"
              name="state"
              required
              placeholder="CA"
              maxLength={2}
            />
            <Field label="ZIP code" name="zipCode" required placeholder="90210" />
          </div>
          <TextAreaField
            label="Access notes"
            name="accessNotes"
            placeholder="Stairs, elevator, parking, pets, best contact times."
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium">Pickup & delivery</h2>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="deliveryAbility"
                value="needs_delivery"
                defaultChecked
                required
              />
              I need help with delivery (no truck or cannot move large items)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="deliveryAbility"
                value="can_pickup"
                required
              />
              I can pick up smaller items if matched nearby
            </label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="hasVehicle" className="rounded border-input" />
              I have access to a vehicle
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="canPickupLargeItems"
                className="rounded border-input"
              />
              I can pick up large items with help
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium">Needed items</h2>
          <p className="text-sm text-muted-foreground">
            Select essential furniture needs. Sleepwell does not show a public
            catalog — coordinators match you with nearby donors.
          </p>
          <div className="space-y-3">
            {FURNITURE_CATEGORIES.map((entry) => (
              <NeedRow key={entry.value} category={entry.value} label={entry.label} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <TextAreaField
            label="Additional notes"
            name="notes"
            placeholder="Anything else coordinators should know."
          />
        </section>

        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Submit request
        </button>
      </form>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: Readonly<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function NeedRow({
  category,
  label,
}: Readonly<{
  category: string;
  label: string;
}>) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
      <label className="flex min-w-[10rem] items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="needCategory"
          value={category}
          className="rounded border-input"
        />
        {label}
      </label>
      <Field
        label="Qty"
        name={`needQuantity_${category}`}
        type="number"
        min={1}
        max={10}
        defaultValue="1"
        compact
      />
      <Field
        label="Size"
        name={`needSize_${category}`}
        placeholder="e.g. queen"
        compact
      />
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  hint,
  placeholder,
  autoComplete,
  min,
  max,
  maxLength,
  defaultValue,
  compact,
}: Readonly<{
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  autoComplete?: string;
  min?: number;
  max?: number;
  maxLength?: number;
  defaultValue?: string;
  compact?: boolean;
}>) {
  return (
    <div className={compact ? "min-w-[5rem]" : undefined}>
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        min={min}
        max={max}
        maxLength={maxLength}
        defaultValue={defaultValue}
        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none ring-ring focus-visible:ring-2"
      />
      {hint && !compact && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function SelectField({
  label,
  name,
  required,
  defaultValue,
  children,
}: Readonly<{
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  children: React.ReactNode;
}>) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none ring-ring focus-visible:ring-2"
      >
        {children}
      </select>
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
        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none ring-ring focus-visible:ring-2"
      />
    </div>
  );
}
