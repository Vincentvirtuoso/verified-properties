import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/pending",
  "/rejected",
  "/suspended",
  "/unauthorized",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );
}

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  const { pathname } = req.nextUrl;

  const redirectTo = (path: string, searchParams?: Record<string, string>) => {
    const url = req.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    if (searchParams) {
      for (const [k, v] of Object.entries(searchParams)) {
        url.searchParams.set(k, v);
      }
    }
    const redirect = NextResponse.redirect(url);
    // Preserve any refreshed auth cookies on the redirect response.
    for (const cookie of res.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  };

  if (!user && !isPublic(pathname)) {
    return redirectTo("/login", { next: pathname + req.nextUrl.search });
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    return redirectTo("/dashboard");
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
