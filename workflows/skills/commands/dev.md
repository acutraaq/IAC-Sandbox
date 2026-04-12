---
name: dev
description: Start the IAC Sandbox frontend dev server on localhost:3000
---

# Start Dev Server

```bash
cd frontend && npm run dev
```

The dev server runs at **http://localhost:3000**.

MSW (Mock Service Worker) is active in development — `POST /deployments` is intercepted and returns a mocked response from `frontend/mocks/handlers.ts`. The real backend is not needed.

Confirm MSW is working: open the browser console and look for `[MSW] Mocking enabled.`

To stop: `Ctrl+C`.
