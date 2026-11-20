import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@affilhomes/shared/supabase/middleware";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/company",
  "/list-property",
  "/profile",
  "/complete-registration",
  "/welcome",
  "/add-role",
  "/my-listings",
  "/enquiries",
  "/saved-properties",
  "/verification",
];

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

function matches(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function safeCallback(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  const redirectTo = (path: string, params?: Record<string, string>) => {
    const url = new URL(path, request.url);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  };

  const isProtectedRoute = matches(pathname, PROTECTED_ROUTES);
  const isAuthRoute = matches(pathname, AUTH_ROUTES);

  if (isProtectedRoute && !user) {
    return redirectTo("/login", { callbackUrl: pathname + search });
  }

  if (isAuthRoute && user) {
    const cb = safeCallback(request.nextUrl.searchParams.get("callbackUrl"));
    return redirectTo(cb ?? "/dashboard");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|.*\\.[a-z0-9]+$).*)",
  ],
};
