import Link from "next/link";

import { sendMagicLink } from "@/actions/auth";

const ERROR_MESSAGES: Record<string, string> = {
  missing_email: "Enter your email address.",
  send_failed: "Could not send the sign-in link. Try again or contact support.",
  auth: "Sign-in failed. Request a new magic link.",
  forbidden: "This account is not authorized for admin access.",
  not_provisioned:
    "No coordinator account exists for this email. Contact your Sleepwell administrator.",
};

const INFO_MESSAGES: Record<string, string> = {
  check_email: "Check your email for a sign-in link.",
  signed_out: "You have been signed out.",
};

export default async function LoginPage({
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
          Coordinator sign in
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email to receive a one-time sign-in link. Access is limited
          to authorized Sleepwell coordinators.
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

      <form action={sendMagicLink} className="space-y-4">
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
        <button
          type="submit"
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Send magic link
        </button>
      </form>
    </div>
  );
}
