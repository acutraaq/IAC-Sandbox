# Workflows — Agents & Skills

Claude Code agents and skills for the IAC Sandbox project. This directory is the **source of truth** — edit files here, then re-run the install script.

## Setup

Run once after cloning, and again after editing any file in `workflows/`:

```bash
./scripts/install-workflows.sh
```

This copies `workflows/agents/` and `workflows/skills/` into `.claude/` where Claude Code discovers them.

---

## Agents

| ID | File | Status | Description | File Ownership |
|----|------|--------|-------------|----------------|
| A0 | `a0-architect.md` | **Active** | Cross-cutting design, feature planning, structural consistency | `docs/superpowers/specs/`, `docs/superpowers/plans/`, cross-domain files |
| A1 | `a1-product.md` | **Active** | Requirements, ADRs, scope decisions | `implementation/SPEC.md`, `CLAUDE.md` |
| A2 | `a2-frontend-auth.md` | Stub | Microsoft Entra ID SSO, route guards | `web/app/login/` — blocked on admin credentials |
| A3 | `a3-frontend-flows.md` | **Active** | Template + Builder + Review flows | `web/app/templates/`, `web/app/builder/`, `web/app/review/`, `web/components/` (flows) |
| A4 | `a4-backend-api.md` | **Active** | Next.js API routes, ARM integration | `web/app/api/`, `web/lib/arm.ts`, `web/lib/deployments/` |
| A5 | `a5-deployment-worker.md` | **Active** | Azure Functions queue worker, ARM deployment | `functions/src/` |
| A7 | `a7-devops-infra.md` | **Active** | GitHub Actions CI/CD, App Service config | `.github/workflows/`, `web/next.config.ts` |
| A8 | `a8-qa-security.md` | **Active** | Lint, tests, build, smoke, security | `web/__tests__/`, co-located test files |

**How to invoke:** Describe the task in natural language — Claude Code selects the matching sub-agent automatically. Or ask explicitly: *"use the A5 deployment worker agent"*.

---

## Skills

### Phase Skills (reference cards for each development phase)

| Skill | Covers | Invoke |
|-------|--------|--------|
| `phase-core` | Foundation (CSS tokens, layout, UI primitives) + Domain (types, store, lib utils) | `/phase-core` |
| `phase-templates` | Template catalog + multi-step wizard flow | `/phase-templates` |
| `phase-builder-review` | Custom resource builder + review/submit page + proof modal | `/phase-builder-review` |
| `phase-qa` | Full quality gate sequence (lint → type-check → test → build → smoke → security) | `/phase-qa` |

### Command Skills (daily dev operations)

| Skill | What it does | Invoke |
|-------|-------------|--------|
| `arch-file` | Enforce structured file-creation format (filepath, purpose, deps, consumers, tests) | `/arch-file` |
| `dev` | Start dev server on localhost:3000 (MSW active in dev) | `/dev` |
| `test` | Run Vitest test suite | `/test` |
| `lint` | Run ESLint — must exit 0 | `/lint` |
| `build` | Next.js standalone build (`.next/` produced) | `/build` |
| `smoke` | Manual smoke test checklist for both flows | `/smoke` |

---

## Editing Workflows

1. Edit the file in `workflows/agents/` or `workflows/skills/`
2. Run `./scripts/install-workflows.sh`
3. Claude Code picks up the updated version immediately

Do **not** edit files directly in `.claude/agents/` or `.claude/skills/` — they will be overwritten on the next install.
