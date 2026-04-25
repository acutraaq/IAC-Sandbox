---
name: test
description: Run the Vitest test suite for IAC Sandbox
---

# Run Tests

## Overview
Runs the full Vitest suite across both `web/` and `functions/`. All tests must pass — zero failures, zero skipped without justification. Required before any phase is marked complete. Never delete or skip a failing test; fix the implementation instead.

**Critical:** Always run from the correct subdirectory. Running `npx vitest run` from the repo root breaks `@/` alias resolution in web tests and will produce false failures.

## Quick Reference
| Task | Command |
|---|---|
| Web — all tests | `cd web && npx vitest run` |
| Web — single file | `cd web && npx vitest run path/to/Component.test.tsx` |
| Web — by name pattern | `cd web && npx vitest run -t "pattern"` |
| Functions — all tests | `cd functions && npx vitest run` |
| Functions — single file | `cd functions && npx vitest run src/__tests__/path/to/file.test.ts` |

## Web Tests

```bash
cd web && npx vitest run
```

Expected: 170 tests across 25 files, all passing.

## Functions Tests

```bash
cd functions && npx vitest run
```

Expected: 78 tests across 3 files, all passing.

**On failure:** the error includes the test name, file path, and line number. Fix the failing implementation — do not delete or skip the test.

All tests must pass before any phase is complete.
