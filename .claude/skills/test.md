---
name: test
description: Run the Vitest test suite for the IAC Sandbox frontend
---

# Run Tests

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
