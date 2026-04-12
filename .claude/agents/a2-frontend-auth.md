---
name: a2-frontend-auth
description: Implements Microsoft Entra ID SSO, route guards, and login flow — DEFERRED, not yet started
tools: Bash, Read, Write, Edit, Glob, Grep
---

<!-- DEFERRED -->

This agent has not been activated. Its phase has not started.

## Activate When
Backend JWT validation (T1.2) is complete and Microsoft Entra ID app registration is configured.

## Relevant Spec Sections
- SPEC.md §11 — Authentication and Identity
- SPEC.md §17, Phase 1 — T1.1 (Frontend SSO + route guards)
- SPEC.md §18 — Branch: `feat/a2-frontend-sso-guards`

## Scope (when activated)
- `frontend/app/login/` — login page and SSO redirect
- Route guards: redirect unauthenticated users to `/login`
- Microsoft Entra ID MSAL integration
- Session/token storage on frontend

## Do not activate until
T0.1 (contract freeze) and T1.2 (backend JWT validation) are complete per SPEC.md §17.
