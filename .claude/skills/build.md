---
name: build
description: Run the Next.js server build for IAC Sandbox
---

# Build

```bash
cd web && npm run build
```

Produces a server build in `web/.next/`. Start in production with `npm start` (runs `next start`).

**Common failure causes:**
- Missing `"use client"` on components that use browser APIs
- Server-only imports in client components
- Type errors — run `npx tsc --noEmit` to diagnose
