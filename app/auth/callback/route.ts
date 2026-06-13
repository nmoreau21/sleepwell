import { NextResponse } from "next/server";

import { userHasAdminRole } from "@/lib/auth/roles";
import { resolveAppUserFromAuth } from "@/lib/auth/link-user";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const appUser = await resolveAppUserFromAuth(authUser);

  if (!appUser || !(await userHasAdminRole(appUser.id))) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=forbidden`);
  }

  return NextResponse.redirect(`${origin}/admin`);
}
