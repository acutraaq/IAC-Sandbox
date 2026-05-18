import { NextRequest, NextResponse } from "next/server";
import {
  generatePkce,
  buildAuthCodeUrl,
  encodePendingState,
  AUTH_STATE_COOKIE,
  AUTH_STATE_TTL_SECONDS,
} from "@/lib/msal";
import { createSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth-core";

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\"))
    return "/";
  return raw;
}

function msalConfigured(): boolean {
  return Boolean(
    process.env.AZURE_AD_CLIENT_ID &&
      process.env.AZURE_AD_CLIENT_SECRET &&
      process.env.AZURE_TENANT_ID
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = request.nextUrl;
    const next = safeNext(url.searchParams.get("next"));

    // If MSAL is not configured, fall back to placeholder stub login
    if (!msalConfigured()) {
      const token = await createSessionCookie({
        upn: "demo@sandbox.local",
        displayName: "Demo User",
      });
      const redirectTarget = new URL(next, request.nextUrl.origin);
      const res = NextResponse.redirect(redirectTarget, { status: 302 });
      res.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24,
      });
      return res;
    }

    const redirectUri = `${url.origin}/api/auth/callback/azure-ad`;

    const state = crypto.randomUUID();
    const { verifier, challenge } = generatePkce();

    const authUrl = await buildAuthCodeUrl({ state, codeChallenge: challenge, redirectUri });

    const res = NextResponse.redirect(authUrl, { status: 302 });
    res.cookies.set({
      name: AUTH_STATE_COOKIE,
      value: encodePendingState({ state, verifier, next }),
      httpOnly: true,
      sameSite: "lax",
      path: "/api/auth",
      secure: process.env.NODE_ENV === "production",
      maxAge: AUTH_STATE_TTL_SECONDS,
    });
    return res;
  } catch (err) {
    console.error("[GET /api/auth/login] unhandled error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Login failed" } },
      { status: 500 }
    );
  }
}
