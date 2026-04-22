# CI Cleanup & Optimization Design

**Date:** 2026-04-22
**Status:** Approved, ready for implementation
**Project:** IAC Sandbox — Sandbox Azure Deployer

---

## 1. Problem

Three compounding issues slow down CI and introduce correctness risk:

- Both CI jobs run on every push regardless of which code changed — a web-only change triggers the functions job and vice versa, doubling unnecessary CI minutes
- Root `.gitignore` references `/frontend/` and `/backend/` (stale directory names); actual dirs are `web/` and `functions/`, so `functions/dist/` is not properly gitignored
- `zod` version drift between workspaces: `functions/` uses v3, `web/` uses v4

---

## 2. What Is In Scope

- Split `ci.yml` into two workflow files with path-based triggers
- Fix web CI test step to use `vitest run` (explicit exit) instead of watch mode
- Fix root `.gitignore` stale paths
- Add `functions/.gitignore`
- Upgrade `zod` in `functions/` from v3 → v4 to match `web/`

## 3. What Is Out of Scope

- `@azure/arm-resources` v5→v7 alignment — requires source code changes in `bicep-executor.ts` (v7 removed the `deployments` namespace); tracked separately
- Adding ESLint to `functions/` — no config exists; introducing new tooling is out of scope for a cleanup task
- Adding tests to the functions CI job — no test framework configured

---

## 4. Architecture

### CI Workflow Split

GitHub Actions does not support per-job path filters natively — `paths` applies at the workflow level. The standard pattern is two separate workflow files:

- `.github/workflows/web.yml` — triggers on changes to `web/**` or `.github/workflows/web.yml`
- `.github/workflows/functions.yml` — triggers on changes to `functions/**` or `.github/workflows/functions.yml`

Each file contains only its own job's steps, unchanged from the current `ci.yml` except for the path trigger and the test runner fix in `web.yml`.

### Test Runner Fix

`web/package.json` defines two scripts:
- `"test": "vitest"` — watch mode (wrong for CI)
- `"test:run": "vitest run"` — exits after single pass (correct for CI)

CI currently calls `npm test`. Change to `npm run test:run`.

### Gitignore Fixes

Root `.gitignore` has four stale paths from a previous directory naming convention:

| Stale | Correct |
|---|---|
| `/frontend/.next/` | `/web/.next/` |
| `/frontend/out/` | `/web/out/` |
| `/frontend/build/` | `/web/build/` |
| `/backend/dist/` | `/functions/dist/` |

A new `functions/.gitignore` explicitly ignores build artifacts at the functions level so `dist/` and `node_modules/` can never slip into a commit regardless of root gitignore state.

### Zod Upgrade

`functions/` uses `zod ^3.23.0`. The functions codebase only uses:
- `z.object()`, `z.string()`, `z.enum()`, `z.literal()` — unchanged in v4
- `.parse()` / `.safeParse()` — unchanged in v4

No v3-specific APIs are used. The upgrade is a `package.json` change + `npm install` — no source code changes required.

---

## 5. Files Changed

| File | Action |
|---|---|
| `.github/workflows/ci.yml` | Delete |
| `.github/workflows/web.yml` | New — web job with path filter + test runner fix |
| `.github/workflows/functions.yml` | New — functions job with path filter |
| `.gitignore` | Fix 4 stale paths |
| `functions/.gitignore` | New — ignore `dist/` and `node_modules/` |
| `functions/package.json` | `zod ^3.23.0` → `^4.3.6` |
| `functions/package-lock.json` | Regenerated after zod upgrade |

---

## 6. Acceptance Criteria

- [ ] Pushing a change to `web/` only triggers `web.yml`; `functions.yml` does not run
- [ ] Pushing a change to `functions/` only triggers `functions.yml`; `web.yml` does not run
- [ ] Pushing a change to either workflow file triggers both jobs
- [ ] Web CI test step exits after a single pass (no hanging watch mode)
- [ ] `functions/dist/` is gitignored — `git status` after a local build shows it as ignored
- [ ] `web/.next/` is gitignored correctly
- [ ] `functions/` zod version matches `web/` at v4
- [ ] All existing tests pass after zod upgrade (`npm run test:run` in `functions/` exits 0)
- [ ] Functions CI build step passes after zod upgrade
