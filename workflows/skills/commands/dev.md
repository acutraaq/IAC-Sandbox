---
name: dev
description: Start the IAC Sandbox frontend dev server on localhost:3000
---

# Start Dev Server

## Overview
Launches the Next.js development server at localhost:3000 with MSW active. All `POST /deployments` calls are intercepted by `frontend/mocks/handlers.ts` — the real backend is not needed for frontend development.

## Quick Reference
| Task | Command |
|---|---|
| Start server | `cd frontend && npm run dev` |
| Confirm MSW active | Browser console → look for `[MSW] Mocking enabled.` |
| Stop server | `Ctrl+C` |

```bash
cd frontend && npm run dev
```

The dev server runs at **http://localhost:3000**.

MSW (Mock Service Worker) is active in development — `POST /deployments` is intercepted and returns a mocked response from `frontend/mocks/handlers.ts`. The real backend is not needed.

Confirm MSW is working: open the browser console and look for `[MSW] Mocking enabled.`

To stop: `Ctrl+C`.
