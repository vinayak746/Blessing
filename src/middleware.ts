import { NextRequest, NextResponse } from "next/server";

/**
 * Defense-in-depth middleware.
 *
 * Individual dashboard pages already call `requireAuth()`, so this middleware
 * acts as a safety net — if someone adds a new dashboard page and forgets the
 * auth check, the middleware will still redirect them to /login.
 *
 * We use a lightweight cookie-presence check (better-auth stores a session
 * token cookie). This is NOT a replacement for proper server-side session
 * validation in the page itself — it simply prevents obviously-unauthenticated
 * requests from reaching dashboard routes at all.
 */

// Routes that require authentication (cookie-level gate)
const PROTECTED_PREFIXES = ["/workflows", "/credentials", "/executions", "/newsletter-admin"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only gate dashboard routes
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // better-auth stores session in a cookie named "better-auth.session_token"
  const sessionCookie =
    req.cookies.get("better-auth.session_token") ??
    req.cookies.get("__Secure-better-auth.session_token"); // production may use __Secure- prefix

  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", req.url);
    const fullPath = pathname + (req.nextUrl.search || "");
    loginUrl.searchParams.set("callbackUrl", fullPath);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware only on paths that matter — skip static files, api, _next, etc.
  matcher: [
    "/workflows/:path*",
    "/credentials/:path*",
    "/executions/:path*",
    "/newsletter-admin/:path*",
  ],
};
