---
name: a6-data-db
description: Manages Prisma schema, database migrations, and data repositories — DEFERRED, not yet started
tools: Bash, Read, Write, Edit, Glob, Grep
---

<!-- DEFERRED -->

This agent has not been activated. Its phase has not started.

## Activate When
Backend phase begins and database schema needs to be defined.

## Relevant Spec Sections
- SPEC.md §9 — Data Model
- SPEC.md §17, Phase 3 — T3.2 (submission persistence)
- SPEC.md §18 — Branch: `feat/a6-db-audit-persistence`

## Scope (when activated)
- `backend/prisma/` — schema.prisma, migrations
- Repository pattern for submissions and audit trail
- No raw SQL — Prisma only

## Do not activate until
T0.1 (contract freeze) is complete and the data model in SPEC.md §9 is finalised.
