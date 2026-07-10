---
description: NPM dependency reference for web and functions packages in IAC Sandbox
globs: **/package.json, **/package-lock.json
---

# NPM Dependencies

## `web/` — Production
- `next` (v16), `react`, `react-dom` (v19)
- `@azure/storage-queue`, `@azure/storage-blob`, `@azure/arm-resources`, `@azure/identity`, `@azure/msal-node`
- `zustand`, `react-hook-form`, `@hookform/resolvers`, `zod`
- `lucide-react` (fonts: IBM Plex Sans + IBM Plex Mono via `next/font/google`)
- `framer-motion`, `clsx`, `tailwind-merge`

## `web/` — Development
- `typescript`, `@types/react`, `@types/react-dom`, `@types/node`
- `tailwindcss` (v4), `eslint`, `eslint-config-next`
- `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- `msw`, `jsdom`

## `functions/` — Production
- `@azure/functions` (v4), `@azure/arm-resources`, `@azure/identity`, `@azure/storage-blob` (poison-queue failure records), `zod`

## `functions/` — Development
- `typescript`, `@types/node`, `vitest`
- `eslint` (v10), `@eslint/js`, `typescript-eslint` — major version intentionally ahead of `web/`'s `eslint` (v9); `functions/` lint is not wired into the CI quality-gate sequence, only `tsc --noEmit` + `vitest run` are
