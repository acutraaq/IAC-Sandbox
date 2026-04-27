import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  verifySessionCookie,
  createSessionCookie,
  _signForTest,
  type SessionUser,
} from "./auth-core";

export {
  SESSION_COOKIE_NAME,
  verifySessionCookie,
  createSessionCookie,
  _signForTest,
  type SessionUser,
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const c = store.get(SESSION_COOKIE_NAME);
  return verifySessionCookie(c?.value);
}
