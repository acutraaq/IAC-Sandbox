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
| A1 | `a1-product.md` | **Active** | Requirements, ADRs, scope decisions | `implementation/SPEC.md`, `CLAUDE.md` |
| A2 | `a2-frontend-auth.md` | Stub | Microsoft Entra ID SSO, route guards | `frontend/app/login/` |
| A3 | `a3-frontend-flows.md` | **Active** | Template + Builder + Review flows | `frontend/app/templates/`, `frontend/app/builder/`, `frontend/app/review/`, `frontend/components/` (flows) |
| A4 | `a4-backend-api.md` | Stub | Fastify API, JWT validation | `backend/` |
| A5 | `a5-deployment-worker.md` | Stub | Bicep adapter, async execution | `backend/` (worker) |
| A6 | `a6-data-db.md` | Stub | Prisma schema, migrations | `backend/prisma/` |
| A7 | `a7-devops-infra.md` | Stub | Azure Bicep, GitHub Actions CI/CD | `infra/`, `.github/` |
| A8 | `a8-qa-security.md` | **Active** | Lint, tests, build, smoke, security | `frontend/__tests__/`, co-located test files |

**How to invoke:** Describe the task in natural language — Claude Code selects the matching sub-agent automatically. Or ask explicitly: *"use the A3 frontend flows agent"*.

Stub agents are installed but inactive. Each stub contains the SPEC.md sections to read before activating it.

---

## Skills

### Phase Skills (reference cards for each development phase)

| Skill | Covers | Invoke |
|-------|--------|--------|
| `phase-core` | Foundation (CSS tokens, layout, UI primitives) + Domain (types, store, lib utils) | `/phase-core` |
| `phase-templates` | Template catalog + multi-step wizard flow | `/phase-templates` |
| `phase-builder-review` | Custom resource builder + review/submit page + proof modal | `/phase-builder-review` |
| `phase-qa` | Full quality gate sequence (lint → test → build → smoke → security) | `/phase-qa` |

### Command Skills (daily dev operations)

| Skill | What it does | Invoke |
|-------|-------------|--------|
| `dev` | Start dev server on localhost:3000 (MSW active) | `/dev` |
| `test` | Run Vitest test suite | `/test` |
| `lint` | Run ESLint — must exit 0 | `/lint` |
| `build` | Static export to `/out` | `/build` |
| `smoke` | Manual smoke test checklist for both flows | `/smoke` |

---

## Editing Workflows

1. Edit the file in `workflows/agents/` or `workflows/skills/`
2. Run `./scripts/install-workflows.sh`
3. Claude Code picks up the updated version immediately

Do **not** edit files directly in `.claude/agents/` or `.claude/skills/` — they will be overwritten on the next install.
