import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("session")?.value;
  const isAuthenticated = sessionCookie === "true";

  const { pathname } = request.nextUrl;

  const protectedRoutes = [
    "/dashboard",
    "/complete-registration",
    "/list-property",
    "/profile",
  ];

  const authRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/add-role",
    "/company/new",
  ];

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  console.log(isAuthenticated);

  if (isProtectedRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (isAuthRoute) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/complete-registration/:path*",
    "/list-property/:path*",
    "/profile/:path*",

    "/login/:path*",
    "/register/:path*",
    "/forgot-password/:path*",
    "/add-role/:path*",
    "/company/new/:path*",
  ],
};
