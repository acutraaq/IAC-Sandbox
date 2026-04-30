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
  // SSO on hold — return a fixed identity so deployedBy is always populated
  return { upn: "demo@sandbox.local", displayName: "Demo User" };
}
