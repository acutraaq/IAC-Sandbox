---
name: test
description: Run the Vitest test suite for the IAC Sandbox frontend
---

# Run Tests

## Overview
Runs the full Vitest suite. All tests must pass — zero failures, zero skipped without justification. Required before any phase is marked complete. Never delete or skip a failing test; fix the implementation instead.

## Quick Reference
| Task | Command |
|---|---|
| Run all tests | `cd frontend && npm run test:run` |
| Run single file | `cd frontend && npx vitest run path/to/Component.test.tsx` |
| Run by name pattern | `cd frontend && npx vitest run -t "pattern"` |

```bash
cd frontend && npm run test:run
```

Runs all tests via Vitest. Output shows pass/fail per file with test names.

**On failure:** the error includes the test name, file path, and line number. Fix the failing implementation — do not delete or skip the test.

**Run a single file:**
```bash
cd frontend && npx vitest run path/to/Component.test.tsx
```

**Run by test name pattern:**
```bash
cd frontend && npx vitest run -t "should prevent duplicate resources"
```

All tests must pass before any phase is complete.
