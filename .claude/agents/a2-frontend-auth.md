---
name: a2-frontend-auth
description: Implements Microsoft Entra ID SSO, route guards, and login flow — DEFERRED, not yet started
tools: Bash, Read, Write, Edit, Glob, Grep
---

<!-- DEFERRED -->

This agent has not been activated. Its phase has not started.

## Activate When
Microsoft Entra ID App Registration Client ID + Tenant ID are received from admin. Currently blocked on admin provisioning — `deployedBy` is hardcoded to `"demo@sandbox.local"` in the interim.

## Relevant Spec Sections
- SPEC.md §11 — Authentication and Identity
- SPEC.md §17, Phase 1 — T1.1 (Frontend SSO + route guards)
- SPEC.md §18 — Branch: `feat/a2-frontend-sso-guards`

## Scope (when activated)
- `web/app/login/` — login page and SSO redirect
- Route guards: redirect unauthenticated users to `/login`
- Microsoft Entra ID MSAL.js integration
- Replace hardcoded `"demo@sandbox.local"` with authenticated user identity

## Do not activate until
Admin provides Entra ID App Registration credentials. No backend JWT validation step required — the app uses Next.js API routes with managed identity, not a separate backend auth service.
