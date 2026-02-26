import { auth } from "@/lib/auth-edge";
import { NextResponse } from "next/server";

// Public API routes that don't require authentication
const publicApiRoutes = [
  "/api/health",
  "/api/auth",
  "/api/stripe/webhook",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Redirect authenticated users away from login page to dashboard
  if (pathname === "/login" && req.auth) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
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
