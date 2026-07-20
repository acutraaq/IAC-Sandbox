---
name: type-check
description: Run the TypeScript compiler check for IAC Sandbox — must exit 0 before any phase is done
---

# Type Check

## Overview
Runs `tsc --noEmit` against strict-mode TypeScript. This is a separate quality gate from lint (CLAUDE.md §Quality Gates lists both) — passing lint does not mean type-check passes, and vice versa. `npm run type-check` does not exist as an npm script; always invoke `tsc` directly.

## Quick Reference
| Task | Command |
|---|---|
| Web type-check | `cd web && npx tsc --noEmit` |
| Functions type-check | `cd functions && npx tsc --noEmit` |

```bash
cd web && npx tsc --noEmit
cd functions && npx tsc --noEmit
```

Both must exit **0** before any phase is considered complete.

**On failure:** fix the reported type errors. No `any`, no unguarded type assertions (project convention) — do not silence an error by widening a type to `any` or adding `as` without justification.
