import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = [
  "/stories",
  "/dashboard",
  "/account",
  "/admin",
  "/api/stories",
  "/api/pages",
  "/api/stats",
  "/api/drafts",
  "/api/export",
  "/api/account",
  "/api/users",
  "/api/audit",
];
const authPaths = ["/login", "/activate", "/reset-password"];

// Note: this middleware only checks for *presence* of a session token.
// Per-route role enforcement happens inside each API route via
// requirePermission() so inactive users are also rejected there.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuth = authPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuth && token) {
    // Don't auto-redirect away from /activate or /reset-password — users may
    // legitimately want to load those (e.g. admin opens reset link in the
    // same browser where they're already logged in).
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/stories/:path*",
    "/account/:path*",
    "/admin/:path*",
    "/login",
    "/activate",
    "/reset-password",
    "/api/stories/:path*",
    "/api/pages/:path*",
    "/api/stats/:path*",
    "/api/drafts/:path*",
    "/api/export/:path*",
    "/api/account/:path*",
    "/api/users/:path*",
    "/api/audit/:path*",
  ],
};