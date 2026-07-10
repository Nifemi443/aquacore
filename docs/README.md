# PondDesk Documentation

Professional documentation system for the PondDesk Fish Farm Management Platform. All content is extracted from completed architecture phases (1–4) and organized for engineering, product, and AI-assisted development.

## Project Overview

**PondDesk** is a commercial fish farm management SaaS platform for freshwater/brackish aquaculture (catfish, tilapia, and similar species).

| Layer | Technology | Status |
|-------|------------|--------|
| Frontend | Next.js 14, TypeScript, Tailwind | MVP UI complete |
| Backend | FastAPI, Python 3.13+ | Architecture complete, not implemented |
| Database | PostgreSQL 15+, SQLAlchemy 2.0 | Architecture complete, not implemented |
| Auth | JWT + RBAC | Designed |
| Future | Redis, Celery, AI, IoT | Roadmapped |

## Architecture Phases

| Phase | Document | Description |
|-------|----------|-------------|
| **1** | [Domain Model](./architecture/01-domain-model.md) | Business entities, rules, workflows, events |
| **2** | [Database Architecture](./architecture/02-database-architecture.md) | PostgreSQL schema, ERD, constraints, indexes |
| **3** | [API Contract](./architecture/03-api-contract.md) | REST API `/api/v1/` specification |
| **4** | [Backend Architecture](./architecture/04-backend-architecture.md) | FastAPI internal architecture blueprint |

## Documentation Map

```
docs/
├── README.md                          ← You are here
├── AI_DEVELOPMENT_GUIDE.md            ← Guide for AI coding assistants
│
├── architecture/                      ← Canonical design documents (Phases 1–4)
│   ├── 01-domain-model.md
│   ├── 02-database-architecture.md
│   ├── 03-api-contract.md
│   └── 04-backend-architecture.md
│
├── api/                               ← API quick reference index
├── database/                          ← Database quick reference index
├── backend/                           ← Backend implementation index
│
├── diagrams/                          ← Mermaid visual diagrams
│   ├── domain-value-chain.md
│   ├── batch-lifecycle.md
│   ├── database-schema-layers.md
│   ├── database-erd.md
│   └── api-and-backend-layers.md
│
├── adr/                               ← Architecture Decision Records (15 ADRs)
├── deployment/                        ← Startup, Docker, environments
├── security/                          ← Auth, RBAC, security controls
└── testing/                           ← Test pyramid, fixtures, CI
```

## Quick Links by Role

### Product & Operations
- [Domain Model](./architecture/01-domain-model.md) — What the system manages
- [Business Workflows](./architecture/01-domain-model.md#4-business-workflows) — Stock, feed, harvest flows
- [Business Rules](./architecture/01-domain-model.md#3-business-rules) — Invariants and policies

### Backend Engineers
- [Backend Architecture](./architecture/04-backend-architecture.md) — Start here for implementation
- [Backend Guide](./backend/README.md) — Layer rules and service catalog
- [ADRs](./adr/README.md) — Accepted decisions
- [AI Development Guide](./AI_DEVELOPMENT_GUIDE.md) — Rules for AI-assisted coding

### Database Engineers
- [Database Architecture](./architecture/02-database-architecture.md) — Full schema spec
- [Database Guide](./database/README.md) — Tables and conventions
- [ERD Diagram](./diagrams/database-erd.md) — Visual relationships

### API / Frontend Engineers
- [API Contract](./architecture/03-api-contract.md) — Full endpoint spec
- [API Guide](./api/README.md) — Router map and headers
- [Error Handling](./architecture/03-api-contract.md#8-error-handling-strategy) — Standard error envelope

### DevOps / SRE
- [Deployment Guide](./deployment/README.md) — Startup lifecycle, health checks
- [Observability](./architecture/04-backend-architecture.md#22-observability) — Metrics, tracing, audit

### QA
- [Testing Guide](./testing/README.md) — Test pyramid and CI pipeline

## Critical Design Rules

These rules span all phases and must not be violated:

1. **Water Records belong to Ponds, not Fish Batches** — [Phase 1](./architecture/01-domain-model.md) · [Phase 2 §1.5](./architecture/02-database-architecture.md#15-critical-domain-correction)
2. **All operational data is scoped by `farm_id`** — Multi-tenant isolation at repository level
3. **All API routes under `/api/v1/`** — Versioned, stateless REST
4. **Business logic lives in Services, never in Routes or Repositories**
5. **Repositories never commit transactions** — Services own transaction boundaries
6. **Harvest cannot exceed available fish count** — Business invariant in service + domain layer

## Frontend (Current MVP)

The Next.js frontend at `/src` implements MVP modules:

| Route | Module |
|-------|--------|
| `/dashboard` | Dashboard |
| `/ponds` | Ponds |
| `/batches` | Fish Batches |
| `/feedings` | Today's Feedings |
| `/inventory` | Feed Inventory |
| `/harvest` | Harvest |
| `/reports` | Reports |
| `/settings` | Settings |

Shared navigation: `src/components/app/` (`AppSidebar`, `AppMobileNav`, `nav-config.ts`)

## Next Phase

**Phase 5 — Implementation:** Backend code following Phase 4 blueprint exactly. See [Implementation Readiness Checklist](./architecture/04-backend-architecture.md#implementation-readiness-checklist).

## Document Conventions

- **Canonical** documents live in `architecture/` — do not duplicate decisions elsewhere
- **Index** documents in `api/`, `database/`, `backend/` provide quick reference with links
- **ADRs** in `adr/` capture individual decisions from Phase 4 §24
- **Diagrams** in `diagrams/` are visual summaries; architecture docs are authoritative

---

*Last organized: 2026-07-09 · Source: Conversation architecture phases 1–4*
