import { NextResponse } from "next/server";
import { createClientFromServer as createClient } from "@affilhomes/shared/supabase/server";

function safeNext(value: string | null, origin: string): string {
  if (!value || !value.startsWith("/")) return "/";
  try {
    const target = new URL(value, origin);
    return target.origin === origin ? target.pathname + target.search : "/";
  } catch {
    return "/";
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"), url.origin);

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
