# PondDesk Documentation

Professional documentation system for the PondDesk Fish Farm Management Platform. All content is extracted from completed architecture phases (1–12) and organized for engineering, product, and AI-assisted development.

## Project Overview

**PondDesk** is a commercial fish farm management SaaS platform for freshwater/brackish aquaculture (catfish, tilapia, and similar species).

| Layer | Technology | Status |
|-------|------------|--------|
| Frontend | Next.js 14, TypeScript, Tailwind | MVP UI complete |
| Backend | FastAPI, Python 3.13+ | Architecture through background processing complete, not implemented |
| Database | PostgreSQL 15+, SQLAlchemy 2.0 | Schema + ORM + migration strategy complete, not implemented |
| Auth | JWT + RBAC + Argon2id | Security architecture complete (Phase 10) |
| Future | Redis, Celery, AI, IoT | Async architecture designed (Phase 12); not implemented |

## Architecture Phases

| Phase | Document | Description |
|-------|----------|-------------|
| **1** | [Domain Model](./architecture/01-domain-model.md) | Business entities, rules, workflows, events |
| **2** | [Database Architecture](./architecture/02-database-architecture.md) | PostgreSQL schema, ERD, constraints, indexes |
| **3** | [API Contract](./architecture/03-api-contract.md) | REST API `/api/v1/` specification |
| **4** | [Backend Architecture](./architecture/04-backend-architecture.md) | FastAPI internal architecture blueprint |
| **5** | [ORM Model Design](./architecture/05-orm-models.md) | SQLAlchemy 2.0 models, mixins, enums, relationships |
| **6** | [Migration Strategy](./architecture/06-migration-strategy.md) | Alembic versioning, evolution, deploy & rollback |
| **7** | [Pydantic Schemas](./architecture/07-pydantic-schemas.md) | DTO layer — Create/Patch/Response, envelopes, validation |
| **8** | [Repository Layer](./architecture/08-repository-layer.md) | Async data access, Unit of Work, query & soft-delete strategy |
| **9** | [Service Layer](./architecture/09-service-layer.md) | Business workflows, rules, transactions, domain events |
| **10** | [Security Architecture](./architecture/10-security-architecture.md) | AuthN/AuthZ, JWT, RBAC, secrets, audit, hardening |
| **11** | [API Presentation Layer](./architecture/11-api-presentation-layer.md) | Thin FastAPI routes, DI, envelopes, OpenAPI, health |
| **12** | [Background Processing](./architecture/12-background-processing.md) | Celery/Redis, events, schedules, notifications, AI jobs |

## Documentation Map

```
docs/
├── README.md                          ← You are here
├── AI_DEVELOPMENT_GUIDE.md            ← Guide for AI coding assistants
│
├── architecture/                      ← Canonical design documents (Phases 1–12)
│   ├── 01-domain-model.md
│   ├── 02-database-architecture.md
│   ├── 03-api-contract.md
│   ├── 04-backend-architecture.md
│   ├── 05-orm-models.md
│   ├── 06-migration-strategy.md
│   ├── 07-pydantic-schemas.md
│   ├── 08-repository-layer.md
│   ├── 09-service-layer.md
│   ├── 10-security-architecture.md
│   ├── 11-api-presentation-layer.md
│   └── 12-background-processing.md
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
├── security/                          ← Auth, RBAC, security controls (index → Phase 10)
└── testing/                           ← Test pyramid, fixtures, CI
```

## Quick Links by Role

### Product & Operations
- [Domain Model](./architecture/01-domain-model.md) — What the system manages
- [Business Workflows](./architecture/01-domain-model.md#4-business-workflows) — Stock, feed, harvest flows
- [Business Rules](./architecture/01-domain-model.md#3-business-rules) — Invariants and policies

### Backend Engineers
- [Backend Architecture](./architecture/04-backend-architecture.md) — Start here for implementation
- [API Presentation Layer (Phase 11)](./architecture/11-api-presentation-layer.md) — Thin routes & DI
- [Background Processing (Phase 12)](./architecture/12-background-processing.md) — Celery, events, schedules
- [Backend Guide](./backend/README.md) — Layer rules and service catalog
- [ADRs](./adr/README.md) — Accepted decisions
- [AI Development Guide](./AI_DEVELOPMENT_GUIDE.md) — Rules for AI-assisted coding

### Database Engineers
- [Database Architecture](./architecture/02-database-architecture.md) — Full schema spec
- [Database Guide](./database/README.md) — Tables and conventions
- [ERD Diagram](./diagrams/database-erd.md) — Visual relationships

### API / Frontend Engineers
- [API Contract](./architecture/03-api-contract.md) — Full endpoint spec
- [API Presentation Layer (Phase 11)](./architecture/11-api-presentation-layer.md) — Route & DI design
- [API Guide](./api/README.md) — Router map and headers
- [Error Handling](./architecture/03-api-contract.md#8-error-handling-strategy) — Standard error envelope

### Security Engineers
- [Security Architecture (Phase 10)](./architecture/10-security-architecture.md) — AuthN, AuthZ, JWT, RBAC, hardening
- [Security Index](./security/README.md) — Quick reference
- [ADR-006](./adr/ADR-006-jwt-with-refresh-token-rotation.md) · [ADR-007](./adr/ADR-007-rbac-with-permission-strings.md) · [ADR-014](./adr/ADR-014-argon2id-password-hashing.md)

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

**Phase 13 — Implementation:** Backend scaffold + vertical slices (auth → ponds → batches → feeding → harvest), implementing Phases 5–12 in dependency order.

## Document Conventions

- **Canonical** documents live in `architecture/` — do not duplicate decisions elsewhere
- **Index** documents in `api/`, `database/`, `backend/` provide quick reference with links
- **ADRs** in `adr/` capture individual decisions from Phase 4 §24
- **Diagrams** in `diagrams/` are visual summaries; architecture docs are authoritative

---

*Last organized: 2026-07-09 · Source: Conversation architecture phases 1–4*
