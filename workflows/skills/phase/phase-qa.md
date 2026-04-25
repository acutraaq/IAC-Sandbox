---
name: phase-qa
description: Quality gate phase (Phase 4): lint, tests, build, smoke checklist, and security review for IAC Sandbox
---

# Phase: QA + Release Gates (Phase 4)

## Overview
The final quality gate — not a feature phase. Run all checks below in strict order; stop on any failure. All must be green before any PR is opened or phase is marked complete.

## Quick Reference
| Step | Command / Action |
|---|---|
| 1. Web lint | `cd web && npm run lint` |
| 2. Web type-check | `cd web && npx tsc --noEmit` |
| 3. Web tests | `cd web && npx vitest run` |
| 4. Web build | `cd web && npm run build` |
| 5. Functions type-check | `cd functions && npx tsc --noEmit` |
| 6. Functions tests | `cd functions && npx vitest run` |
| 7. Smoke | Run `/smoke` skill with live dev server |
| 8. Security | Work through security checklist below |

## Sequence (run in order — stop on any failure)

### 1. Web Lint

```bash
cd web && npm run lint
```

Expected: exits with code 0 and no errors reported.
On failure: fix every reported error. Do not add `// eslint-disable` comments unless the reason is documented on the line above.

### 2. Web Type Check

```bash
cd web && npx tsc --noEmit
```

Expected: zero errors.

### 3. Web Tests

```bash
cd web && npx vitest run
```

Expected: all tests pass; zero failures. Currently: 170 tests across 25 files.
On failure: read the exact error, fix the component or test. Never delete a failing test.

**Important:** Run from `web/` — NOT the repo root. Running from root breaks `@/` alias resolution.

### 4. Web Build

```bash
cd web && npm run build
```

Expected: `.next/standalone/` directory produced. This is a standalone server build — NOT a static export. Do NOT check for `/out/` directory.

On failure: check for missing `generateStaticParams` on dynamic routes, `useSearchParams` without a `<Suspense>` boundary, or server-only imports in client components.

### 5. Functions Type Check

```bash
cd functions && npx tsc --noEmit
```

Expected: zero errors.

### 6. Functions Tests

```bash
cd functions && npx vitest run
```

Expected: all tests pass; zero failures. Currently: 78 tests across 3 files.

**Important:** Run from `functions/` — NOT the repo root.

### 7. Smoke Test (manual)

Run `/smoke` skill and work through the full checklist with a live dev server.

### 8. Security Review

- [ ] No hardcoded secrets, tokens, or API keys in any source file
- [ ] No `any` TypeScript types that bypass Zod validation
- [ ] All user input validated with Zod before use
- [ ] No sensitive data (tokens, user IDs, personal info) logged to console
- [ ] `deployedBy` hardcoded to `"demo@sandbox.local"` — expected until SSO is unblocked

## Done When

All 8 sections complete: 0 lint errors, 0 type errors, all tests pass (web + functions), build succeeds, smoke checklist fully ticked, security checklist clean.
