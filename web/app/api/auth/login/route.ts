import { NextResponse } from "next/server";
import { createSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth";

const PLACEHOLDER_USER = {
  upn: "demo@sandbox.local",
  displayName: "Demo User",
} as const;

export async function POST() {
  const value = await createSessionCookie(PLACEHOLDER_USER);
  const res = NextResponse.json({ user: PLACEHOLDER_USER }, { status: 200 });
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
  });
  return res;
}
