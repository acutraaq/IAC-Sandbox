import {
  ConfidentialClientApplication,
  type AuthenticationResult,
} from "@azure/msal-node";
import crypto from "node:crypto";

export const AUTH_STATE_COOKIE = "iac_auth_pending";
export const AUTH_STATE_TTL_SECONDS = 5 * 60;

export interface PendingAuthState {
  state: string;
  verifier: string;
  next: string;
}

export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
}

export function encodePendingState(pending: PendingAuthState): string {
  return Buffer.from(JSON.stringify(pending)).toString("base64url");
}

export function decodePendingState(
  value: string | undefined | null
): PendingAuthState | null {
  if (!value) return null;
  try {
    const obj = JSON.parse(
      Buffer.from(value, "base64url").toString("utf-8")
    ) as unknown;
    if (
      typeof obj !== "object" ||
      obj === null ||
      typeof (obj as Record<string, unknown>).state !== "string" ||
      typeof (obj as Record<string, unknown>).verifier !== "string" ||
      typeof (obj as Record<string, unknown>).next !== "string"
    )
      return null;
    return obj as PendingAuthState;
  } catch {
    return null;
  }
}

function getMsalClient(): ConfidentialClientApplication {
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
  const tenantId = process.env.AZURE_TENANT_ID;
  if (!clientId || !clientSecret || !tenantId) {
    throw new Error(
      "MSAL not configured: AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, and AZURE_TENANT_ID must be set"
    );
  }
  return new ConfidentialClientApplication({
    auth: {
      clientId,
      clientSecret,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    },
  });
}

export async function buildAuthCodeUrl(params: {
  state: string;
  codeChallenge: string;
  redirectUri: string;
}): Promise<string> {
  return getMsalClient().getAuthCodeUrl({
    scopes: ["openid", "profile", "email"],
    redirectUri: params.redirectUri,
    responseMode: "query",
    state: params.state,
    codeChallenge: params.codeChallenge,
    codeChallengeMethod: "S256",
  });
}

export async function acquireTokenByCode(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<AuthenticationResult> {
  const result = await getMsalClient().acquireTokenByCode({
    code: params.code,
    scopes: ["openid", "profile", "email"],
    redirectUri: params.redirectUri,
    codeVerifier: params.codeVerifier,
  });
  if (!result) throw new Error("acquireTokenByCode returned null");
  return result;
}
