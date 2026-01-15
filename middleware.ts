import { auth } from "@/lib/auth-edge";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // DEV BYPASS: Skip auth in development for testing
  if (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === 'true') {
    return NextResponse.next();
  }

  // Protected routes that require authentication
  const protectedRoutes = [
    "/dashboard",
    "/subscriptions",
    "/settings",
    "/api/subscriptions",
    "/api/reminders",
  ];

  // Check if the current path matches any protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect authenticated users away from login page to dashboard
  if (pathname === "/login" && req.auth) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isProtectedRoute && !req.auth) {
    // Redirect to sign in page if not authenticated
    const signInUrl = new URL("/login", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all paths except static files and images
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
