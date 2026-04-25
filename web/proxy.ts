import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth";

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
  // Skip the proxy on Next internals, the auth API, healthz, and any path with a file extension
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/healthz|.*\\..*).*)",
  ],
};
