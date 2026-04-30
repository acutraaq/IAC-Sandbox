import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(_request: NextRequest) {
  // SSO on hold — all routes are open
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
