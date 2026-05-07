import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionCookie, SESSION_COOKIE_NAME } from "./lib/auth-core";

function isPublic(path: string): boolean {
  if (path === "/login") return true;
  if (path.startsWith("/api/auth/")) return true;
  if (path.startsWith("/api/healthz/")) return true;
  if (path === "/api/healthz") return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (isPublic(path)) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue);

  if (!session) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(redirectUrl, { status: 302 });
  }

  return NextResponse.next();
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
