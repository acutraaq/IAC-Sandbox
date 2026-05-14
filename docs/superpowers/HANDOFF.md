# Session Handoff — 2026-05-14

> **Version:** 1.7.0 | **Last updated:** 2026-05-14 | **Status:** Active
> **Purpose:** Context for engineers starting a new session
> **Related docs:** [Project Index](../README.md) | [CLAUDE.md](../../CLAUDE.md) | [Complete Spec](../project/SPEC.md)
>
> **Action:** Read this immediately after `CLAUDE.md` if you are starting a new session. Update this file at the end of each session with the current state.

## TL;DR

**Proof artifact bugs fixed** — `Tenant` field now shows real tenant ID (was hardcoded subscription name); `Target RG` now shows the actual suffixed RG name from the API response (was derived without the submissionId suffix). ARM deployments still blocked on admin managed identity setup. 200 tests pass.

## What was done in this session (2026-05-14)

### Proof artifact fixes (`web/lib/report.ts`, `web/app/review/page.tsx`)
- **`Tenant` field** — was hardcoded `sub-epf-sandbox-internal` (subscription name). Now uses `getPublicAzureEnv().tenantId` → real tenant ID `3335e1a2-2058-4baf-b03b-031abf0fc821`.
- **`Target RG` field** — was derived client-side without submissionId suffix (e.g. `file-storage-rg`). Now receives `result.resourceGroup` from the API response (e.g. `file-storage-b31191-rg`). Added optional `resourceGroupName` parameter to `generateReport`.
- Removed unused `deriveResourceGroupName` import from `report.ts`.

### Deployment flow debugging
- Root-caused "stuck at Submitted" — POST `/api/deployments` succeeds (201, queue message enqueued), but Function App can't acquire ARM token because managed identity is not enabled. Messages are retried 3× then poison-queued. Status endpoint polls ARM, RG doesn't exist, returns `{ status: "accepted" }` indefinitely.
- Slow status polls (4–19s) in local dev are `DefaultAzureCredential` walking the full credential chain — expected, not a bug.

## What was done in the previous session (2026-05-13)

### Theme System (`web/app/globals.css`)
- **New tokens** — `color-prompt` (`#5aaef0`), `color-comment` (`rgba(175, 210, 245, 0.50)`)
- **Subtle SVG noise texture overlay** on body (opacity 0.02)
- **Line-number gutter** — `.line-gutter` utility with fixed left-side mono line numbers (desktop only, hidden on mobile). Used on home and templates pages.
- **Scroll and focus styles** remain unchanged — no new animation keyframes added

### Layout
- **Navbar** — mono wordmark (`~/sandbox` with `color-prompt` tilde), `backdrop-blur-md` on scroll, Azure Surface background, animated underline (`layoutId`) for active nav links
- **Footer** — single-line mono meta with `#` comment prefix (`# v1.0.0 · sub-epf-sandbox-internal · southeastasia`)
- **Breadcrumb** — replaced `/` separator with `ChevronRight` icon (a11y + cleaner look). Still used on `/review`.
- **PageEyebrow** — new component rendering `~/path` in mono with `color-prompt` tilde, used on home, templates, builder, review, my-stuff pages

### Core Components
- **Button** — extracted server-safe `buttonClasses()` into `web/lib/button-classes.ts`, fixed hydration issues with `asChild`, added `isValidElement` guard, `forwardRef`
- **Card, Badge, Modal, Toast** — inherited token updates; no structural changes

### Pages
- **Home** — mono hero block (`# Sandbox — Azure IaC for EPF`), `TemplateRow` list for popular templates, `TerminalHero` panel, `DocumentDivider` separators
- **Templates** — editorial row layout (`TemplateRow`) with bundles section first, individual resources second, `PageEyebrow`, `MonoSectionHeader`, `DocumentDivider`
- **Builder** — `PageEyebrow` + mono `# builder` heading, `MonoSectionHeader` for available/selected columns
- **Review** — `PageEyebrow` + mono `# review-your-setup` heading, `DocumentDivider` separators around configuration, tags, and submit sections
- **My Stuff** — `PageEyebrow` + mono `# my-stuff` heading, mono summary line (`# filtered by deployedBy=...`), hover accent lines on table rows
- **Login** — terminal panel layout with `#` comment block, `$ sandbox auth login` prompt, mono meta footer

### Sub-components
- **TemplateRow** — new component replacing card grids. Grid layout with mono index, category/slug, name/description, resource count / estimated time, arrow hint on hover
- **MonoSectionHeader** — new component: `## title` in mono with optional sans description and right slot
- **DocumentDivider** — new component: `---` mono glyph + optional label + horizontal rule
- **TerminalHero** — new component on home page showing a styled terminal panel with prompt glyphs
- **ConfirmModal** — mono glyph status timeline (`[ ]` queued, `[*]` active, `[✓]` done, `[x]` failed). Proof text renders in mono inside a bordered pre block.

### Deleted components
- `web/components/home/TemplateGrid.tsx`
- `web/components/templates/TemplateGrid.tsx`
- `web/components/templates/TemplateCard.tsx`

### Tests
- Fixed Breadcrumb test for `ChevronRight` separator (was expecting `/`)
- All 209 tests pass

## Current State

### What is live
- Terminal-native document redesign deployed to all pages (home, templates, builder, my-stuff, request, review, login)
- Full MSAL authorization code + PKCE flow at `web/lib/msal.ts`, `/api/auth/login` (GET redirect), `/api/auth/callback`
- `deployedBy` flows from session → queue message → ARM tags in both web app and Azure Functions
- Login page at `/login` with "Sign in with Microsoft" anchor link
- Placeholder HMAC session cookie still works for `demo@sandbox.local`

### On hold
- **Microsoft SSO (Entra ID / MSAL)** — fully implemented but not being activated at this time. Placeholder login (`demo@sandbox.local`) is the accepted state.
- **ARM deployments** — managed identity not yet enabled on Function App or App Service. Admin must complete the 5-step setup in `.claude/rules/azure-infra.md`. Steps 1, 2, 4 pending; Step 3 (Contributor role for Function App) confirmed done. Without Step 1, Function App cannot acquire ARM token → every deployment poison-queues silently.

### What's next
- **Error UX** — surface ARM operation errors in review modal + my-stuff page. (Needs its own plan in `docs/superpowers/plans/`.)
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
