# Session Handoff — 2026-04-29

> **Version:** 1.2.0 | **Last updated:** 2026-04-29 | **Status:** Active  
> **Purpose:** Context for engineers starting a new session  
> **Related docs:** [Project Index](../README.md) | [CLAUDE.md](../../CLAUDE.md) | [Complete Spec](../project/SPEC.md)  
>
> **Action:** Read this immediately after `CLAUDE.md` if you are starting a new session. Update this file at the end of each session with the current state.

## TL;DR

Login placeholder (PR #6) was merged. **MSAL SSO plumbing is fully implemented** — authorization code + PKCE flow, callback handler, `deployedBy` wired through the pipeline end-to-end. The app runs with the placeholder `demo@sandbox.local` identity until admin provides App Registration credentials. All 11 project sync issues found during the 2026-04-29 audit have been fixed.

## What was done in the last session (2026-04-29)

Project audit identified 17 discrepancies across docs, agents, skills, and config files. All resolved:

- **MSAL SSO plan archived** — moved `2026-04-29-msal-sso.md` and `2026-04-25-login-placeholder.md` to `archive/plans/`
- **File path fixes** — `next.config.ts` → `next.config.js` in A7 agent + workflows README; `rg-name.ts` → `sanitize.ts` in CLAUDE.md + A5 agent
- **Missing directory created** — `docs/superpowers/specs/` now exists with README
- **Agent docs updated** — A2 (auth) no longer DEFERRED; A3 (flows) removed SubmitButton reference; A1 README path fixed
- **HANDOFF.md refreshed** — reflects MSAL SSO completion state

## Current State

### What is live
- Full MSAL authorization code + PKCE flow at `web/lib/msal.ts`, `/api/auth/login` (GET redirect), `/api/auth/callback`
- `deployedBy` flows from session → queue message → ARM tags in both web app and Azure Functions
- Login page at `/login` with "Sign in with Microsoft" anchor link — throws MSAL config error if creds not set (graceful degradation)
- Placeholder HMAC session cookie still works for `demo@sandbox.local`

### Still blocked
- **Microsoft SSO (Entra ID / MSAL)** — admin has not provided App Registration credentials (`AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`). Code is ready; activation checklist in A2 agent doc or `web/lib/auth.ts`.
- **Cross-subscription ARM deployments** — managed identity not yet enabled on Function App or App Service. Admin must complete the 5-step setup in CLAUDE.md → Azure Infrastructure Setup.

### What's next
- **Phase 2 (Error UX)** — surface ARM operation errors in review modal + my-stuff page. Plan at `docs/superpowers/archive/plans/2026-04-25-login-placeholder.md` (section "Phase 2").
- **Phase 3 (a11y audit)** — run lighthouse/axe-core audit on all UI surfaces, fix high/medium findings.

## Standing user preferences
- Use `.kilo/plans/` for plan tracking; `.kilo/agents/` and `.kilo/commands/` for Kilo-specific agents/commands
- `.claude/` is the source of truth for Claude Code agents/skills/hooks (ships with `git clone`; no copy step)
- Git worktrees under `.worktrees/` for isolated feature work
- TypeScript strict mode, no `any`, Zod at API boundaries
- Run tests from `web/` or `functions/` subdirectories (NOT from repo root)

## Other context
- The user is in Malaysia (en-MY locale). Project is EPF (Employees Provident Fund Malaysia) sandbox IAC platform.
- Live at `https://epf-experimental-sandbox-playground-cvhdbjgdcqabdjau.southeastasia-01.azurewebsites.net`
- Tech stack and conventions: `CLAUDE.md`. Read it first.
