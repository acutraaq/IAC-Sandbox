---
name: build
description: Run the Next.js static export build for IAC Sandbox and verify /out is produced
---

# Build Static Export

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
