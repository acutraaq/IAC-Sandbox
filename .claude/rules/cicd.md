---
description: CI/CD workflow details — standalone assembly, oryx config, and zip steps for IAC Sandbox
globs: .github/**
---

# CI/CD Deploy Approach

Both `web` and `functions` jobs live in `.github/workflows/ci.yml`. A `changes` job runs first using `dorny/paths-filter@v3` to detect which paths changed — each job only runs when its relevant files are modified.

## Web job
1. `npm ci` → lint → type-check → test → `npm run build` (with dummy env vars)
2. Assemble standalone: copy `public/` and `.next/static/` into the standalone dir, write `oryx-manifest.toml` with `StartupCommand = "env -u HOSTNAME node server.js"` (strips the Azure-injected `HOSTNAME` env var so Next.js binds to `0.0.0.0`)
3. Zip → `release.zip` → deploy via `azure/webapps-deploy@v3`

## Functions job
1. `npm ci` → type-check → test → `npm run build`
2. `npm prune --omit=dev` → zip `dist/ host.json package.json node_modules`
3. Deploy via `azure/functions-action@v1` using `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`

> `next.config.js` uses `output: 'standalone'`. Do not add `cp server.js .next/standalone/server.js` to the workflow — it would replace the correct standalone server with an incompatible one. `web/server.js` is for local `npm start` only.
