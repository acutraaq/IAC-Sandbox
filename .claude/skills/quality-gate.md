---
name: quality-gate
description: Run the full IAC Sandbox quality gate (lint, type-check, tests, build) in order — the complete checklist before claiming any phase done
---

# Quality Gate

## Overview
CLAUDE.md §Quality Gates requires 4 checks across `web/` and `functions/` before any phase is marked complete. Each check has its own skill (`lint`, `type-check`, `test`, `build`) but they're easy to run partially and forget one — this skill chains all of them in the required order so nothing is skipped.

## Order

1. **Lint** (`web/` only — `functions/` lint is not wired into CI, see `.claude/rules/dependencies.md`)
   ```bash
   cd web && npm run lint
   ```
   Must exit 0.

2. **Type-check** (both)
   ```bash
   cd web && npx tsc --noEmit
   cd functions && npx tsc --noEmit
   ```
   Both must exit 0.

3. **Tests** (both)
   ```bash
   cd web && npx vitest run
   cd functions && npx vitest run
   ```
   All pass, zero failures — no fixed count to compare against, the suite grows over time.

4. **Build** (`web/` only — `functions/` has no build-artifact check beyond tsc)
   ```bash
   cd web && npm run build
   ```
   Must produce `.next/` with no errors.

## Rules
- Run every step even if an earlier one fails — collect all failures, don't stop at the first, unless a failure blocks a later step from running meaningfully (e.g. build will fail anyway if type-check fails, so type-check failures should be fixed first).
- Never skip a step because "it probably passes" — evidence before assertions (see `superpowers:verification-before-completion`).
- Never mark a phase complete with any step un-run or failing.
