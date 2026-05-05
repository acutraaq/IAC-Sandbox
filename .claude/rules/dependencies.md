---
description: NPM dependency reference for web and functions packages in IAC Sandbox
globs: **/package.json, **/package-lock.json
---

# NPM Dependencies

## `web/` — Production
- `next` (v16), `react`, `react-dom` (v19)
- `@azure/storage-queue`, `@azure/arm-resources`, `@azure/identity`
- `zustand`, `react-hook-form`, `@hookform/resolvers`, `zod`
- `lucide-react` (fonts: IBM Plex Sans + IBM Plex Mono via `next/font/google`)

## `web/` — Development
- `typescript`, `@types/react`, `@types/react-dom`, `@types/node`
- `tailwindcss` (v4), `eslint`, `eslint-config-next`
- `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- `msw`, `jsdom`

## `functions/` — Production
- `@azure/functions` (v4), `@azure/arm-resources`, `@azure/identity`, `zod`
