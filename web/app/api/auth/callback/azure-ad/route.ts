import { NextRequest, NextResponse } from "next/server";
import {
  decodePendingState,
  acquireTokenByCode,
  AUTH_STATE_COOKIE,
} from "@/lib/msal";
import {
  createSessionCookie,
  SESSION_COOKIE_NAME,
} from "@/lib/auth-core";

function safeNext(raw: string): string {
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\"))
    return "/";
  return raw;
}

function clearPendingCookie(res: NextResponse): void {
  res.cookies.set({
    name: AUTH_STATE_COOKIE,
    value: "",
    maxAge: 0,
    path: "/api/auth",
    httpOnly: true,
    sameSite: "lax",
  });
}

function failRedirect(base: URL): NextResponse {
  const res = NextResponse.redirect(new URL("/login?error=auth_failed", base), {
    status: 302,
  });
  clearPendingCookie(res);
  return res;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const pendingRaw = request.cookies.get(AUTH_STATE_COOKIE)?.value;
  const pending = decodePendingState(pendingRaw);

  if (!pending || !code || !returnedState || returnedState !== pending.state) {
    return failRedirect(url);
  }

  try {
    const redirectUri = `${url.origin}/api/auth/callback/azure-ad`;
    const result = await acquireTokenByCode({
      code,
      codeVerifier: pending.verifier,
      redirectUri,
    });

    const upn = result.account?.username;
    if (!upn) throw new Error("No UPN in token result");
    const displayName = result.account?.name ?? upn;

    const sessionValue = await createSessionCookie({ upn, displayName });

    const dest = new URL(safeNext(pending.next), url.origin);
    const res = NextResponse.redirect(dest, { status: 302 });
    clearPendingCookie(res);
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionValue,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
    });
    return res;
  } catch {
    return failRedirect(url);
  }
}
