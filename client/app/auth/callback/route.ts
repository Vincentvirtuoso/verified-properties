import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing URL for Supabase email links (sign-up confirmation and
 * password recovery). Exchanges the one-time code for a session cookie,
 * then redirects to a same-site path given in ?next=.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/dashboard";

  // Only allow relative, same-origin redirects.
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  const loginUrl = new URL("/login", url.origin);
  loginUrl.searchParams.set("error", "link_invalid_or_expired");
  return NextResponse.redirect(loginUrl);
}
