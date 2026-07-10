---
description: CI/CD workflow details — standalone assembly, oryx config, and zip steps for IAC Sandbox
globs: .github/**
---

# CI/CD Deploy Approach

`web`, `functions`, and `schema-drift` jobs live in `.github/workflows/ci.yml`. A `changes` job runs first using `dorny/paths-filter@v3` to detect which paths changed — `web`/`functions` only run when their relevant files are modified.

## Schema drift job

Deliberately NOT gated by the `changes` path filter — it always runs on every push/PR regardless of which side changed. It used to live inside the `web` job gated by `needs.changes.outputs.web`, which meant a commit touching only `functions/src/modules/deployments/deployment.schema.ts` skipped the only check that would have caught a web/functions schema mismatch. Compares `web/lib/deployments/schema.ts` against `functions/src/modules/deployments/deployment.schema.ts` via a `diff`/`sed` pipeline (not a semantic check — still a known gap, see HANDOFF.md).

## Concurrency

`cancel-in-progress` is conditional: `${{ github.ref != 'refs/heads/main' }}`. Superseded PR runs still cancel fast, but a push to `main` (which triggers a live Azure deploy) is never cancelled mid-way by a second push landing seconds later — that used to risk a half-deployed Function App or Web App.

## Web job
1. `npm ci` → lint → type-check → test → `npm run build` (with dummy env vars)
2. Assemble standalone: copy `public/` and `.next/static/` into the standalone dir, write `oryx-manifest.toml` with `StartupCommand = "env -u HOSTNAME node server.js"` (strips the Azure-injected `HOSTNAME` env var so Next.js binds to `0.0.0.0`)
3. Zip → `release.zip` → deploy via `azure/webapps-deploy@v3`

## Functions job
1. `npm ci` → type-check → test → `npm run build`
2. `npm prune --omit=dev` → zip `dist/ host.json package.json node_modules`
3. Deploy via `azure/functions-action@v1` using `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`

> `next.config.js` uses `output: 'standalone'`. Do not add `cp server.js .next/standalone/server.js` to the workflow — it would replace the correct standalone server with an incompatible one. `web/server.js` is for local `npm start` only.
