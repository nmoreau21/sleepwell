"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function getAuthRedirectUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set");
  }
  return `${appUrl.replace(/\/$/, "")}/auth/callback`;
}

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    redirect("/login?error=missing_email");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
      // App user must be pre-provisioned with admin role; callback enforces access.
      shouldCreateUser: true,
    },
  });

  if (error) {
    redirect(`/login?error=send_failed`);
  }

  redirect("/login?message=check_email");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?message=signed_out");
}
