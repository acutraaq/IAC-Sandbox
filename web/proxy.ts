import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth-core";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public paths
  if (path === "/login" || path.startsWith("/api/auth/") || path === "/api/healthz") {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookie);
  if (session) {
    return NextResponse.next();
  }

  const next = path + (request.nextUrl.search || "");
  const loginUrl = new URL("/login", request.nextUrl);
  loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Skip the proxy on Next internals, the auth API, healthz, and static files
  // (paths whose final segment contains a dot, e.g. /robots.txt, /file.png).
  // The trailing `[^/]+\.[^/]+$` is anchored to the end of the path so that
  // route paths like /foo.bar/page still go through the gate.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/auth|api/healthz|.*[^/]+\\.[^/]+$).*)",
  ],
};
