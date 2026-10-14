import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "sb-admin-auth-token";

const PUBLIC_ROUTES = [
  "/login",
  "/register",
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

export async function proxy(req: NextRequest) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = req.nextUrl;

  const redirectTo = (path: string, searchParams?: Record<string, string>) => {
    const url = req.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    if (searchParams) {
      for (const [key, value] of Object.entries(searchParams)) {
        url.searchParams.set(key, value);
      }
    }
    const redirect = NextResponse.redirect(url);
    // Keep any refreshed admin cookies on the redirect response.
    for (const cookie of res.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  };

  if (!user && !isPublic(pathname)) {
    return redirectTo("/login", { next: pathname + search });
  }

  if (user && pathname === "/login") {
    return redirectTo("/");
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
