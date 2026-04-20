---
name: lint
description: Run ESLint on the IAC Sandbox frontend — must exit 0 before any phase is done
---

# Run Linter

## Overview
Runs ESLint with TypeScript strict mode enforced. Zero errors is the only acceptable outcome — not "no new errors", not "warnings only". Required before any phase is marked complete.

## Quick Reference
| Task | Command |
|---|---|
| Run linter | `cd frontend && npm run lint` |
| Expected result | Exit code 0, zero errors |

```bash
cd frontend && npm run lint
```

Must exit with **code 0** (zero errors reported) before any phase is considered complete.

**On failure:** fix every reported error. Do not suppress with `// eslint-disable` comments without a documented reason on the line immediately above.

TypeScript strict mode is enforced — `any` types fail lint.
