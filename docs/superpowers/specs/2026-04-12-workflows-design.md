# Workflows Design — Agents & Skills Organisation

**Date:** 2026-04-12
**Status:** Approved, ready for implementation
**Project:** IAC Sandbox — Sandbox Azure Deployer

---

## 1. Problem

The project has a well-defined agent model (SPEC.md §17) and development phases (SPEC.md §15) but no corresponding Claude Code artifacts to activate them. Developers must manually read the spec to know which agent owns what and which commands to run for each phase. This slows onboarding and makes it easy to work in the wrong context.

---

## 2. Goal

Create a `workflows/` directory at the project root that serves as the **single source of truth** for all Claude Code sub-agent definitions and project-local skills. An install script copies them into `.claude/` so Claude Code can discover and invoke them.

---

## 3. Directory Structure

```
/IAC Sandbox/
├── workflows/
│   ├── README.md                       ← index: agents + skills quick-reference
│   ├── agents/
│   │   ├── a1-product.md               ← active
│   │   ├── a2-frontend-auth.md         ← stub (deferred)
│   │   ├── a3-frontend-flows.md        ← active
│   │   ├── a4-backend-api.md           ← stub (deferred)
│   │   ├── a5-deployment-worker.md     ← stub (deferred)
│   │   ├── a6-data-db.md               ← stub (deferred)
│   │   ├── a7-devops-infra.md          ← stub (deferred)
│   │   └── a8-qa-security.md           ← active
│   └── skills/
│       ├── phase/
│       │   ├── phase-core.md           ← Foundation + Domain (Phases 1–2)
│       │   ├── phase-templates.md      ← Template catalog + wizard (Phase 3b)
│       │   ├── phase-builder-review.md ← Builder + Review/Submit (Phases 3c–3d)
│       │   └── phase-qa.md             ← Quality gates (Phase 4)
│       └── commands/
│           ├── dev.md
│           ├── test.md
│           ├── lint.md
│           ├── build.md
│           └── smoke.md
│
├── scripts/
│   └── install-workflows.sh            ← idempotent, copies workflows/ → .claude/
│
├── .claude/
│   ├── settings.local.json             ← existing, unchanged
│   ├── agents/                         ← runtime target (populated by script)
│   └── skills/                         ← runtime target (populated by script)
│
├── frontend/
├── implementation/
└── CLAUDE.md
```

`workflows/` is committed and edited. `.claude/agents/` and `.claude/skills/` are populated by `./scripts/install-workflows.sh` — they are not committed (added to `.gitignore`).

---

## 4. Agent Definitions

Each agent file uses Claude Code's frontmatter format:

```markdown
---
name: <agent-id>
description: <one-line — used by Claude Code for auto-selection>
tools: <comma-separated tool list>
---
<instructions>
```

### Active Agents

#### A1 — Product/Coordination (`a1-product.md`)
- **When to use:** Updating requirements, writing or revising ADRs, reviewing scope decisions, maintaining SPEC.md
- **File ownership:** `implementation/SPEC.md`, `implementation/API_SPEC_OPENAPI.yaml` (read-only without ADR), `CLAUDE.md`
- **Tools:** Read, Write, Edit, Glob, Grep, WebSearch
- **Key rules:**
  - Cannot modify `API_SPEC_OPENAPI.yaml` without first writing an ADR in SPEC.md §14
  - Acceptance criteria must be testable and reference specific SPEC.md sections

#### A3 — Frontend Flows (`a3-frontend-flows.md`)
- **When to use:** Implementing template catalog, wizard stepper, custom builder, review page, confirmation modal, proof report
- **File ownership:** `frontend/app/templates/`, `frontend/app/builder/`, `frontend/app/review/`, `frontend/components/templates/`, `frontend/components/wizard/`, `frontend/components/builder/`, `frontend/components/review/`
- **Tools:** Bash, Read, Write, Edit, Glob, Grep
- **Key rules:**
  - TypeScript strict — no `any`
  - All state via `deploymentStore` (Zustand) — no component-local cross-route state
  - Every interactive component must include ARIA labels, keyboard support, reduced-motion safety
  - Validate all input with Zod via `buildSchema`

#### A8 — QA/Security/Release (`a8-qa-security.md`)
- **When to use:** Running quality gates, security review, E2E tests, release checklist
- **File ownership:** `frontend/__tests__/`, test files co-located with components
- **Tools:** Bash, Read, Glob, Grep
- **Key rules:**
  - Quality gate sequence: `npm run lint` → `npm run test:run` → `npm run build` — all must pass
  - Smoke test both flows (template + custom) end-to-end after build
  - Verify theme toggle persists across page loads
  - Verify keyboard navigation works in all modals and drawers
  - No console errors on any happy path

### Stub Agents (Deferred)

All stub agents (`a2`, `a4`–`a7`) contain only:
- A `<!-- DEFERRED -->` marker
- A pointer to the relevant SPEC.md section(s)
- A note on what activates them (e.g., "activate when backend phase begins")

They are installed but will not be auto-selected by Claude Code for current frontend work.

---

## 5. Skill Definitions

Each skill file uses the project-local skill format:

```markdown
---
name: <skill-name>
description: <one-line>
---
<skill content>
```

### Phase Skills

Phase skills are **one-page reference cards** — not orchestration scripts. Each one states: files in scope, what done looks like, and which quality gates must pass. Claude Code reads the card and executes accordingly.

#### `phase-core` — Foundation + Domain (Phases 1–2)
- **Scope:** `frontend/app/globals.css`, `frontend/app/layout.tsx`, `frontend/components/layout/`, `frontend/components/ui/`, `frontend/types/index.ts`, `frontend/data/`, `frontend/store/deploymentStore.ts`, `frontend/lib/`
- **Done when:** CSS tokens defined, PageShell/Nav/ThemeToggle render, Button/Card/Badge/Modal/Toast exist with ARIA, all types exported, store initialises, `buildSchema`/`getIcon`/`generateReport`/`submitDeployment` implemented
- **Quality gates:** lint + test + build pass

#### `phase-templates` — Template Catalog + Wizard (Phase 3b)
- **Scope:** `frontend/app/templates/`, `frontend/components/templates/`, `frontend/components/wizard/`
- **Done when:** `/templates` lists 8 templates with FilterPills, `/templates/[slug]` runs multi-step wizard with SummaryPanel, payload written to `deploymentStore`
- **Quality gates:** lint + test + build pass

#### `phase-builder-review` — Builder + Review/Submit (Phases 3c–3d)
- **Scope:** `frontend/app/builder/`, `frontend/app/review/`, `frontend/components/builder/`, `frontend/components/review/`, `frontend/lib/api.ts`, `frontend/lib/report.ts`, `frontend/mocks/handlers.ts`
- **Done when:** `/builder` lets users add resources (no duplicates), `/review` guards empty store, `POST /deployments` called via MSW mock, confirmation modal shows copyable proof artifact
- **Quality gates:** lint + test + build pass; smoke test both flows

#### `phase-qa` — Quality Gates (Phase 4)
- **Scope:** entire `frontend/`
- **Done when:** 0 lint errors, all Vitest tests pass, `/out` directory produced, smoke checklist passes, no console errors on any happy path
- **Quality gates:** this IS the quality gate phase

### Command Skills

Each command skill runs from `frontend/` and surfaces errors clearly.

| Skill | Command | Output |
|-------|---------|--------|
| `dev` | `npm run dev` | Starts localhost:3000; reminds that MSW is active |
| `test` | `npm run test:run` | Vitest output; surfaces failing test name + file:line |
| `lint` | `npm run lint` | ESLint; must exit 0 |
| `build` | `npm run build` | Static export; confirms `/out` produced |
| `smoke` | *(checklist)* | Manual: both flows, theme toggle persistence, keyboard nav, no console errors |

Phase skill instructions require Claude to run lint + test + build before declaring a phase done — `phase-templates` always ends with those three gates.

---

## 6. Install Script (`scripts/install-workflows.sh`)

Behaviour:
1. Creates `.claude/agents/` and `.claude/skills/` if they don't exist
2. Copies `workflows/agents/*.md` → `.claude/agents/`
3. Copies `workflows/skills/phase/*.md` → `.claude/skills/`
4. Copies `workflows/skills/commands/*.md` → `.claude/skills/`
5. Prints a summary of what was copied
6. Idempotent — safe to re-run after editing any workflow file

Run after cloning and after editing any file in `workflows/`.

---

## 7. Version Control Note

The project root (`/IAC Sandbox/`) currently has no git repo — git lives in `frontend/`. `workflows/` and `scripts/` should be committed when a root-level repo is initialised.

When that happens, add to the root `.gitignore`:

```
.claude/agents/
.claude/skills/
```

`workflows/` is the source of truth. The `.claude/` runtime targets are generated by the install script and should not be committed.

---

## 8. `workflows/README.md` Contents

A quick-reference table:
- All 8 agents: name, status (active/stub), one-line description, file ownership
- All 9 skills: name, type (phase/command), one-line description
- How to install: `./scripts/install-workflows.sh`
- How to invoke an agent: describe the task in natural language — Claude Code selects the matching sub-agent automatically, or you can ask explicitly ("use the A3 frontend flows agent")
- How to invoke a skill: `/<skill-name>` (e.g. `/test`, `/phase-qa`)

---

## 9. Acceptance Criteria

- [ ] `./scripts/install-workflows.sh` runs without error on a fresh clone
- [ ] `.claude/agents/` contains exactly 8 `.md` files after install
- [ ] `.claude/skills/` contains exactly 9 `.md` files after install
- [ ] Invoking `/test` runs `npm run test:run` from `frontend/`
- [ ] Invoking `/phase-qa` surfaces the quality gate checklist and runs lint + test + build
- [ ] A3 agent only touches files within its declared file ownership
- [ ] A8 agent only reads files and runs the three quality-gate commands
- [ ] `workflows/` and `scripts/` are committed; `.claude/agents/` and `.claude/skills/` are gitignored
