---
name: test
description: Run the Vitest test suite for IAC Sandbox
---

# Run Tests

```bash
cd web && npm run test:run
```

Runs all tests via Vitest. Output shows pass/fail per file with test names.

**On failure:** the error includes the test name, file path, and line number. Fix the failing implementation — do not delete or skip the test.

**Run a single file:**
```bash
cd web && npx vitest run path/to/Component.test.tsx
```

**Run by test name pattern:**
```bash
cd web && npx vitest run -t "should prevent duplicate resources"
```

All tests must pass before any phase is complete.
