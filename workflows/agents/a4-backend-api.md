---
name: a4-backend-api
description: Implements Fastify API routes, JWT validation, and error handling — DEFERRED, not yet started
tools: Bash, Read, Write, Edit, Glob, Grep
---

<!-- DEFERRED -->

This agent has not been activated. Its phase has not started.

## Activate When
Frontend MVP is complete and backend phase begins.

## Relevant Spec Sections
- SPEC.md §8 — Backend Architecture
- SPEC.md §10 — API Contract
- SPEC.md §17, Phase 3 — T3.1 (POST /deployments)
- SPEC.md §18 — Branch: `feat/a4-backend-api-auth-validation`
- `implementation/API_SPEC_OPENAPI.yaml` — frozen contract

## Scope (when activated)
- `backend/` — Fastify server, route handlers, JWT middleware
- Error responses must match the contract in CLAUDE.md §Error Response Contract
- No modifications to `implementation/API_SPEC_OPENAPI.yaml` without an ADR

## Do not activate until
All frontend quality gates pass and PR-1 dependencies are met per SPEC.md §18.
