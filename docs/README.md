# Documentation Index

> **Last updated:** 2026-04-26 | **Status:** Active

Welcome to the IAC Sandbox documentation. This index helps you find the right document for your role and task.

---

## Quick Links by Role

### **For Product Managers & Business Stakeholders**
- **[Complete Specification](project/SPEC.md)** — Full requirements, user journeys, success criteria, and release checklist
- **[Current Session Handoff](superpowers/HANDOFF.md)** — What was done last, open PRs, and next actions
- **[Architecture Decisions (ADRs)](project/SPEC.md#14-architecture-decisions-adrs)** — Why key technical choices were made

### **For Engineers & Developers**
- **[CLAUDE.md](../CLAUDE.md)** — **Start here.** Project conventions, tech stack, commands, canonical patterns, gotchas
- **[Complete Specification](project/SPEC.md)** — Full architecture, API contract, implementation details
- **[API Specification (OpenAPI)](project/API_SPEC_OPENAPI.yaml)** — REST endpoint contract for all integrations
- **[Active Specs & Plans](superpowers/specs/)** — Designs for features currently in flight
- **[Session Handoff](superpowers/HANDOFF.md)** — What the last session completed; context for new sessions
- **[Domain Glossary](#glossary)** — Definitions of project-specific terms

### **For DevOps & Platform Teams**
- **[CLAUDE.md — Infrastructure Section](../CLAUDE.md#architecture)** — Architecture, Azure resources, CI/CD
- **[SPEC.md — Section 8 (Backend)](project/SPEC.md#8-backend-architecture-v2)** — API routes, Azure Functions, networking
- **[API Specification](project/API_SPEC_OPENAPI.yaml)** — Health checks, deployment status endpoints
- **[GitHub Actions Workflow](.github/workflows/ci.yml)** — CI/CD configuration for web and Functions

### **For Security & Compliance**
- **[Security Controls (SPEC.md)](project/SPEC.md#21-security-controls)** — Auth, CORS, rate limiting, secrets
- **[Architecture Decisions (ADRs)](project/SPEC.md#14-architecture-decisions-adrs)** — Security rationale behind key choices
- **[Complete Specification — Section 11 (Auth)](project/SPEC.md#11-authentication-and-identity)** — Microsoft Entra ID, JWT validation

---

## Document Organization

```
docs/
├── README.md                    (you are here)
├── GLOSSARY.md                  (domain terminology)
├── project/
│   ├── SPEC.md                  Complete specification (requirements, design, ADRs)
│   └── API_SPEC_OPENAPI.yaml    REST API contract
├── superpowers/
│   ├── HANDOFF.md               Previous session context & open PRs
│   ├── specs/                   Active design documents (non-archived)
│   ├── plans/                   Active implementation plans
│   └── archive/                 Completed plans & superseded specs
└── (project root)
    └── CLAUDE.md                Project conventions, tech stack, gotchas
```

---

## What's Inside Each Document

### CLAUDE.md
**Purpose:** Single source of truth for project conventions and developer guidance.  
**Contains:** Tech stack, directory layout, development commands, canonical patterns, quality gates, gotchas.  
**Audience:** All engineers; read in full at the start of each session.  
**Status:** Active; updated whenever patterns or conventions change.

### docs/project/SPEC.md
**Purpose:** Complete specification and architectural reference.  
**Contains:** Requirements, user journeys, architecture, API contract, data model, ADRs, implementation backlogs, risk matrix.  
**Audience:** Product, engineering, DevOps.  
**Status:** Active; versioned (currently v2.0.0).  
**Note:** Sections marked `[v2]` reflect the as-built architecture (v1.2.0 plan was superseded; see ADRs 016–019).

### docs/project/API_SPEC_OPENAPI.yaml
**Purpose:** OpenAPI 3.1 specification for REST API integration.  
**Contains:** Endpoint schemas, request/response models, status codes, examples.  
**Audience:** Backend engineers, API integrators.  
**Status:** Active; updated whenever API changes.

### docs/superpowers/HANDOFF.md
**Purpose:** Context for new sessions when continuing from prior work.  
**Contains:** Open PRs, what was done, decision trees, what's blocked, standing user preferences.  
**Audience:** Engineers starting a new session.  
**Status:** Active; updated at end of each session.

### docs/superpowers/specs/ (Active)
**Purpose:** Design documents for features currently in flight.  
**Contains:** One spec per feature; includes design, acceptance criteria, security/performance implications.  
**Status:** Non-archived specs are active and being implemented.  
**Naming:** `YYYY-MM-DD-<scope>-design.md`

### docs/superpowers/plans/ (Active)
**Purpose:** Implementation plans for work in progress.  
**Contains:** Step-by-step tasks, file ownership, testing strategy.  
**Status:** Non-archived plans are active.  
**Naming:** `YYYY-MM-DD-<scope>.md`

### docs/superpowers/archive/
**Purpose:** Completed implementations and superseded designs.  
**Contains:** Plans and specs from prior sessions.  
**Status:** Historical; read only if understanding past decisions or revisiting archived features.

---

## Glossary

See the [full Domain Glossary](GLOSSARY.md) for definitions of project-specific terms.

**Quick reference:**
- **ARM** — Azure Resource Manager (Microsoft's infrastructure-as-code service)
- **Deployment** — User request to create or modify Azure infrastructure
- **Proof** — Copyable plain-text artifact for manual HOD approval
- **RG / Resource Group** — Azure resource container (user-deployed)
- **SubmissionId** — UUID generated per deployment request; used for status polling
- **Policy tags** — Required metadata on all resources (Cost Center, Project ID, Project Owner, Expiry Date)

---

## Document Lifecycle

### How to Keep Documentation Current

1. **When changing code:** Update relevant sections in `CLAUDE.md` (patterns, gotchas, commands)
2. **When changing requirements:** Update `SPEC.md` and bump the version in the `info` block
3. **When making architectural decisions:** Add an ADR to Section 14 of `SPEC.md`
4. **When starting a new session:** Read `CLAUDE.md` in full, then check `HANDOFF.md`
5. **At end of session:** Update `HANDOFF.md` with open PRs, blockers, and next actions
6. **When archiving a spec or plan:** Move the file to `docs/superpowers/archive/`

### Version & Status Conventions

Every document's metadata block includes:
- **Version** (semantic: `major.minor.patch`) — increment when making breaking changes
- **Last updated** (ISO date: `YYYY-MM-DD`) — for freshness assessment
- **Status** — one of: `Draft`, `Active`, `Review`, `Superseded`, `Archived`

Example:
```markdown
> **Version:** 1.2.0 | **Last updated:** 2026-04-26 | **Status:** Active
```

---

## Navigation Tips

- **Lost?** Check your role section above.
- **Need the API contract?** See `API_SPEC_OPENAPI.yaml`.
- **Need to understand a past decision?** Search Section 14 (ADRs) in `SPEC.md`.
- **Need context for current work?** Read `HANDOFF.md` first.
- **Need to learn project conventions?** Start with `CLAUDE.md`.
- **Need to define a domain term?** See `GLOSSARY.md`.

---

## Feedback

If documentation is unclear or out of sync with the code:
1. File an issue (GitHub Issues)
2. Or comment in the PR that fixed the issue

Documentation is part of the definition of done — help keep it current.
