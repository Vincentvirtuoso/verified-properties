import { createBrowserClient } from "@supabase/ssr";
import { cookieOptions } from "@affilhomes/shared/supabase/cookies";

const adminCookieOptions = { ...cookieOptions, name: "sb-admin-auth-token" };

export function createAdminBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: adminCookieOptions },
  );
}
