# Session Handoff — 2026-05-04

> **Version:** 1.3.0 | **Last updated:** 2026-05-04 | **Status:** Active  
> **Purpose:** Context for engineers starting a new session  
> **Related docs:** [Project Index](../README.md) | [CLAUDE.md](../../CLAUDE.md) | [Complete Spec](../project/SPEC.md)  
>
> **Action:** Read this immediately after `CLAUDE.md` if you are starting a new session. Update this file at the end of each session with the current state.

## TL;DR

Login placeholder (PR #6) was merged. **MSAL SSO plumbing is fully implemented** — authorization code + PKCE flow, callback handler, `deployedBy` wired through the pipeline end-to-end. SSO is **on hold**; the placeholder `demo@sandbox.local` identity is the current accepted state. Dark-only theme is shipped (single `:root` token block, no theme toggle).

## What was done in the last session (2026-05-04)

Doc-audit pass against the live codebase. Fixes:

- **Dark-only plan archived** — `2026-04-30-dark-only-theme.md` moved to `archive/plans/`; tokens already live in `web/app/globals.css`, `ThemeToggle` removed
- **CLAUDE.md** — bumped to 2.3.0; status table replaced with a short note (archive holds completed work); template-count typo fixed (16 templates / **7** categories, not 6)
- **GLOSSARY.md** — `deployedBy` no longer described as "hardcoded"; reflects session-sourced value via `getCurrentUser()`
- **docs/README.md** — fixed broken relative link to `.github/workflows/ci.yml`; dropped hardcoded SPEC version
- **DESIGN.md** — fixed mobile nav "border-top border" typo

## Current State

### What is live
- Full MSAL authorization code + PKCE flow at `web/lib/msal.ts`, `/api/auth/login` (GET redirect), `/api/auth/callback`
- `deployedBy` flows from session → queue message → ARM tags in both web app and Azure Functions
- Login page at `/login` with "Sign in with Microsoft" anchor link — throws MSAL config error if creds not set (graceful degradation)
- Placeholder HMAC session cookie still works for `demo@sandbox.local`

### On hold
- **Microsoft SSO (Entra ID / MSAL)** — fully implemented but not being activated at this time. Placeholder login (`demo@sandbox.local`) is the accepted state. When the team decides to proceed, the activation checklist is in A2 agent doc or `web/lib/auth.ts`.
- **Cross-subscription ARM deployments** — managed identity not yet enabled on Function App or App Service. Admin must complete the 5-step setup in CLAUDE.md → Azure Infrastructure Setup.

### What's next
- **Error UX** — surface ARM operation errors in review modal + my-stuff page. (Needs its own plan in `docs/superpowers/plans/`; outline previously lived in the archived login-placeholder plan, "Phase 2" section.)
- **a11y audit** — run lighthouse/axe-core audit on all UI surfaces, fix high/medium findings.

## Standing user preferences
- `.claude/` is the source of truth for Claude Code agents/skills/hooks (ships with `git clone`; no copy step)
- Active design specs live in `docs/superpowers/specs/`; active plans in `docs/superpowers/plans/`; completed work moves to `docs/superpowers/archive/`
- Git worktrees under `.worktrees/` for isolated feature work
- TypeScript strict mode, no `any`, Zod at API boundaries
- Run tests from `web/` or `functions/` subdirectories (NOT from repo root)

## Other context
- The user is in Malaysia (en-MY locale). Project is EPF (Employees Provident Fund Malaysia) sandbox IAC platform.
- Live at `https://epf-experimental-sandbox-playground-cvhdbjgdcqabdjau.southeastasia-01.azurewebsites.net`
- Tech stack and conventions: `CLAUDE.md`. Read it first.
