# Login Placeholder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a login page that gates all protected routes via Next.js 16 `proxy.ts`. The login button is a click-through stub today (sets a signed session cookie carrying `demo@sandbox.local`) but is wired so swapping in MSAL is a one-file change to `web/lib/auth.ts`.

**Architecture:**
- A single identity module `web/lib/auth.ts` exposes `getCurrentUser()`, `createSessionCookie(user)`, `verifySessionCookie(value)`, `SESSION_COOKIE_NAME`. Today it returns the demo user from a signed cookie. After SSO ships it will read MSAL claims — no caller changes.
- `web/proxy.ts` checks the session cookie on every request and redirects unauthenticated users to `/login?next=<path>`. Public paths: `/login`, `/api/auth/*`, `/api/healthz`, `_next/*`, static assets.
- `/api/auth/login` (POST) sets the cookie. `/api/auth/logout` (POST) clears it. The login page calls `/api/auth/login` then client-side navigates to the `next` query param.
- HMAC-SHA256 over the JSON payload using `SESSION_SECRET` env var (Web Crypto API, Edge-compatible). Cookie value: `<base64url(payload)>.<base64url(sig)>`.
- `deployedBy` continues to be the constant `demo@sandbox.local` everywhere it is currently hardcoded — this plan does NOT plumb session identity through to ARM tags. That swap happens together with the real SSO implementation.

**Tech Stack:**
- Next.js 16.2.3 (App Router, `proxy.ts` convention)
- React 19, TypeScript strict
- Web Crypto API (`globalThis.crypto.subtle`) for HMAC — Edge-compatible
- Zod for env + cookie payload validation
- Vitest + React Testing Library
- Tailwind v4 + IBM Plex Sans (existing design system)

---

## File Structure

| Path | Status | Responsibility |
|------|--------|----------------|
| `web/lib/auth.ts` | Create | Single source of identity. `getCurrentUser`, `createSessionCookie`, `verifySessionCookie`, `clearSessionCookie`, `SESSION_COOKIE_NAME`. Web Crypto HMAC. The file MSAL replaces. |
| `web/lib/server-env.ts` | Modify | Add `SESSION_SECRET` to Zod schema. |
| `web/proxy.ts` | Create | Route gating. Reads cookie via `request.cookies`, redirects to `/login?next=<path>` when missing/invalid. |
| `web/app/login/page.tsx` | Create | Login UI: Microsoft logo + "Sign in with Microsoft" stub button. Reads `?next=` query param. |
| `web/app/login/LoginButton.tsx` | Create | Client component: POSTs `/api/auth/login`, then `router.replace(nextPath)`. |
| `web/app/api/auth/login/route.ts` | Create | POST: builds session for `demo@sandbox.local`, sets HTTP-only cookie, returns 200. |
| `web/app/api/auth/logout/route.ts` | Create | POST: clears the cookie, returns 200. |
| `web/components/layout/Navbar.tsx` | Modify | Replace static "SB" avatar with a user menu (displayName + Sign out). Hidden on `/login`. |
| `web/components/layout/UserMenu.tsx` | Create | Client component with avatar dropdown, user name, Sign out button. |
| `web/__tests__/lib/auth.test.ts` | Create | HMAC create/verify, tamper detection, expiry, malformed input. |
| `web/__tests__/proxy.test.ts` | Create | Gating logic: protected vs public path, cookie present vs absent vs invalid, `next` param preservation. |
| `web/__tests__/app/login/page.test.tsx` | Create | Renders heading + button; respects `next` query param. |
| `web/__tests__/app/api/auth/login.test.ts` | Create | Sets cookie with correct attributes. |
| `web/__tests__/app/api/auth/logout.test.ts` | Create | Clears cookie. |
| `web/__tests__/components/layout/UserMenu.test.tsx` | Create | Shows name; clicking Sign out calls logout API and redirects. |
| `CLAUDE.md` | Modify | Document new env var (`SESSION_SECRET`), `/login` flow, and the "one-file MSAL swap" contract. |
| `.env.example` (`web/`) | Create or modify | Add `SESSION_SECRET=<random>` placeholder. |

> **No schema changes** to `web/lib/deployments/schema.ts` or `functions/.../deployment.schema.ts` are needed. `deployedBy` stays a constant in this phase.

---

## Implementation Notes (read before Task 1)

- **Edge compatibility.** `proxy.ts` runs on the Edge runtime. Use Web Crypto only — no `node:crypto`, no `Buffer`. Use `crypto.subtle.sign` / `crypto.subtle.verify` and `TextEncoder`. Encode bytes with `btoa(String.fromCharCode(...))` → then convert to base64url (`replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")`).
- **Cookie shape.** `value = base64url(JSON.stringify({ upn, displayName, exp })) + "." + base64url(hmac)`. `exp` is a Unix seconds integer (24 h). Reject when `exp <= now`, when there is no dot, when payload JSON does not parse, or when HMAC does not match.
- **Public path matcher.** Skip the proxy entirely for paths starting with `/api/`, `/_next/`, `/login`, and any path containing a `.` (static asset). Use the `config.matcher` to exclude these so the function does not run at all on them.
- **`next` redirect target.** Only honor `next` values that start with `/` and do not start with `//` or `/\\` (avoid open-redirects). Default `next` is `/`.
- **Cookie attributes.** `httpOnly: true`, `sameSite: "lax"`, `path: "/"`, `secure: process.env.NODE_ENV === "production"`, `maxAge: 60 * 60 * 24` (24 h).
- **Test runtime.** Tests use jsdom + Node 22, both of which expose `globalThis.crypto.subtle`.
- **Run all `npm`/`npx` commands from `web/`.** This whole plan operates inside `web/`.

---

## Task 1: Add `SESSION_SECRET` env var to schema

**Files:**
- Modify: `web/lib/server-env.ts`
- Create: `web/.env.example`

- [ ] **Step 1: Update `web/lib/server-env.ts`**

```ts
import { z } from "zod";

const envSchema = z.object({
  AZURE_SUBSCRIPTION_ID: z.string().min(1, "AZURE_SUBSCRIPTION_ID is required"),
  AZURE_TENANT_ID: z.string().min(1, "AZURE_TENANT_ID is required"),
  AZURE_STORAGE_CONNECTION_STRING: z.string().min(1, "AZURE_STORAGE_CONNECTION_STRING is required"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${formatted}`);
}

export const serverEnv = parsed.data;
```

- [ ] **Step 2: Create `web/.env.example`**

```
AZURE_SUBSCRIPTION_ID=00000000-0000-0000-0000-000000000000
AZURE_TENANT_ID=00000000-0000-0000-0000-000000000000
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net
# >= 32 chars. Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=replace_me_with_a_32_plus_char_random_value_xxxx
```

- [ ] **Step 3: Verify type-check still passes**

Run from `web/`: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add web/lib/server-env.ts web/.env.example
git commit -m "feat(auth): add SESSION_SECRET env var for placeholder login"
```

---

## Task 2: Implement `lib/auth.ts` with HMAC sign/verify (TDD)

**Files:**
- Create: `web/lib/auth.ts`
- Test: `web/__tests__/lib/auth.test.ts`

- [ ] **Step 1: Write failing test file**

```ts
// web/__tests__/lib/auth.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  process.env.SESSION_SECRET = "test_secret_at_least_32_chars_long_xxxxx";
});

async function load() {
  return await import("@/lib/auth");
}

describe("auth: createSessionCookie / verifySessionCookie", () => {
  it("round-trips a valid user", async () => {
    const { createSessionCookie, verifySessionCookie } = await load();
    const value = await createSessionCookie({
      upn: "demo@sandbox.local",
      displayName: "Demo User",
    });
    const session = await verifySessionCookie(value);
    expect(session?.upn).toBe("demo@sandbox.local");
    expect(session?.displayName).toBe("Demo User");
  });

  it("rejects a tampered payload", async () => {
    const { createSessionCookie, verifySessionCookie } = await load();
    const value = await createSessionCookie({
      upn: "demo@sandbox.local",
      displayName: "Demo User",
    });
    const [, sig] = value.split(".");
    const tampered =
      btoa('{"upn":"attacker@evil.com","displayName":"x","exp":' +
        (Math.floor(Date.now() / 1000) + 3600) + "}")
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") +
      "." + sig;
    expect(await verifySessionCookie(tampered)).toBeNull();
  });

  it("rejects a malformed cookie (no dot)", async () => {
    const { verifySessionCookie } = await load();
    expect(await verifySessionCookie("not-a-cookie")).toBeNull();
  });

  it("rejects an expired cookie", async () => {
    process.env.SESSION_SECRET = "test_secret_at_least_32_chars_long_xxxxx";
    const { _signForTest, verifySessionCookie } = await load() as typeof import("@/lib/auth") & {
      _signForTest: (payloadJson: string) => Promise<string>;
    };
    const expired = JSON.stringify({
      upn: "demo@sandbox.local",
      displayName: "Demo User",
      exp: Math.floor(Date.now() / 1000) - 1,
    });
    const value = await _signForTest(expired);
    expect(await verifySessionCookie(value)).toBeNull();
  });

  it("rejects a cookie signed with a different secret", async () => {
    const { createSessionCookie } = await load();
    const value = await createSessionCookie({
      upn: "demo@sandbox.local",
      displayName: "Demo User",
    });
    process.env.SESSION_SECRET = "different_secret_at_least_32_chars_yyyyy";
    vi.resetModules();
    const { verifySessionCookie } = await import("@/lib/auth");
    expect(await verifySessionCookie(value)).toBeNull();
  });
});

describe("auth: SESSION_COOKIE_NAME", () => {
  it("exports a stable cookie name", async () => {
    const { SESSION_COOKIE_NAME } = await load();
    expect(SESSION_COOKIE_NAME).toBe("iac_session");
  });
});
```

- [ ] **Step 2: Run test, confirm it fails**

Run from `web/`: `npx vitest run __tests__/lib/auth.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `web/lib/auth.ts`**

```ts
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

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
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
  if (dot <= 0 || dot === value.length - 1) return null;
  const payloadEncoded = value.slice(0, dot);
  const sigEncoded = value.slice(dot + 1);
  let payloadBytes: Uint8Array;
  let sigBytes: Uint8Array;
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
  return sign(payloadJson);
}
```

- [ ] **Step 4: Run tests, confirm pass**

Run from `web/`: `npx vitest run __tests__/lib/auth.test.ts`
Expected: 6 passing.

- [ ] **Step 5: Run full type-check**

Run from `web/`: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add web/lib/auth.ts web/__tests__/lib/auth.test.ts
git commit -m "feat(auth): HMAC-signed session cookie helpers (Web Crypto)"
```

---

## Task 3: Implement `getCurrentUser()` server helper (TDD)

**Files:**
- Modify: `web/lib/auth.ts`
- Test: `web/__tests__/lib/auth.test.ts`

- [ ] **Step 1: Append failing test**

Add to `web/__tests__/lib/auth.test.ts`:

```ts
import { vi as vi2 } from "vitest";

vi2.mock("next/headers", () => ({
  cookies: vi2.fn(),
}));

describe("auth: getCurrentUser", () => {
  it("returns null when no session cookie is present", async () => {
    const { cookies } = await import("next/headers");
    (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      get: () => undefined,
    });
    const { getCurrentUser } = await load();
    expect(await getCurrentUser()).toBeNull();
  });

  it("returns the session user when a valid cookie is present", async () => {
    const { createSessionCookie } = await load();
    const value = await createSessionCookie({
      upn: "demo@sandbox.local",
      displayName: "Demo User",
    });
    const { cookies } = await import("next/headers");
    (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      get: (name: string) =>
        name === "iac_session" ? { name, value } : undefined,
    });
    const { getCurrentUser } = await load();
    const user = await getCurrentUser();
    expect(user).toEqual({ upn: "demo@sandbox.local", displayName: "Demo User" });
  });
});
```

- [ ] **Step 2: Run test, confirm it fails**

Run: `npx vitest run __tests__/lib/auth.test.ts`
Expected: 2 new tests fail — `getCurrentUser` not exported.

- [ ] **Step 3: Append implementation to `web/lib/auth.ts`**

Add at the bottom:

```ts
import { cookies } from "next/headers";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const c = store.get(SESSION_COOKIE_NAME);
  return verifySessionCookie(c?.value);
}
```

> Move the `import { cookies } from "next/headers"` to the top of the file alongside the other imports. The bottom-of-file shown above is for diff clarity only.

- [ ] **Step 4: Run tests, confirm pass**

Run: `npx vitest run __tests__/lib/auth.test.ts`
Expected: 8 passing.

- [ ] **Step 5: Commit**

```bash
git add web/lib/auth.ts web/__tests__/lib/auth.test.ts
git commit -m "feat(auth): getCurrentUser reads signed session cookie"
```

---

## Task 4: Implement `POST /api/auth/login` (TDD)

**Files:**
- Create: `web/app/api/auth/login/route.ts`
- Test: `web/__tests__/app/api/auth/login.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// web/__tests__/app/api/auth/login.test.ts
import { describe, it, expect, beforeEach } from "vitest";

beforeEach(() => {
  process.env.SESSION_SECRET = "test_secret_at_least_32_chars_long_xxxxx";
});

describe("POST /api/auth/login", () => {
  it("sets the session cookie and returns the user", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toEqual({
      upn: "demo@sandbox.local",
      displayName: "Demo User",
    });
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie!).toMatch(/iac_session=/);
    expect(setCookie!).toMatch(/HttpOnly/i);
    expect(setCookie!).toMatch(/SameSite=lax/i);
    expect(setCookie!).toMatch(/Path=\//);
  });
});
```

- [ ] **Step 2: Run test, confirm it fails**

Run: `npx vitest run __tests__/app/api/auth/login.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the route**

```ts
// web/app/api/auth/login/route.ts
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
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `npx vitest run __tests__/app/api/auth/login.test.ts`
Expected: 1 passing.

- [ ] **Step 5: Commit**

```bash
git add web/app/api/auth/login/route.ts web/__tests__/app/api/auth/login.test.ts
git commit -m "feat(auth): POST /api/auth/login sets session cookie"
```

---

## Task 5: Implement `POST /api/auth/logout` (TDD)

**Files:**
- Create: `web/app/api/auth/logout/route.ts`
- Test: `web/__tests__/app/api/auth/logout.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// web/__tests__/app/api/auth/logout.test.ts
import { describe, it, expect, beforeEach } from "vitest";

beforeEach(() => {
  process.env.SESSION_SECRET = "test_secret_at_least_32_chars_long_xxxxx";
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie", async () => {
    const { POST } = await import("@/app/api/auth/logout/route");
    const res = await POST();
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie!).toMatch(/iac_session=/);
    expect(setCookie!).toMatch(/Max-Age=0/i);
  });
});
```

- [ ] **Step 2: Run test, confirm it fails**

Run: `npx vitest run __tests__/app/api/auth/logout.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the route**

```ts
// web/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  return res;
}
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `npx vitest run __tests__/app/api/auth/logout.test.ts`
Expected: 1 passing.

- [ ] **Step 5: Commit**

```bash
git add web/app/api/auth/logout/route.ts web/__tests__/app/api/auth/logout.test.ts
git commit -m "feat(auth): POST /api/auth/logout clears session cookie"
```

---

## Task 6: Implement `web/proxy.ts` route gate (TDD)

**Files:**
- Create: `web/proxy.ts`
- Test: `web/__tests__/proxy.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// web/__tests__/proxy.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSessionCookie } from "@/lib/auth";

beforeEach(() => {
  process.env.SESSION_SECRET = "test_secret_at_least_32_chars_long_xxxxx";
});

function makeReq(url: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(new URL(url, "http://localhost:3000"));
  for (const [k, v] of Object.entries(cookies)) req.cookies.set(k, v);
  return req;
}

describe("proxy", () => {
  it("redirects an unauthenticated user from /templates to /login?next=/templates", async () => {
    const { proxy } = await import("@/proxy");
    const res = await proxy(makeReq("/templates"));
    expect(res.status).toBe(307);
    const loc = res.headers.get("location");
    expect(loc).toMatch(/\/login\?next=%2Ftemplates$/);
  });

  it("preserves query string when redirecting", async () => {
    const { proxy } = await import("@/proxy");
    const res = await proxy(makeReq("/templates?cat=compute"));
    const loc = res.headers.get("location")!;
    expect(decodeURIComponent(loc)).toContain("next=/templates?cat=compute");
  });

  it("does NOT redirect when a valid session cookie is present", async () => {
    const cookieValue = await createSessionCookie({
      upn: "demo@sandbox.local",
      displayName: "Demo User",
    });
    const { proxy } = await import("@/proxy");
    const res = await proxy(makeReq("/templates", { iac_session: cookieValue }));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("does NOT redirect when path is /login", async () => {
    const { proxy } = await import("@/proxy");
    const res = await proxy(makeReq("/login"));
    expect(res.status).toBe(200);
  });

  it("redirects to /login when session cookie is invalid", async () => {
    const { proxy } = await import("@/proxy");
    const res = await proxy(makeReq("/", { iac_session: "garbage.value" }));
    expect(res.status).toBe(307);
  });
});
```

- [ ] **Step 2: Run test, confirm it fails**

Run: `npx vitest run __tests__/proxy.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the proxy**

```ts
// web/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public paths
  if (path === "/login" || path.startsWith("/api/auth/") || path === "/api/healthz") {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookie);
  if (session) {
    return NextResponse.next();
  }

  const next = path + (request.nextUrl.search || "");
  const loginUrl = new URL("/login", request.nextUrl);
  loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Skip the proxy on Next internals, the auth API, healthz, and any path with a file extension
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/healthz|.*\\..*).*)",
  ],
};
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `npx vitest run __tests__/proxy.test.ts`
Expected: 5 passing.

- [ ] **Step 5: Run full suite**

Run: `npx vitest run`
Expected: all green (existing tests untouched).

- [ ] **Step 6: Commit**

```bash
git add web/proxy.ts web/__tests__/proxy.test.ts
git commit -m "feat(auth): add proxy.ts gating protected routes"
```

---

## Task 7: Implement `/login` page (TDD)

**Files:**
- Create: `web/app/login/page.tsx`
- Create: `web/app/login/LoginButton.tsx`
- Test: `web/__tests__/app/login/page.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// web/__tests__/app/login/page.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/login/page";

const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams("next=/templates"),
}));

beforeEach(() => {
  replaceMock.mockClear();
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);
});

describe("LoginPage", () => {
  it("renders heading and Microsoft sign-in button", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: /sandbox iac/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in with microsoft/i })).toBeInTheDocument();
  });

  it("calls /api/auth/login and navigates to next on click", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(screen.getByRole("button", { name: /sign in with microsoft/i }));
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({ method: "POST" }));
      expect(replaceMock).toHaveBeenCalledWith("/templates");
    });
  });

  it("falls back to '/' when next is missing or unsafe", async () => {
    const user = userEvent.setup();
    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ replace: replaceMock }),
      useSearchParams: () => new URLSearchParams("next=//evil.com"),
    }));
    vi.resetModules();
    const Mod = await import("@/app/login/page");
    render(<Mod.default />);
    await user.click(screen.getByRole("button", { name: /sign in with microsoft/i }));
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/"));
  });
});
```

- [ ] **Step 2: Run test, confirm it fails**

Run: `npx vitest run __tests__/app/login/page.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `LoginButton.tsx`**

```tsx
// web/app/login/LoginButton.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function safeNext(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  return raw;
}

export function LoginButton() {
  const router = useRouter();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST" });
      if (!res.ok) throw new Error("login failed");
      router.replace(safeNext(params.get("next")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex w-full items-center justify-center gap-3 rounded-md bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
      aria-busy={busy}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 21 21"
        className="h-5 w-5"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
      </svg>
      <span>Sign in with Microsoft</span>
    </button>
  );
}
```

- [ ] **Step 4: Implement `page.tsx`**

```tsx
// web/app/login/page.tsx
import { LoginButton } from "./LoginButton";

export default function LoginPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-bg px-6">
      <section className="w-full max-w-sm rounded-xl border border-border bg-surface-elevated p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-xl font-semibold text-text">Sandbox IAC</h1>
          <p className="text-sm text-text-muted">Sign in to continue</p>
        </div>
        <div className="mt-8">
          <LoginButton />
        </div>
        <p className="mt-6 text-center text-xs text-text-muted">
          EPF Internal · Sandbox
        </p>
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Run tests, confirm pass**

Run: `npx vitest run __tests__/app/login/page.test.tsx`
Expected: 3 passing.

- [ ] **Step 6: Commit**

```bash
git add web/app/login/page.tsx web/app/login/LoginButton.tsx web/__tests__/app/login/page.test.tsx
git commit -m "feat(auth): add /login page with Microsoft sign-in stub button"
```

---

## Task 8: Add user menu + logout to Navbar (TDD)

**Files:**
- Create: `web/components/layout/UserMenu.tsx`
- Modify: `web/components/layout/Navbar.tsx`
- Test: `web/__tests__/components/layout/UserMenu.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// web/__tests__/components/layout/UserMenu.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserMenu } from "@/components/layout/UserMenu";

const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

beforeEach(() => {
  replaceMock.mockClear();
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);
});

describe("UserMenu", () => {
  it("renders the user's initials and opens menu with name on click", async () => {
    const user = userEvent.setup();
    render(<UserMenu user={{ upn: "demo@sandbox.local", displayName: "Demo User" }} />);
    expect(screen.getByLabelText(/account menu/i)).toBeInTheDocument();
    await user.click(screen.getByLabelText(/account menu/i));
    expect(screen.getByText("Demo User")).toBeInTheDocument();
    expect(screen.getByText("demo@sandbox.local")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("calls /api/auth/logout and redirects to /login on Sign out", async () => {
    const user = userEvent.setup();
    render(<UserMenu user={{ upn: "demo@sandbox.local", displayName: "Demo User" }} />);
    await user.click(screen.getByLabelText(/account menu/i));
    await user.click(screen.getByRole("button", { name: /sign out/i }));
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({ method: "POST" }));
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
  });
});
```

- [ ] **Step 2: Run test, confirm it fails**

Run: `npx vitest run __tests__/components/layout/UserMenu.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `UserMenu.tsx`**

```tsx
// web/components/layout/UserMenu.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface UserMenuProps {
  user: { upn: string; displayName: string };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-semibold select-none"
      >
        {initials(user.displayName)}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-surface-elevated p-2 shadow-md"
        >
          <div className="px-2 py-2">
            <p className="text-sm font-medium text-text">{user.displayName}</p>
            <p className="text-xs text-text-muted">{user.upn}</p>
          </div>
          <div className="my-1 border-t border-border" />
          <button
            onClick={signOut}
            className="w-full rounded px-2 py-2 text-left text-sm text-text hover:bg-surface"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Modify `Navbar.tsx`**

Change the `Navbar` component to accept an optional `user` prop and render `<UserMenu>` instead of the static "SB" avatar when present. Replace lines 78–83 of the existing file (the `aria-hidden` div containing "SB") with conditional rendering. The full updated file:

```tsx
// web/components/layout/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/templates", label: "Templates" },
];

export interface NavbarProps {
  user?: { upn: string; displayName: string } | null;
}

export function Navbar({ user }: NavbarProps = {}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-50 border-b border-border transition-colors duration-200 ${
        scrolled ? "backdrop-blur-md bg-surface/90" : "bg-surface"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          aria-label="Sandbox home"
        >
          <Logo size="md" />
          <span className="text-base font-semibold text-text">Sandbox</span>
        </Link>

        <div className="hidden sm:flex items-center gap-8">
          {navLinks.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative text-sm font-medium transition-colors ${
                  active ? "text-text" : "text-text-muted hover:text-text"
                }`}
              >
                {label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    aria-hidden="true"
                    className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary"
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <UserMenu user={user} />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-semibold select-none"
            >
              SB
            </div>
          )}
          <button
            className="sm:hidden rounded-md p-1 text-text-muted hover:text-text"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="sm:hidden overflow-hidden border-t border-border bg-surface"
          >
            <div className="flex flex-col gap-4 px-6 py-4">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-text"
                >
                  {label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
```

- [ ] **Step 5: Pass `user` from layout**

Inspect `web/app/layout.tsx`. If it renders `<Navbar />` directly, the layout must become async and fetch the user via `getCurrentUser()` from `web/lib/auth.ts`, then render `<Navbar user={user} />`.

Specifically, change `web/app/layout.tsx` to:
1. Mark the default export `async function RootLayout`.
2. Import `getCurrentUser` from `@/lib/auth`.
3. `const user = await getCurrentUser();`
4. Pass `<Navbar user={user} />` (only when not on `/login` — see Step 6 below).

- [ ] **Step 6: Hide Navbar on `/login`**

Inside `RootLayout`, read the pathname is not available in a server layout. Two options — choose option A:

**Option A (recommended):** Move `<Navbar />` rendering out of `app/layout.tsx` and into each route's own layout, OR introduce a route group `(authed)` that wraps all protected routes with `<Navbar />`. Simplest concrete change: create `web/app/(authed)/layout.tsx` containing `<Navbar user={await getCurrentUser()}>{children}</Navbar>`, and move the existing route folders (`templates`, `builder`, `request`, `review`, `my-stuff`) into `web/app/(authed)/`. The home `page.tsx` can stay at `web/app/page.tsx` if it should not be wrapped — but per the gating decision, home is also protected, so move it under `(authed)` too.

> If the engineer finds this restructuring out of scope, the fallback is: in the existing `app/layout.tsx`, render Navbar but use a client component wrapper that reads `usePathname()` and returns `null` when path === `/login`.

- [ ] **Step 7: Run all tests**

Run: `npx vitest run`
Expected: all green.

- [ ] **Step 8: Type-check + lint**

Run from `web/`:
```sh
npx tsc --noEmit
npm run lint
```
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add web/components/layout/Navbar.tsx web/components/layout/UserMenu.tsx web/__tests__/components/layout/UserMenu.test.tsx web/app/layout.tsx web/app/\(authed\)
git commit -m "feat(auth): user menu in navbar; route group for authed pages"
```

> If the engineer chose the client-side `null`-on-/login fallback in Step 6, adjust the file list accordingly.

---

## Task 9: Manual smoke test on dev server

**Files:** none

- [ ] **Step 1: Generate a dev SESSION_SECRET**

Run from repo root:
```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output into `web/.env.local`:
```
SESSION_SECRET=<paste>
```
(Plus the existing Azure env vars.)

- [ ] **Step 2: Start dev server**

Run from `web/`:
```sh
NODE_OPTIONS="--use-system-ca" npm run dev
```

- [ ] **Step 3: Walk the flow**

Open `http://localhost:3000/templates` in a private window. Verify:
1. You are redirected to `http://localhost:3000/login?next=%2Ftemplates`.
2. The page shows "Sandbox IAC", "Sign in to continue", and the Microsoft button.
3. Clicking the button redirects to `/templates`.
4. The navbar shows the "DU" avatar.
5. Clicking the avatar opens a menu with "Demo User" and "demo@sandbox.local".
6. Clicking "Sign out" returns you to `/login`.
7. Visiting `/api/healthz` works without a session.
8. Tampering with the cookie (browser devtools → set `iac_session` to garbage) and reloading any protected route redirects back to `/login`.

- [ ] **Step 4: Document smoke result**

If all eight checks pass, proceed. If any fails, debug before committing — do not commit a broken flow.

- [ ] **Step 5: Update CLAUDE.md**

Edit `CLAUDE.md`:
1. Add `SESSION_SECRET` to the App Service env vars table.
2. Under "Architecture — How Deployments Work", add a new top section "Authentication" stating: routes are gated by `web/proxy.ts`; identity comes from `getCurrentUser()` in `web/lib/auth.ts`; today this returns a placeholder `demo@sandbox.local` from a signed cookie; replacing this single file with an MSAL implementation enables real SSO.
3. Update the "What is blocked" line to: "Microsoft SSO (MSAL.js) — placeholder login is live; real SSO swap pending App Registration credentials."

- [ ] **Step 6: Final commit**

```bash
git add CLAUDE.md
git commit -m "docs: document placeholder login and SESSION_SECRET"
```

- [ ] **Step 7: Open PR**

Use the `commit-commands:commit-push-pr` skill or:
```sh
git push -u origin <branch>
gh pr create --title "feat(auth): placeholder login page gating all routes" --body "..."
```

---

## Self-Review

**Spec coverage:**
- ✅ Gate all routes — Task 6 (proxy.ts)
- ✅ `/login` page with stub Microsoft button — Task 7
- ✅ Logout — Task 5 + Task 8
- ✅ One-file MSAL swap — `web/lib/auth.ts` is the single seam (Tasks 2–3)
- ✅ `deployedBy` stays `demo@sandbox.local` — no change to executor or my-deployments route
- ✅ Tests for each unit — Tasks 2, 4, 5, 6, 7, 8

**Placeholder scan:** None.

**Type consistency:** `SessionUser` shape is `{ upn: string; displayName: string }` everywhere. `SESSION_COOKIE_NAME` is `"iac_session"` everywhere. Cookie format `<base64url(payload)>.<base64url(sig)>` is the same in `createSessionCookie` and `verifySessionCookie`.

**Open question for the engineer (not blocking):** Step 6 of Task 8 leaves layout structure as a choice. The recommended path is the `(authed)` route group. If the engineer takes the fallback, document the choice in the PR description.

---

## Out of Scope (separate plans)

- **Phase 2** — Error UX on review page + my-stuff (`docs/superpowers/plans/<date>-error-ux.md`, to be written after this ships)
- **Phase 3** — Accessibility audit + fix high/medium findings (to be written after Phase 2 ships; tasks depend on audit output)

These will get their own plans once Phase 1 lands on `main`.
