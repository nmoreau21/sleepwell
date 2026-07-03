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

export async function registerWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!email || !password) {
    redirect("/register?error=missing_fields");
  }

  if (password.length < 8) {
    redirect("/register?error=weak_password");
  }

  if (password !== confirmPassword) {
    redirect("/register?error=password_mismatch");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("already registered") || message.includes("already exists")) {
      redirect("/register?error=email_taken");
    }
    redirect("/register?error=signup_failed");
  }

  redirect("/register?message=check_email");
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
