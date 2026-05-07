async function importHmacKey(secret: string): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

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

async function sign(payloadJson: string): Promise<string> {
  const key = await importHmacKey(getSecret());
  const sig = new Uint8Array(
    await globalThis.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadJson))
  );
  const payloadEncoded = toBase64Url(new TextEncoder().encode(payloadJson));
  return `${payloadEncoded}.${toBase64Url(sig)}`;
}

export async function _signForTest(payloadJson: string): Promise<string> {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("_signForTest must not be called outside of tests");
  }
  return sign(payloadJson);
}
