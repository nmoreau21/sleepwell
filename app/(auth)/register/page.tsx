import Link from "next/link";

import { registerWithPassword } from "@/actions/auth";

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Enter your email and password.",
  weak_password: "Password must be at least 8 characters.",
  password_mismatch: "Passwords do not match.",
  email_taken: "An account with this email already exists. Sign in instead.",
  signup_failed: "Could not create your account. Try again or contact support.",
};

const INFO_MESSAGES: Record<string, string> = {
  check_email:
    "Check your email to confirm your account, then sign in. Admin access still requires coordinator provisioning.",
};

export default async function RegisterPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ error?: string; message?: string }>;
}>) {
  const params = await searchParams;
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : null;
  const infoMessage = params.message ? INFO_MESSAGES[params.message] : null;

  return (
    <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
      <div className="mb-6">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Sleepwell
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Coordinator registration
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create an account with email and password. After email confirmation,
          authorized coordinators can access the admin dashboard.
        </p>
      </div>

      {errorMessage && (
        <div
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {infoMessage && (
        <div
          className="mb-4 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
          role="status"
        >
          {infoMessage}
        </div>
      )}

      <form action={registerWithPassword} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none ring-ring focus-visible:ring-2"
            placeholder="coordinator@example.org"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none ring-ring focus-visible:ring-2"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none ring-ring focus-visible:ring-2"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
