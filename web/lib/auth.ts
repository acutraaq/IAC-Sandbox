import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  verifySessionCookie,
  createSessionCookie,
  type SessionUser,
} from "./auth-core";

export {
  SESSION_COOKIE_NAME,
  verifySessionCookie,
  createSessionCookie,
  type SessionUser,
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const value = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionCookie(value);
    if (session) return session;
  } catch {
    // cookies() may throw in non-request contexts (e.g., static generation)
  }
  // Fallback to demo user when SSO is on hold or no valid session exists.
  // The proxy.ts middleware is the actual gate; this fallback ensures the
  // app remains usable for local development without requiring login.
  return { upn: "demo@sandbox.local", displayName: "Demo User" };
}
