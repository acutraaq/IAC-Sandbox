import { cookies } from "next/headers";
import { z } from "zod";

export const SESSION_COOKIE_NAME = "iac_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24;

export interface SessionUser {
  upn: string;
  displayName: string;
}

const sessionPayloadSchema = z.object({
  upn: z.string().min(1),
  displayName: z.string().min(1),
  exp: z.number().int().positive(),
});

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET is not set or too short");
  }
  return s;
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(payloadJson: string): Promise<string> {
  const key = await importHmacKey(getSecret());
  const sig = new Uint8Array(
    await globalThis.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadJson))
  );
  const payloadEncoded = toBase64Url(new TextEncoder().encode(payloadJson));
  return `${payloadEncoded}.${toBase64Url(sig)}`;
}

export async function createSessionCookie(user: SessionUser): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payloadJson = JSON.stringify({ upn: user.upn, displayName: user.displayName, exp });
  return sign(payloadJson);
}

export async function verifySessionCookie(value: string | undefined | null): Promise<SessionUser | null> {
  if (!value) return null;
  const dot = value.indexOf(".");
  if (dot <= 0 || dot !== value.lastIndexOf(".") || dot === value.length - 1) return null;
  const payloadEncoded = value.slice(0, dot);
  const sigEncoded = value.slice(dot + 1);
  let payloadBytes: Uint8Array<ArrayBuffer>;
  let sigBytes: Uint8Array<ArrayBuffer>;
  try {
    payloadBytes = fromBase64Url(payloadEncoded);
    sigBytes = fromBase64Url(sigEncoded);
  } catch {
    return null;
  }
  const key = await importHmacKey(getSecret());
  const ok = await globalThis.crypto.subtle.verify("HMAC", key, sigBytes, payloadBytes);
  if (!ok) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch {
    return null;
  }
  const result = sessionPayloadSchema.safeParse(parsed);
  if (!result.success) return null;
  if (result.data.exp <= Math.floor(Date.now() / 1000)) return null;
  return { upn: result.data.upn, displayName: result.data.displayName };
}

// Test-only seam: sign an arbitrary payload (used to construct expired cookies in tests).
export async function _signForTest(payloadJson: string): Promise<string> {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("_signForTest must not be called outside of tests");
  }
  return sign(payloadJson);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const c = store.get(SESSION_COOKIE_NAME);
  return verifySessionCookie(c?.value);
}
