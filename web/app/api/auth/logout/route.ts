import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { secureCookieFlag } from "@/lib/auth-core";

export async function POST() {
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: secureCookieFlag(),
    maxAge: 0,
  });
  return res;
}
