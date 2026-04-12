---
name: phase-qa
description: Quality gate phase (Phase 4): lint, tests, build, smoke checklist, and security review for IAC Sandbox frontend
---

# Phase: QA + Release Gates (Phase 4)

This phase IS the quality gate. Nothing passes until all checks are green.

## Sequence (run in order — stop on any failure)

### 1. Lint

```
cd frontend && npm run lint
```

Expected: exits with code 0 and no errors reported.
On failure: fix every reported error. Do not add `// eslint-disable` comments unless the reason is documented on the line above.

### 2. Tests

```
cd frontend && npm run test:run
```

Expected: all tests pass; zero failures; zero skipped without documented justification.
On failure: read the exact error, fix the component or test. Never delete a failing test.

### 3. Build

```
cd frontend && npm run build
```

Expected: `/out` directory produced. Verify:

```
ls frontend/out/index.html
```

On failure: check for missing `generateStaticParams` on dynamic routes, `useSearchParams` without a `<Suspense>` boundary, or server-only imports in client components.

### 4. Smoke Test (manual)

Run `/smoke` skill and work through the full checklist with a live dev server.

### 5. Security Review

- [ ] No hardcoded secrets, tokens, or API keys in any source file
- [ ] No `any` TypeScript types that bypass Zod validation
- [ ] All user input validated with Zod before use
- [ ] MSW not active in production: `frontend/out/` should not serve an active `mockServiceWorker.js`
- [ ] No sensitive data (tokens, user IDs, personal info) logged to console

## Done When

All 5 sections complete: 0 lint errors, all tests pass, `/out` produced, smoke checklist fully ticked, security checklist clean.
