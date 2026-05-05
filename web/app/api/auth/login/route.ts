import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import {
  generatePkce,
  buildAuthCodeUrl,
  encodePendingState,
  AUTH_STATE_COOKIE,
  AUTH_STATE_TTL_SECONDS,
} from "@/lib/msal";

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\"))
    return "/";
  return raw;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"));
  const redirectUri = `${url.origin}/api/auth/callback/azure-ad`;

  const state = crypto.randomBytes(16).toString("base64url");
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
}
