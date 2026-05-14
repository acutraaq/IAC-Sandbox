# Cross-Application SSO Integration Plan

> **Status:** Draft | **Date:** 2026-05-13 | **Owner:** Sandbox IAC Team  
> **Scope:** Enable seamless navigation from an already-authenticated partner webapp into Sandbox IAC without re-entering credentials.

---

## Executive Summary

A partner team has an internal webapp that is already integrated with Microsoft Entra ID (SSO). They want their authenticated users to open Sandbox IAC without logging in again.

**Key principle:** We do **not** generate tokens for, or exchange tokens with, the partner webapp. Both apps are independent **Relying Parties** trusting the same Entra ID tenant. The user’s authentication session lives at Entra ID, not in either application. When the user hits our `/api/auth/login` endpoint, Entra ID silently authenticates them (SSO cookie) and returns an authorization code to our callback.

This is a **same-tenant OIDC SSO flow**, not an API-to-API trusted-subsystem pattern.

---

## 1. How It Works (Sequence Diagram)

```text
Partner App (already logged in)
    │
    │ User clicks "Open Sandbox IAC"
    │ (plain link to https://<our-app>/login)
    ▼
┌─────────────────────────────────────────┐
│  1. Browser navigates to /login         │
│     proxy.ts ──► GET /api/auth/login  │
│     (MSAL: AZURE_AD_CLIENT_ID set)    │
│                                         │
│  2. 302 Redirect to login.microsoft...  │
│     Entra ID sees existing SSO session  │
│     (user signed in via Partner App)  │
│                                         │
│  3. 302 Redirect back to              │
│     /api/auth/callback/azure-ad?code=..│
│                                         │
│  4. Exchange code for tokens            │
│     acquireTokenByCode()                │
│                                         │
│  5. Create iac_session cookie           │
│     (HMAC-signed, 24 h TTL)             │
│                                         │
│  6. Redirect to originally requested  │
│     page (e.g. /templates)              │
└─────────────────────────────────────────┘
```

**No token exchange between apps. No shared secret. No backend API call.**

---

## 2. What We Must Change in Sandbox IAC

Our MSAL plumbing is already 100 % implemented but is currently bypassed because `AZURE_AD_CLIENT_ID` / `AZURE_AD_CLIENT_SECRET` are not set. Activating SSO requires only **configuration and environment variable provisioning**.

### 2.1 Entra ID App Registration (Admin Action)

| Step | Action | Owner |
|------|--------|-------|
  1 | Open Azure Portal → Entra ID → App registrations → New registration | Entra Admin |
  2 | Name: `sandbox-iac-webapp` | |
  3 | Supported account types: **Accounts in this organizational directory only** (single tenant) | |
  4 | Redirect URI (Web): `https://epf-experimental-sandbox-playground-cvhdbjgdcqabdjau.southeastasia-01.azurewebsites.net/api/auth/callback/azure-ad` | |
  5 | Record **Application (client) ID** → this becomes `AZURE_AD_CLIENT_ID` | |
  6 | Certificates & secrets → New client secret → record value → this becomes `AZURE_AD_CLIENT_SECRET` | |

> **Important:** The redirect URI must match exactly what `GET /api/auth/login` generates (`${origin}/api/auth/callback/azure-ad`). Trailing slashes or mismatched protocols will cause `AADSTS50011` errors.

### 2.2 App Service Configuration (Admin Action)

Add these environment variables to the Azure App Service (`epf-experimental-sandbox-playground`):

| Name | Value / Source |
|------|----------------|
| `AZURE_AD_CLIENT_ID` | From App Registration step 5 |
| `AZURE_AD_CLIENT_SECRET` | From App Registration step 6 |
| `AZURE_TENANT_ID` | `3335e1a2-2058-4baf-b03b-031abf0fc821` *(already set)* |

Once these are present, the existing check in `route.ts` will automatically take the MSAL path:

```ts
// web/app/api/auth/login/route.ts
function isSsoConfigured(): boolean {
  return Boolean(
    process.env.AZURE_AD_CLIENT_ID &&
      process.env.AZURE_AD_CLIENT_SECRET
  );
}
```

### 2.3 No Code Change Required

The codebase already supports this flow end-to-end:

| Component | Status | File |
|-----------|--------|------|
| PKCE + Auth Code URL builder | ✅ Implemented | `web/lib/msal.ts` |
| Login redirect handler | ✅ Implemented | `web/app/api/auth/login/route.ts` |
| OAuth callback handler | ✅ Implemented | `web/app/api/auth/callback/azure-ad/route.ts` |
| Session cookie signing | ✅ Implemented | `web/lib/auth-core.ts` |
| Middleware gate | ✅ Implemented | `web/proxy.ts` |
| `deployedBy` tag wiring | ✅ Implemented | `web/app/api/deployments/route.ts`, `web/app/api/my-deployments/route.ts` |

The only runtime fallback in `auth.ts` (returning `demo@sandbox.local` when no cookie exists) is harmless because `proxy.ts` will **never** let an unauthenticated request reach the app code once MSAL is active.

---

## 3. What the Partner Team Must Do

The partner team has **zero integration work** beyond adding a standard HTML hyperlink or button.

### 3.1 Recommended Link Format

```html
<a href="https://epf-experimental-sandbox-playground-cvhdbjgdcqabdjau.southeastasia-01.azurewebsites.net">
  Open Sandbox IAC
</a>
```

Or if they want to deep-link to a specific page after login:

```html
<a href="https://epf-experimental-sandbox-playground-cvhdbjgdcqabdjau.southeastasia-01.azurewebsites.net/templates?slug=web-application">
  Deploy Web App
</a>
```

The `next` query parameter is handled automatically by our login handler (`GET /api/auth/login?next=/templates`); after SSO completes, the user lands on that page.

### 3.2 Optional: Open in New Tab

```html
<a href="..." target="_blank" rel="noopener noreferrer">
  Open Sandbox IAC
</a>
```

This works identically — Entra ID SSO is browser-session scoped.

---

## 4. Security Considerations

| Topic | Mitigation |
|-------|------------|
| **Open Redirect** | `safeNext()` in login + callback handlers only allows same-origin relative paths. |
| **CSRF on callback** | PKCE `code_verifier` + `state` parameter prevent authorization code interception. |
| **Session hijacking** | `iac_session` is HMAC-signed (SHA-256) with a server-side `SESSION_SECRET`; tampered cookies are rejected. |
| **Token exposure** | The ID/access tokens from MSAL are held in server memory only; only the opaque session cookie reaches the browser. |
| **Deep-link trust** | The partner app cannot forge a session. It can only link to our login endpoint, which still goes through Entra ID. |

---

## 5. Rollback Plan

If SSO activation causes issues, rollback is instant:

1. Remove `AZURE_AD_CLIENT_ID` and `AZURE_AD_CLIENT_SECRET` from App Service Configuration.
2. Restart the App Service.

The app will immediately revert to the **placeholder login stub** (`demo@sandbox.local`) with no downtime.

---

## 6. Testing Checklist

### 6.1 Pre-Flight (Staging / Local)

- [ ] Create a test App Registration in Entra ID with redirect URI `http://localhost:3000/api/auth/callback/azure-ad`.
- [ ] Set `.env.local` values `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_TENANT_ID`.
- [ ] Run `npm run dev` in `web/`.
- [ ] Log in via another Entra ID app (or directly via `login.microsoftonline.com` in the same browser profile).
- [ ] Navigate to `http://localhost:3000/login` → expect **no password prompt**, immediate redirect to `/` with a valid `iac_session` cookie.
- [ ] Verify `GET /api/deployments` works and `deployedBy` in queue message equals the real Entra UPN.

### 6.2 Production Rollout

- [ ] Admin provisions App Registration for production domain.
- [ ] Admin adds env vars to Azure App Service and restarts.
- [ ] Verify `GET /api/healthz` still returns `ok`.
- [ ] Clear all existing `iac_session` cookies (old demo sessions are invalid once MSAL is active, but a clean state is best).
- [ ] Open `/login` in an Incognito window → should redirect to Microsoft login page (correct behavior when no Entra SSO session exists).
- [ ] Sign in via Microsoft, confirm landing on `/`.
- [ ] Partner team clicks their link → confirm seamless entry.

---

## 7. FAQ

**Q: Does the partner app need to pass us an access token or JWT?**  
A: **No.** They simply link to us. Entra ID handles SSO silently because the user already has an active session with the tenant.

**Q: Can the partner app embed our app in an `<iframe>`?**  
A: In theory yes, but `X-Frame-Options` / CSP may need adjustment. We recommend opening in a new tab or the same tab to avoid third-party cookie restrictions in modern browsers.

**Q: What if the user is signed out of the partner app?**  
A: When they click the link, Entra ID will prompt for Microsoft credentials (the standard login page). This is expected and secure.

**Q: Do we need to add the partner app as an authorized client or API permission?**  
A: **No.** We are not exposing an API to them, and we are not consuming their API. Both apps talk to Entra ID independently.

---

## 8. Related Files & Docs

| File | Purpose |
|------|---------|
| `web/lib/msal.ts` | PKCE + MSAL confidential client logic |
| `web/lib/auth-core.ts` | HMAC cookie signing/verification |
| `web/proxy.ts` | Middleware gate (Entra-safe, no `next/headers`) |
| `web/app/api/auth/login/route.ts` | Login redirect handler |
| `web/app/api/auth/callback/azure-ad/route.ts` | OAuth callback + session creation |
| `CLAUDE.md` § Authentication | Project auth overview |
| `.claude/rules/azure-infra.md` | App Service env var checklist |
