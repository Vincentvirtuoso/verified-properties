import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  const protectedRoutes = [
    "/dashboard",
    "/company",
    "/list-property",
    "/profile",
    "/complete-registration",
    "/welcome",
    "/add-role",
    "/my-listings",
    "/admin",
    "/enquiries",
    "/saved-properties",
  ];

  const authRoutes = ["/login", "/register", "/forgot-password"];

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/company/:path*",
    "/complete-registration/:path*",
    "/welcome/:path*",
    "/list-property/:path*",
    "/profile/:path*",
    "/login/:path*",
    "/register/:path*",
    "/forgot-password/:path*",
    "/add-role/:path*",
    "/my-listings/:path*",
    "/admin/:path*",
    "/enquiries/:path*",
    "/saved-properties/:path*",
  ],
};