import { AdminRole, Role, isAdminRole } from "@affilhomes/shared/types";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "sb-admin-auth-token";

const PUBLIC_ROUTES = [
  "/login",
  "/pending",
  "/rejected",
  "/suspended",
  "/unauthorized",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

type MaybeUser = {
  app_metadata?: Record<string, unknown>;
} | null;

function getRoles(user: MaybeUser): AdminRole[] {
  const raw = user?.app_metadata?.roles;

  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (r): r is AdminRole =>
      typeof r === "string" && (Object.values(Role) as string[]).includes(r),
  );
}

function isAdmin(user: MaybeUser): boolean {
  return getRoles(user).some(isAdminRole);
}

export default async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: ADMIN_COOKIE_NAME },
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => {
          for (const { name, value, options } of list) {
            res.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const getUserWithTimeout = async (timeoutMs = 3000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const { data, error } = await supabase.auth.getUser();
      clearTimeout(timeout);
      if (error) return null;
      return data.user;
    } catch {
      clearTimeout(timeout);
      return null;
    }
  };

  const user = await getUserWithTimeout();

  const redirectTo = (path: string, params?: Record<string, string>) => {
    const url = req.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }
    const redirect = NextResponse.redirect(url);
    for (const cookie of res.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  };

  if (!user) {
    if (isPublic(pathname)) return res;
    return redirectTo("/login", { next: pathname + search });
  }

  if (!isAdmin(user)) {
    if (isPublic(pathname)) return res;
    return redirectTo("/unauthorized");
  }

  if (pathname === "/login") {
    return redirectTo("/");
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|.*\\.[a-z0-9]+$).*)",
  ],
};
