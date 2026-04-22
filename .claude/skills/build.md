---
name: build
description: Run the Next.js server build for IAC Sandbox
---

# Build

## Overview
Compiles the Next.js app into a server build at `web/.next/`. Run this to confirm the app builds cleanly before marking any phase done.

## Quick Reference
| Task | Command |
|---|---|
| Run build | `cd web && npm run build` |
| Start production | `cd web && npm start` |

```bash
cd web && npm run build
```

**Common failure causes:**
- Missing `"use client"` on components that use browser APIs
- Server-only imports in client components
- Type errors — run `npx tsc --noEmit` to diagnose
