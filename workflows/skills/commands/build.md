---
name: build
description: Run the Next.js static export build for IAC Sandbox and verify /out is produced
---

# Build Static Export

## Overview
Compiles the Next.js frontend into a static export at `frontend/out/`. Run this to confirm the app builds cleanly before marking any phase done. Must exit 0 with `frontend/out/index.html` present.

## Quick Reference
| Task | Command |
|---|---|
| Run build | `cd frontend && npm run build` |
| Verify output exists | `ls frontend/out/index.html` |

```bash
cd frontend && npm run build
```

Produces a static export in `frontend/out/`. Verify success:

```bash
ls frontend/out/index.html
```

**Common failure causes:**
- Dynamic routes missing `generateStaticParams` — add static params for all template slugs from `data/templates.json`
- `useSearchParams()` outside a `<Suspense>` boundary — wrap the component
- Server-only imports in a client component — add `'use client'` directive or move the import

The `/out` directory must exist before any phase is marked done.
