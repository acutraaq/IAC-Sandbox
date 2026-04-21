---
name: lint
description: Run ESLint on IAC Sandbox — must exit 0 before any phase is done
---

# Run Linter

```bash
cd web && npm run lint
```

Must exit with **code 0** (zero errors reported) before any phase is considered complete.

**On failure:** fix every reported error. Do not suppress with `// eslint-disable` comments without a documented reason on the line immediately above.

TypeScript strict mode is enforced — `any` types fail lint.
