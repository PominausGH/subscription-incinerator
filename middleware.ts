import { auth } from "@/lib/auth-edge";
import { NextResponse } from "next/server";

// Public API routes that don't require authentication
const publicApiRoutes = [
  "/api/health",
  "/api/auth",
  "/api/stripe/webhook",
  "/api/email/checklist-signup",
  "/api/unsubscribe",
  "/api/household/invite/accept",
];

// Redirects must be built from the trusted public app URL, not req.url -
// behind the reverse proxy, req.url reflects the container's internal
// bind address (e.g. 0.0.0.0:3000) rather than the real public host.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Redirect authenticated users away from login page to dashboard
  if (pathname === "/login" && req.auth) {
    return NextResponse.redirect(new URL("/dashboard", APP_URL));
  }

  // Check if this is an API route
  if (pathname.startsWith("/api/")) {
    // Allow public API routes
    const isPublicApi = publicApiRoutes.some((route) =>
      pathname.startsWith(route)
    );
    if (isPublicApi) {
      return NextResponse.next();
    }

    // All other API routes require authentication
    if (!req.auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.next();
  }

  // Protected page routes that require authentication
  const protectedPages = [
    "/dashboard",
    "/subscriptions",
    "/settings",
    "/import",
  ];

  const isProtectedPage = protectedPages.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedPage && !req.auth) {
    const signInUrl = new URL("/login", APP_URL);
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
