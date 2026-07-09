# FastAPI Backend Architecture

> **Phase:** 4 — Application Blueprint  
> **Status:** Approved — Pre-Implementation  
> **Project:** AquaCore Fish Farm Management Platform

Internal FastAPI application architecture: Clean Architecture, DI, repositories, services, and production readiness.

## Related Documents

- [Domain Model](./01-domain-model.md) — Phase 1 bounded contexts
- [Database Architecture](./02-database-architecture.md) — Phase 2 persistence
- [API Contract](./03-api-contract.md) — Phase 3 route contract
- [Backend Guide](../backend/README.md) — Implementation quick reference
- [ADRs](../adr/README.md) — Architecture decision records
- [Testing](../testing/README.md) — Test strategy
- [Deployment](../deployment/README.md) — Runtime & startup lifecycle

---

## Table of Contents

- [Phase 4 — FastAPI Internal Architecture & Application Blueprint](#phase-4-fastapi-internal-architecture-application-blueprint)
  - [1. Architectural Overview](#1-architectural-overview)
    - [1.1 Architectural Style](#11-architectural-style)
    - [1.2 Core Principles & Rationale](#12-core-principles-rationale)
    - [1.3 Bounded Contexts (from Phase 1)](#13-bounded-contexts-from-phase-1)
  - [2. Folder Structure](#2-folder-structure)
    - [2.1 Folder Responsibilities & Anti-Patterns](#21-folder-responsibilities-anti-patterns)
  - [3. Layer Responsibilities](#3-layer-responsibilities)
    - [3.1 Dependency Rule](#31-dependency-rule)
    - [3.2 Layer Summary](#32-layer-summary)
  - [4. Application Startup Lifecycle](#4-application-startup-lifecycle)
    - [4.1 Boot Sequence (Order Matters)](#41-boot-sequence-order-matters)
    - [4.2 Why Order Matters](#42-why-order-matters)
    - [4.3 Application Factory Pattern](#43-application-factory-pattern)
  - [5. Configuration Management](#5-configuration-management)
    - [5.1 Settings Architecture](#51-settings-architecture)
    - [5.2 Environment Profiles](#52-environment-profiles)
    - [5.3 Secret Management](#53-secret-management)
    - [5.4 Best Practices](#54-best-practices)
  - [6. Database Session Lifecycle](#6-database-session-lifecycle)
    - [6.1 Connection Management](#61-connection-management)
    - [6.2 Session Lifecycle (Per Request)](#62-session-lifecycle-per-request)
    - [6.3 Transaction Boundaries](#63-transaction-boundaries)
    - [6.4 Unit of Work Pattern](#64-unit-of-work-pattern)
    - [6.5 Session Flow Diagram](#65-session-flow-diagram)
  - [7. Dependency Injection Design](#7-dependency-injection-design)
    - [7.1 DI Hierarchy](#71-di-hierarchy)
    - [7.2 Injection Rules](#72-injection-rules)
    - [7.3 Route Usage Pattern (Conceptual)](#73-route-usage-pattern-conceptual)
    - [7.4 Testing DI](#74-testing-di)
  - [8. Repository Architecture](#8-repository-architecture)
    - [8.1 Responsibilities (ONLY)](#81-responsibilities-only)
    - [8.2 Repositories NEVER](#82-repositories-never)
    - [8.3 Repository Interface Pattern](#83-repository-interface-pattern)
    - [8.4 Query Conventions](#84-query-conventions)
  - [9. Service Architecture](#9-service-architecture)
    - [9.1 Services SHOULD](#91-services-should)
    - [9.2 Services NEVER](#92-services-never)
    - [9.3 Service Catalog (AquaCore)](#93-service-catalog-aquacore)
    - [9.4 Service Method Signature Convention](#94-service-method-signature-convention)
  - [10. Route Architecture](#10-route-architecture)
    - [10.1 Routes ONLY](#101-routes-only)
    - [10.2 Routes NEVER](#102-routes-never)
    - [10.3 Route Organization (Phase 3 Contract)](#103-route-organization-phase-3-contract)
    - [10.4 Why Thin Routes Matter](#104-why-thin-routes-matter)
  - [11. Schema Strategy](#11-schema-strategy)
    - [11.1 Schema Separation](#111-schema-separation)
    - [11.2 Why Separate Schemas](#112-why-separate-schemas)
    - [11.3 Schema Naming Convention](#113-schema-naming-convention)
    - [11.4 Mapping Strategy](#114-mapping-strategy)
  - [12. Validation Strategy](#12-validation-strategy)
    - [12.1 Three Validation Layers](#121-three-validation-layers)
    - [12.2 Examples](#122-examples)
    - [12.3 Decision Matrix](#123-decision-matrix)
  - [13. Authentication & Authorization](#13-authentication-authorization)
    - [13.1 Authentication Flow](#131-authentication-flow)
    - [13.2 Password Security](#132-password-security)
    - [13.3 JWT Claims](#133-jwt-claims)
    - [13.4 Authorization (RBAC)](#134-authorization-rbac)
    - [13.5 Where Authorization Occurs](#135-where-authorization-occurs)
  - [14. Middleware Stack](#14-middleware-stack)
    - [14.1 Recommended Stack (Outermost → Innermost)](#141-recommended-stack-outermost-innermost)
    - [14.2 Middleware NOT Recommended as Global](#142-middleware-not-recommended-as-global)
    - [14.3 CORS Configuration](#143-cors-configuration)
  - [15. Exception Handling](#15-exception-handling)
    - [15.1 Exception Hierarchy](#151-exception-hierarchy)
    - [15.2 Standardized Error Response](#152-standardized-error-response)
    - [15.3 Handler Registration](#153-handler-registration)
    - [15.4 Rules](#154-rules)
  - [16. Logging Strategy](#16-logging-strategy)
    - [16.1 Log Categories](#161-log-categories)
    - [16.2 Structured Logging Format](#162-structured-logging-format)
    - [16.3 Rules](#163-rules)
  - [17. Background Task Design](#17-background-task-design)
    - [17.1 Task Classification](#171-task-classification)
    - [17.2 Task Architecture (Phased)](#172-task-architecture-phased)
    - [17.3 Task Flow](#173-task-flow)
    - [17.4 Task Status Tracking](#174-task-status-tracking)
  - [18. Event System](#18-event-system)
    - [18.1 Domain Events](#181-domain-events)
    - [18.2 Event Architecture (Phased)](#182-event-architecture-phased)
    - [18.3 Event Contract](#183-event-contract)
    - [18.4 Rules](#184-rules)
  - [19. Storage Strategy](#19-storage-strategy)
    - [19.1 File Categories](#191-file-categories)
    - [19.2 Storage Abstraction](#192-storage-abstraction)
    - [19.3 File Metadata (Database)](#193-file-metadata-database)
  - [20. Security Architecture](#20-security-architecture)
  - [21. Testing Architecture](#21-testing-architecture)
    - [21.1 Test Pyramid](#211-test-pyramid)
    - [21.2 Test Categories](#212-test-categories)
    - [21.3 Fixtures & Factories](#213-fixtures-factories)
    - [21.4 Mocking Strategy](#214-mocking-strategy)
    - [21.5 CI Pipeline](#215-ci-pipeline)
  - [22. Observability](#22-observability)
    - [22.1 Health Checks](#221-health-checks)
    - [22.2 Metrics (Future Prometheus)](#222-metrics-future-prometheus)
    - [22.3 Tracing (Future)](#223-tracing-future)
    - [22.4 Error Tracking](#224-error-tracking)
    - [22.5 Audit Trail](#225-audit-trail)
  - [23. Scalability Roadmap](#23-scalability-roadmap)
    - [23.1 Current Architecture (MVP)](#231-current-architecture-mvp)
    - [23.2 Growth Phases](#232-growth-phases)
    - [23.3 Future Service Decomposition](#233-future-service-decomposition)
    - [23.4 Why Monolith First](#234-why-monolith-first)
    - [23.5 Scaling Enablers Built Into This Design](#235-scaling-enablers-built-into-this-design)
  - [24. Architecture Decision Rationale (ADR Summary)](#24-architecture-decision-rationale-adr-summary)
  - [Implementation Readiness Checklist](#implementation-readiness-checklist)

---


## 1. Architectural Overview

### 1.1 Architectural Style

AquaCore backend follows **Clean Architecture** with **Domain-Driven Design (DDD)** applied pragmatically — not as ceremony, but where domain complexity justifies it (harvest workflows, feeding compliance, inventory depletion, batch lifecycle).

```
┌─────────────────────────────────────────────────────────────┐
│  Delivery Layer (API Routes, Middleware, Webhooks)          │
├─────────────────────────────────────────────────────────────┤
│  Application Layer (Services, Use Cases, DTOs/Schemas)      │
├─────────────────────────────────────────────────────────────┤
│  Domain Layer (Entities, Value Objects, Domain Events,      │
│                 Domain Exceptions, Business Rules)          │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer (Repositories, DB, Storage, Email,    │
│                         Cache, Task Queue, External APIs)   │
└─────────────────────────────────────────────────────────────┘
         Dependencies point INWARD only
```

### 1.2 Core Principles & Rationale

| Principle | Application in AquaCore | Why |
|---|---|---|
| **Clean Architecture** | Routes → Services → Repositories → DB; domain rules never import FastAPI/SQLAlchemy | Keeps business logic testable and framework-agnostic after 5 years |
| **SOLID** | Single-responsibility services (`HarvestService`, not `FarmService` god object); repository interfaces per aggregate | Prevents the “10,000-line service” anti-pattern common in farm ops platforms |
| **Separation of Concerns** | Validation split across schema, service, and DB constraint layers | Each layer fails fast at the right abstraction level |
| **Dependency Injection** | FastAPI `Depends()` + explicit factory providers | Enables swapping Postgres for test DB, mocking repos in unit tests |
| **DDD (pragmatic)** | Aggregates: `Farm`, `Pond`, `FishBatch`, `Feeding`, `Harvest`, `FeedInventory` | Farm operations have real invariants (you cannot harvest more fish than exist) |
| **Repository Pattern** | One repo per aggregate root, not per table | Hides SQLAlchemy session mechanics from services |
| **Service Layer** | All workflows orchestrated here | Routes stay thin; business rules have one home |
| **Production Readiness** | Structured logging, health checks, graceful shutdown, idempotent tasks | Farm data loss or silent failures are unacceptable in production |

### 1.3 Bounded Contexts (from Phase 1)

| Context | Primary Aggregates | Notes |
|---|---|---|
| **Identity & Access** | User, Role, Permission, FarmMembership | Multi-tenant by `farm_id` |
| **Farm Operations** | Farm, Pond, FishBatch | Pond is child of Farm |
| **Daily Operations** | Feeding, WaterRecord (future) | High write volume |
| **Inventory** | FeedItem, StockMovement, VendorDelivery | Stock invariants |
| **Harvest & Sales** | Harvest, HarvestLine | Revenue-critical |
| **Reporting** | ReportJob, ReportArtifact | Async generation |
| **Notifications** | Notification, AlertRule | Event-driven |
| **Platform** | Settings, AuditLog, FileAsset | Cross-cutting |

---

## 2. Folder Structure

```
backend/
├── app/
│   ├── main.py                          # App factory entrypoint
│   ├── __init__.py
│   │
│   ├── api/                             # HTTP delivery layer
│   │   ├── __init__.py
│   │   ├── router.py                    # Root API router aggregator
│   │   └── v1/                          # Versioned endpoints (Phase 3 contract)
│   │       ├── __init__.py
│   │       ├── router.py
│   │       ├── deps.py                  # Route-level dependency aliases
│   │       └── endpoints/
│   │           ├── auth.py
│   │           ├── farms.py
│   │           ├── ponds.py
│   │           ├── batches.py
│   │           ├── feedings.py
│   │           ├── inventory.py
│   │           ├── harvest.py
│   │           ├── reports.py
│   │           ├── settings.py
│   │           ├── users.py
│   │           └── health.py
│   │
│   ├── core/                            # App-wide primitives
│   │   ├── __init__.py
│   │   ├── constants.py                 # Enums, magic strings banned here
│   │   ├── types.py                     # Type aliases (FarmId, UserId)
│   │   └── pagination.py                # Cursor/offset pagination helpers
│   │
│   ├── config/                          # Configuration only
│   │   ├── __init__.py
│   │   ├── settings.py                  # Pydantic Settings (env parsing)
│   │   └── environments.py              # Dev/Test/Staging/Prod profiles
│   │
│   ├── database/                        # Persistence infrastructure
│   │   ├── __init__.py
│   │   ├── base.py                      # Declarative Base, metadata
│   │   ├── session.py                   # Engine, session factory, UoW
│   │   └── mixins.py                    # TimestampMixin, SoftDeleteMixin
│   │
│   ├── models/                          # SQLAlchemy ORM models ONLY
│   │   ├── __init__.py
│   │   ├── identity/
│   │   ├── farm/
│   │   ├── operations/
│   │   ├── inventory/
│   │   ├── harvest/
│   │   └── platform/
│   │
│   ├── schemas/                         # Pydantic v2 DTOs ONLY
│   │   ├── __init__.py
│   │   ├── common.py                    # Pagination, ErrorResponse, IDs
│   │   ├── auth/
│   │   ├── farms/
│   │   ├── ponds/
│   │   ├── batches/
│   │   ├── feedings/
│   │   ├── inventory/
│   │   ├── harvest/
│   │   ├── reports/
│   │   └── settings/
│   │
│   ├── domain/                          # Pure domain logic (no framework imports)
│   │   ├── __init__.py
│   │   ├── entities/                    # Domain entities (optional, rich models)
│   │   ├── value_objects/               # Money, Weight, StockQuantity
│   │   ├── events/                      # Domain event definitions
│   │   ├── exceptions/                  # Business rule exceptions
│   │   └── rules/                       # Pure functions: harvest eligibility, etc.
│   │
│   ├── repositories/                    # Data access interfaces + implementations
│   │   ├── __init__.py
│   │   ├── base.py                      # Abstract base repository
│   │   ├── interfaces/                  # Protocol/ABC per aggregate
│   │   └── sqlalchemy/                  # Concrete SQLAlchemy repos
│   │
│   ├── services/                        # Application / use-case layer
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── farm_service.py
│   │   ├── pond_service.py
│   │   ├── batch_service.py
│   │   ├── feeding_service.py
│   │   ├── inventory_service.py
│   │   ├── harvest_service.py
│   │   ├── report_service.py
│   │   ├── notification_service.py
│   │   └── settings_service.py
│   │
│   ├── dependencies/                    # FastAPI DI providers
│   │   ├── __init__.py
│   │   ├── db.py                        # get_db_session
│   │   ├── auth.py                      # get_current_user
│   │   ├── permissions.py               # require_permission()
│   │   ├── services.py                # Service factory providers
│   │   └── repositories.py            # Repo factory providers
│   │
│   ├── middleware/                      # ASGI middleware
│   │   ├── __init__.py
│   │   ├── request_id.py
│   │   ├── request_logging.py
│   │   ├── timing.py
│   │   └── security_headers.py
│   │
│   ├── security/                        # Auth/crypto primitives
│   │   ├── __init__.py
│   │   ├── jwt.py                       # Token encode/decode
│   │   ├── password.py                  # Argon2/bcrypt hashing
│   │   ├── tokens.py                    # Refresh token rotation
│   │   └── permissions.py               # RBAC matrix
│   │
│   ├── permissions/                     # Authorization policies
│   │   ├── __init__.py
│   │   ├── roles.py                     # Admin, Manager, Worker
│   │   ├── policies.py                  # Resource-level policy checks
│   │   └── matrix.py                    # Role × Permission × Resource
│   │
│   ├── validators/                      # Reusable validation helpers
│   │   ├── __init__.py
│   │   ├── email.py
│   │   ├── quantities.py
│   │   └── farm_scoped.py
│   │
│   ├── events/                          # Event bus infrastructure
│   │   ├── __init__.py
│   │   ├── bus.py                       # In-process dispatcher
│   │   ├── handlers/                    # Event handler registrations
│   │   └── publishers.py               # Future: Redis/Kafka publishers
│   │
│   ├── tasks/                           # Background/async task definitions
│   │   ├── __init__.py
│   │   ├── celery_app.py               # Future Celery app
│   │   ├── report_tasks.py
│   │   ├── notification_tasks.py
│   │   └── scheduled_tasks.py
│   │
│   ├── storage/                         # File storage abstraction
│   │   ├── __init__.py
│   │   ├── base.py                      # StorageBackend protocol
│   │   ├── local.py                     # Dev: local filesystem
│   │   └── s3.py                        # Future: S3/GCS
│   │
│   ├── reports/                         # Report generation engines
│   │   ├── __init__.py
│   │   ├── engine.py                    # Orchestrator
│   │   ├── templates/                   # Jinja/HTML templates
│   │   └── exporters/                   # PDF, Excel exporters
│   │
│   ├── notifications/                   # Notification channels
│   │   ├── __init__.py
│   │   ├── email.py
│   │   ├── in_app.py
│   │   └── templates/
│   │
│   ├── exceptions/                      # HTTP-mapped exception hierarchy
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── auth.py
│   │   ├── business.py
│   │   └── handlers.py                  # FastAPI exception handlers
│   │
│   └── logging/                         # Logging configuration
│       ├── __init__.py
│       ├── config.py
│       ├── formatters.py                # JSON structured formatter
│       └── audit.py                     # Audit log writer
│
├── migrations/                          # Alembic (at project root, not inside app/)
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│
├── tests/
│   ├── conftest.py
│   ├── factories/                       # Test data factories
│   ├── fixtures/                        # Shared fixtures
│   ├── unit/
│   │   ├── domain/
│   │   ├── services/
│   │   └── validators/
│   ├── integration/
│   │   ├── repositories/
│   │   └── database/
│   └── api/
│       ├── v1/
│       └── auth/
│
├── scripts/
│   ├── seed_dev.py
│   ├── create_admin.py
│   └── migrate.sh
│
├── docker/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── docker-compose.yml
│
├── pyproject.toml
├── alembic.ini
├── .env.example
└── README.md
```

### 2.1 Folder Responsibilities & Anti-Patterns

| Folder | Responsibility | NEVER place here |
|---|---|---|
| `api/` | HTTP routing, request/response mapping, status codes | Business logic, SQL, direct ORM calls |
| `core/` | Cross-cutting primitives, pagination, IDs | Feature-specific logic, DB models |
| `config/` | Env parsing, settings objects | Runtime business rules, secrets in code |
| `database/` | Engine, session factory, UoW, mixins | ORM model definitions (→ `models/`) |
| `models/` | SQLAlchemy table mappings | Pydantic schemas, business rules |
| `schemas/` | Request/response DTOs, serialization | DB queries, authorization logic |
| `domain/` | Pure business rules, events, value objects | FastAPI, SQLAlchemy, HTTP imports |
| `repositories/` | CRUD + query composition per aggregate | Business workflows, email sending |
| `services/` | Use cases, orchestration, transactions | Raw SQL strings, HTTP response building |
| `dependencies/` | FastAPI `Depends()` wiring | Business logic |
| `middleware/` | Cross-cutting HTTP concerns | Domain rules |
| `security/` | Crypto, JWT, password hashing | Route handlers |
| `permissions/` | RBAC definitions and policy checks | Authentication (token parsing → `security/`) |
| `validators/` | Reusable field-level validators | Full workflow validation (→ `services/`) |
| `events/` | Event bus, handlers, publishers | Synchronous request handling |
| `tasks/` | Async job definitions | HTTP request logic |
| `storage/` | File I/O abstraction | Business metadata about files (→ `services/`) |
| `reports/` | Report rendering/export | API routes |
| `notifications/` | Channel delivery (email, in-app) | Business decision of *when* to notify (→ `services/`) |
| `exceptions/` | Exception types + HTTP mapping | Business rule implementation |
| `logging/` | Log config, formatters, audit writer | Application logic |
| `tests/` | All test code | Production code imports from tests |
| `migrations/` | Alembic revision scripts | Application runtime code |
| `scripts/` | One-off ops/seed scripts | Core application modules |

---

## 3. Layer Responsibilities

### 3.1 Dependency Rule

```
Routes  →  Services  →  Repositories  →  ORM Models  →  PostgreSQL
              ↓
           Domain Rules (pure functions, no I/O)
              ↓
           Events  →  Handlers  →  Tasks / Notifications
```

**No layer may import from a layer above it.** `domain/` imports nothing from `api/`, `services/`, or `models/`. `services/` may import `repositories/` and `domain/` but never `api/`.

### 3.2 Layer Summary

| Layer | Owns | Does Not Own |
|---|---|---|
| **Routes** | HTTP semantics, input binding, response serialization | Business rules, transactions |
| **Schemas** | Data shape, field constraints, OpenAPI docs | Persistence, authorization decisions |
| **Services** | Workflows, invariants, transaction boundaries | SQL, HTTP status code selection |
| **Repositories** | Query composition, persistence operations | "Can this harvest happen?" logic |
| **Domain** | Invariants as pure functions, events, value objects | I/O of any kind |
| **Infrastructure** | DB, cache, storage, email, task queue | Business policy |

---

## 4. Application Startup Lifecycle

### 4.1 Boot Sequence (Order Matters)

```
1.  Logging Initialization          ← Everything else must be observable
2.  Configuration Loading           ← Fail fast on missing secrets
3.  Environment Validation        ← Reject prod config in dev, etc.
4.  Database Engine Creation      ← Connection pool before any request
5.  Dependency Registration       ← Wire factories before routes need them
6.  Exception Handler Registration← Before first request can fail
7.  Middleware Registration         ← Outermost first (LIFO execution)
8.  Router Registration             ← Routes depend on all above
9.  Event Handler Registration      ← Subscribe domain event handlers
10. Health Check Endpoints          ← Orchestrator needs these immediately
11. Startup Event Hooks             ← Warm caches, verify storage backend
12. [RUNNING]
13. Shutdown Event Hooks            ← Drain connections, flush logs
14. Database Engine Disposal        ← Close pool gracefully
```

### 4.2 Why Order Matters

| Step | Failure if out of order |
|---|---|
| Logging first | Silent failures during config/DB boot |
| Config before DB | Engine created with wrong URL; hard to debug |
| Exceptions before routes | Unhandled 500s with no standardized format |
| Middleware before routes | Routes registered without CORS/logging protection |
| Health checks last in startup | Container orchestrator kills pod before ready |
| Shutdown reverses startup | Connection leaks, lost audit log entries |

### 4.3 Application Factory Pattern

Use `create_app() -> FastAPI` factory (not module-level app instantiation). This enables:
- Multiple app instances in tests with different configs
- `--factory` flag for Uvicorn/Gunicorn
- Clean separation of wiring from runtime

---

## 5. Configuration Management

### 5.1 Settings Architecture

```
BaseSettings (Pydantic v2)
    ├── AppSettings          # APP_NAME, DEBUG, ENV
    ├── DatabaseSettings      # DATABASE_URL, POOL_SIZE
    ├── AuthSettings          # JWT_SECRET, JWT_ALGORITHM, TOKEN_TTL
    ├── StorageSettings       # STORAGE_BACKEND, S3_BUCKET
    ├── RedisSettings         # REDIS_URL (future)
    ├── CelerySettings        # CELERY_BROKER_URL (future)
    └── EmailSettings         # SMTP / SendGrid
```

Composed into a single `Settings` object loaded once at startup, injected via `get_settings()` dependency (cached with `@lru_cache`).

### 5.2 Environment Profiles

| Environment | Purpose | Key Differences |
|---|---|---|
| **Development** | Local dev | `DEBUG=true`, local storage, relaxed CORS, verbose logging |
| **Testing** | CI/pytest | In-memory or test Postgres, fake storage, `JWT_SECRET` fixed |
| **Staging** | Pre-prod validation | Production-like config, separate DB, real SMTP sandbox |
| **Production** | Live farms | `DEBUG=false`, strict CORS, structured JSON logs, real secrets |

### 5.3 Secret Management

| Secret | Storage | Never |
|---|---|---|
| `DATABASE_URL` | Env var / secrets manager | In code, in git, in Docker image layers |
| `JWT_SECRET` | Env var / Vault / AWS SM | Shared across environments |
| `JWT_REFRESH_SECRET` | Separate secret from access | Same key as access token |
| API keys (email, storage) | Secrets manager | Logged in request logs |
| `.env` files | Local dev only, gitignored | Committed to repository |

### 5.4 Best Practices

- Validate all settings at startup; crash if `JWT_SECRET` is missing in production
- Use `.env.example` with dummy values (documented, never real)
- Separate `JWT_ACCESS_TTL` (15 min) from `JWT_REFRESH_TTL` (7 days)
- Feature flags as settings (`ENABLE_WATER_RECORDS=false`) not code branches
- Settings are **immutable** after boot (no runtime mutation)

---

## 6. Database Session Lifecycle

### 6.1 Connection Management

```
Engine (singleton, app lifespan)
    └── Connection Pool (configurable: pool_size=10, max_overflow=20)
            └── Connection (borrowed per request/task)
                    └── Session (Unit of Work scope)
```

- One `AsyncEngine` (or sync `Engine` — pick one, recommend **async** for FastAPI) per application instance
- Pool sized for expected concurrency; monitor `pool.checkedout()` in production
- `pool_pre_ping=True` to detect stale connections

### 6.2 Session Lifecycle (Per Request)

```
Request arrives
    → get_db_session() dependency yields Session
        → Service method executes (may call multiple repos)
            → Repository uses same Session
        → Service commits (explicit) or raises (rollback)
    → Dependency finally block: session.close()
Response sent
```

### 6.3 Transaction Boundaries

| Rule | Rationale |
|---|---|
| **One session per request** | Prevents connection leaks; matches HTTP request scope |
| **Services own commits** | Service knows when a workflow is complete |
| **Repositories never commit** | Caller controls transaction boundary |
| **Explicit rollback on exception** | `session.rollback()` in service `except` or dependency teardown |
| **No session in domain layer** | Domain rules are pure; persistence is infrastructure |

### 6.4 Unit of Work Pattern

```
UnitOfWork (context manager)
    ├── session: Session
    ├── ponds: PondRepository
    ├── batches: BatchRepository
    ├── feedings: FeedingRepository
    └── commit() / rollback()
```

Services receive a `UnitOfWork` (or individual repos sharing one session). Multi-aggregate operations (e.g., harvest reduces batch count AND creates harvest record AND logs stock movement) happen in **one transaction**.

### 6.5 Session Flow Diagram

```
FastAPI Request
    │
    ▼
dependencies/db.py :: get_db_session()
    │  yield session
    ▼
dependencies/services.py :: get_harvest_service(session)
    │
    ▼
HarvestService.record_harvest(dto, current_user)
    │  validates business rules (domain/)
    │  calls HarvestRepository.create()
    │  calls BatchRepository.update_count()
    │  publishes HarvestCompleted event
    │  session.commit()
    ▼
dependencies/db.py :: finally → session.close()
    │
    ▼
HTTP 201 Response
```

---

## 7. Dependency Injection Design

### 7.1 DI Hierarchy

```
get_settings()                          # Cached singleton
get_db_session()                        # Per-request, yields Session
get_current_user(token, session)        # Per-request, resolves User
get_current_farm(user)                  # Per-request, resolves tenant context
require_permission("harvest:create")    # Per-request, authorization gate
get_pond_repository(session)            # Per-request, repo instance
get_harvest_service(repos, events)      # Per-request, service instance
```

### 7.2 Injection Rules

| Dependency | Scope | Provided By |
|---|---|---|
| `Settings` | Singleton (cached) | `config/settings.py` |
| `Session` | Request | `dependencies/db.py` |
| `CurrentUser` | Request | `dependencies/auth.py` |
| `FarmContext` | Request | `dependencies/auth.py` (from JWT claim or header) |
| `Repositories` | Request | `dependencies/repositories.py` |
| `Services` | Request | `dependencies/services.py` |
| `EventBus` | Singleton | `events/bus.py` |
| `StorageBackend` | Singleton | `storage/` factory |

### 7.3 Route Usage Pattern (Conceptual)

```
@router.post("/harvest")
async def create_harvest(
    body: HarvestCreate,
    service: HarvestService = Depends(get_harvest_service),
    user: CurrentUser = Depends(require_permission("harvest:create")),
):
    result = await service.record_harvest(body, user)
    return HarvestResponse.model_validate(result)
```

Routes declare **what** they need; `dependencies/` defines **how** to build it.

### 7.4 Testing DI

Override dependencies in tests via `app.dependency_overrides[get_db_session] = override_session`. Never monkey-patch service internals.

---

## 8. Repository Architecture

### 8.1 Responsibilities (ONLY)

- `get_by_id(id, farm_id)` — tenant-scoped reads
- `list(filters, pagination)` — query composition
- `create(entity)` — insert
- `update(entity)` — update
- `delete(id)` / `soft_delete(id)` — removal
- `exists(criteria)` — existence checks
- `count(filters)` — aggregation for pagination metadata

### 8.2 Repositories NEVER

| Anti-Pattern | Why Forbidden | Belongs In |
|---|---|---|
| `if harvest_qty > batch.fish_count: raise` | Business invariant | `domain/rules/` or `services/` |
| `send_harvest_notification()` | Side effect | `events/handlers/` |
| `generate_pdf_report()` | Non-persistence concern | `reports/` |
| `requests.get(external_api)` | External I/O | `services/` or dedicated client |
| `session.commit()` | Transaction ownership | `services/` |

### 8.3 Repository Interface Pattern

Each aggregate gets a Protocol/ABC:

```
PondRepository (interface)
    ├── get_by_id(pond_id, farm_id) → Pond | None
    ├── list_by_farm(farm_id, filters) → list[Pond]
    ├── create(pond) → Pond
    ├── update(pond) → Pond
    └── exists_by_name(farm_id, name) → bool

SqlAlchemyPondRepository(PondRepository)  # implementation in repositories/sqlalchemy/
```

### 8.4 Query Conventions

- **Always filter by `farm_id`** (multi-tenant isolation at repository level)
- Use SQLAlchemy 2.0 `select()` style (no legacy `session.query()`)
- Return ORM models to services (services map to domain/schemas)
- Complex reads: dedicated query methods, not generic `filter(**kwargs)` everywhere
- Pagination: repository accepts `limit/offset` or cursor, returns `(items, total_count)`

---

## 9. Service Architecture

### 9.1 Services SHOULD

| Responsibility | Example |
|---|---|
| Implement business rules | Harvest cannot exceed available fish count |
| Coordinate multiple repositories | Harvest updates batch + creates harvest record + logs movement |
| Validate workflows | Feeding must reference an active batch in the specified pond |
| Own transaction boundaries | `commit()` after full workflow succeeds |
| Publish domain events | `HarvestCompleted`, `FeedingRecorded` |
| Trigger notifications | Via event handlers, not direct email calls |
| Enforce tenant isolation | Verify `pond.farm_id == current_user.farm_id` |
| Map between layers | ORM model → response schema |

### 9.2 Services NEVER

| Anti-Pattern | Belongs In |
|---|---|
| `return JSONResponse(...)` | Routes |
| `request.query_params.get(...)` | Routes |
| Raw SQL strings | Repositories |
| HTTP status code decisions | Routes (services raise typed exceptions) |
| Pydantic schema definitions | `schemas/` |
| Direct JWT decoding | `security/` + `dependencies/auth.py` |

### 9.3 Service Catalog (AquaCore)

| Service | Primary Use Cases |
|---|---|
| `AuthService` | Login, refresh, logout, password reset |
| `FarmService` | Farm CRUD, farm settings |
| `PondService` | Pond CRUD, pond status, pond summary |
| `BatchService` | Stocking, transfer, mortality, batch lifecycle |
| `FeedingService` | Record feeding, daily schedule, compliance |
| `InventoryService` | Stock levels, movements, low-stock alerts |
| `HarvestService` | Record harvest, revenue calculation, partial harvest |
| `ReportService` | Queue report, retrieve artifact |
| `NotificationService` | In-app notifications, alert dispatch |
| `SettingsService` | User/farm preferences, notification prefs |
| `UserService` | User management, role assignment |

### 9.4 Service Method Signature Convention

```
async def record_harvest(
    self,
    data: HarvestCreate,        # validated input DTO
    current_user: CurrentUser,  # auth context
) -> Harvest:                  # domain/ORM result (route maps to response schema)
```

---

## 10. Route Architecture

### 10.1 Routes ONLY

1. Receive and bind HTTP request to Pydantic schema
2. Resolve dependencies (user, permissions, service)
3. Call exactly **one** service method per use case
4. Map result to response schema
5. Return appropriate HTTP status

### 10.2 Routes NEVER

- Calculate harvest revenue
- Check if fish count is sufficient
- Query the database directly
- Decide business-level "can user do X on Y resource" beyond calling `require_permission`

### 10.3 Route Organization (Phase 3 Contract)

```
/api/v1/
    POST   /auth/login
    POST   /auth/refresh
    POST   /auth/logout
    GET    /health
    GET    /health/ready
    
    /farms/{farm_id}/ponds          CRUD
    /farms/{farm_id}/batches        CRUD + actions
    /farms/{farm_id}/feedings       CRUD + daily view
    /farms/{farm_id}/inventory      CRUD + movements
    /farms/{farm_id}/harvest        CRUD
    /farms/{farm_id}/reports        generate + list
    /farms/{farm_id}/settings       read + update
    /users                          admin user management
```

### 10.4 Why Thin Routes Matter

When the mobile app, IoT devices, and AI services all consume the same API in 3 years, business rules living in services means **one place to change**. Rules in routes get duplicated across endpoints.

---

## 11. Schema Strategy

### 11.1 Schema Separation

| Schema Type | Purpose | Example |
|---|---|---|
| **Create** | POST body, required fields only | `PondCreate { name, capacity, species }` |
| **Update** | PATCH body, all fields optional | `PondUpdate { name?: str, capacity?: int }` |
| **Response** | API output, includes computed fields | `PondResponse { id, name, fish_count, status, created_at }` |
| **List** | Paginated collection wrapper | `PondListResponse { items: list[PondSummary], meta: PaginationMeta }` |
| **Summary** | Reduced fields for list views | `PondSummary { id, name, status, species }` |
| **Internal** | Service-to-service, never exposed | `PondInternal { ...orm_fields, deleted_at }` |

### 11.2 Why Separate Schemas

| Concern | Without Separation | With Separation |
|---|---|---|
| **Security** | `password_hash` leaks in response if reusing ORM model | Response schema exposes only safe fields |
| **API Stability** | DB column rename breaks API contract | Internal schema changes don't affect Response |
| **Validation** | Create requires `name`; Update makes it optional | Each schema has correct field requirements |
| **OpenAPI** | Confusing docs with mixed read/write fields | Clean, purpose-specific documentation |
| **Evolution** | Adding `computed_status` to response forces it on Create | Response-only fields stay in Response |

### 11.3 Schema Naming Convention

```
{Entity}Create       → POST input
{Entity}Update       → PATCH input
{Entity}Response     → Single item output
{Entity}Summary      → List item output
{Entity}ListResponse → Paginated list output
{Entity}Filter       → Query parameter binding
```

### 11.4 Mapping Strategy

- Services return ORM models or domain entities
- Routes call `EntityResponse.model_validate(orm_obj)` (Pydantic v2 `from_attributes=True`)
- Never return ORM models directly from routes

---

## 12. Validation Strategy

### 12.1 Three Validation Layers

```
Layer 1: Input Validation (Pydantic Schemas)
    ↓ passes
Layer 2: Business Validation (Services + Domain Rules)
    ↓ passes
Layer 3: Database Validation (Constraints + Repository)
    ↓ persists
```

### 12.2 Examples

| Validation | Layer | Handler | Error Type |
|---|---|---|---|
| Invalid email format | Input | Pydantic `EmailStr` | `422 Validation Error` |
| Negative fish quantity | Input | Pydantic `Field(gt=0)` | `422 Validation Error` |
| Missing required field on create | Input | Pydantic required field | `422 Validation Error` |
| Harvest exceeds available fish | Business | `HarvestService` + `domain/rules/harvest.py` | `409 Business Error` |
| Duplicate pond name within farm | Business | `PondService` → `repo.exists_by_name()` | `409 Conflict` |
| Feeding for inactive batch | Business | `FeedingService` | `422 Business Error` |
| User lacks permission | Authorization | `require_permission()` | `403 Forbidden` |
| Unique constraint violation (race) | Database | Repository catches `IntegrityError` | `409 Conflict` |
| Foreign key violation | Database | Repository catches `IntegrityError` | `400 Bad Request` |

### 12.3 Decision Matrix

| Question | Answer |
|---|---|
| Is it about data **shape/format**? | → Pydantic schema |
| Is it about business **rules/state**? | → Service + domain |
| Is it about **uniqueness under concurrency**? | → DB constraint + repository catch |
| Is it about **who can do it**? | → Authorization dependency |

---

## 13. Authentication & Authorization

### 13.1 Authentication Flow

```
1. POST /auth/login { email, password }
2. AuthService validates credentials (password hash compare)
3. AuthService generates:
   - Access Token (JWT, 15 min, contains: sub, farm_id, role, permissions[])
   - Refresh Token (opaque or JWT, 7 days, stored in DB with rotation)
4. Return { access_token, refresh_token, token_type: "bearer" }
5. Client sends: Authorization: Bearer <access_token>
6. get_current_user() dependency:
   - Decodes JWT
   - Validates signature + expiry
   - Loads user from DB (or trusts claims for performance with short TTL)
   - Returns CurrentUser dataclass
7. POST /auth/refresh { refresh_token }
   - Validates refresh token (not revoked, not expired)
   - Rotates: invalidates old, issues new pair
   - Detects reuse → revoke all tokens for user (breach detection)
```

### 13.2 Password Security

- Hash with **Argon2id** (preferred) or **bcrypt** (cost factor ≥ 12)
- Never store plaintext; never log passwords
- Password reset via time-limited single-use token

### 13.3 JWT Claims

```json
{
  "sub": "user_uuid",
  "farm_id": "farm_uuid",
  "role": "manager",
  "permissions": ["ponds:read", "harvest:create"],
  "iat": 1710000000,
  "exp": 1710000900,
  "jti": "unique_token_id"
}
```

### 13.4 Authorization (RBAC)

**Roles:**

| Role | Scope | Typical User |
|---|---|---|
| **Admin** | Full farm management + user management | Farm owner |
| **Manager** | All operations except user/role management | Farm manager (Ayo) |
| **Worker** | Daily operations: feedings, water records, view ponds | Field staff (Ngozi, Tunde) |

**Permissions:**

| Permission | Admin | Manager | Worker |
|---|---|---|---|
| `ponds:read` | ✓ | ✓ | ✓ |
| `ponds:create` | ✓ | ✓ | ✗ |
| `ponds:update` | ✓ | ✓ | ✗ |
| `ponds:delete` | ✓ | ✓ | ✗ |
| `batches:read` | ✓ | ✓ | ✓ |
| `batches:create` | ✓ | ✓ | ✗ |
| `feedings:read` | ✓ | ✓ | ✓ |
| `feedings:create` | ✓ | ✓ | ✓ |
| `inventory:read` | ✓ | ✓ | ✓ |
| `inventory:update` | ✓ | ✓ | ✗ |
| `harvest:read` | ✓ | ✓ | ✓ |
| `harvest:create` | ✓ | ✓ | ✗ |
| `reports:read` | ✓ | ✓ | ✗ |
| `reports:generate` | ✓ | ✓ | ✗ |
| `reports:export` | ✓ | ✓ | ✗ |
| `settings:read` | ✓ | ✓ | ✗ |
| `settings:update` | ✓ | ✗ | ✗ |
| `users:manage` | ✓ | ✗ | ✗ |

### 13.5 Where Authorization Occurs

| Check | Location | Example |
|---|---|---|
| **Role/permission gate** | `dependencies/permissions.py` | `require_permission("harvest:create")` |
| **Resource ownership** | Service layer | `pond.farm_id == current_user.farm_id` |
| **Field-level restrictions** | Service layer | Worker can create feeding but not edit past records |
| **Never in repository** | — | Repos accept `farm_id` filter but don't check permissions |

---

## 14. Middleware Stack

### 14.1 Recommended Stack (Outermost → Innermost)

| Order | Middleware | Purpose |
|---|---|---|
| 1 | **Trusted Hosts** | Reject requests with unexpected `Host` header (production) |
| 2 | **CORS** | Allow Next.js frontend origin; block others |
| 3 | **GZip Compression** | Compress responses > 1KB |
| 4 | **Request ID** | Generate/propagate `X-Request-ID` for tracing |
| 5 | **Request Logging** | Log method, path, status, duration, user_id |
| 6 | **Response Timing** | Add `X-Response-Time` header |
| 7 | **Rate Limiting** | Throttle by IP/user (future: Redis-backed) |
| 8 | **Security Headers** | `X-Content-Type-Options`, `X-Frame-Options`, `HSTS` |

### 14.2 Middleware NOT Recommended as Global

| Concern | Why Not Global Middleware | Better Approach |
|---|---|---|
| **Authentication** | Not all routes need auth (`/health`, `/auth/login`) | FastAPI dependency `get_current_user` |
| **Authorization** | Resource-level checks need service context | `require_permission()` dependency |
| **Input validation** | Schema-specific | Pydantic on route parameters |

### 14.3 CORS Configuration

```
Allowed Origins:  [https://app.aquacore.ng]  (production)
                  [http://localhost:3000]     (development)
Allowed Methods:  GET, POST, PATCH, DELETE, OPTIONS
Allowed Headers:  Authorization, Content-Type, X-Request-ID
Expose Headers:   X-Request-ID, X-Response-Time
Credentials:      true (for cookie-based refresh tokens, if used)
```

---

## 15. Exception Handling

### 15.1 Exception Hierarchy

```
AppException (base)
    ├── ValidationError          → 422
    ├── AuthenticationError      → 401
    ├── AuthorizationError       → 403
    ├── NotFoundError            → 404
    ├── ConflictError            → 409
    ├── BusinessRuleError        → 422 (with business context)
    ├── RateLimitError           → 429
    └── ServiceUnavailableError  → 503

Unhandled Exception              → 500 (never expose internals)
```

### 15.2 Standardized Error Response

```json
{
  "error": {
    "code": "HARVEST_EXCEEDS_AVAILABLE",
    "message": "Harvest quantity (1200) exceeds available fish count (986) in batch BAT-003.",
    "details": [
      {
        "field": "fish_harvested",
        "message": "Cannot harvest more than 986 fish",
        "value": 1200
      }
    ],
    "request_id": "req_abc123",
    "timestamp": "2026-07-09T10:00:00Z"
  }
}
```

### 15.3 Handler Registration

| Exception Type | Handler | Logs |
|---|---|---|
| `RequestValidationError` (Pydantic) | Map to 422 with field details | Warning |
| `AuthenticationError` | 401, no details | Warning (audit) |
| `AuthorizationError` | 403 | Warning (audit) |
| `BusinessRuleError` | 422 with code + message | Info |
| `NotFoundError` | 404 | Info |
| `ConflictError` | 409 | Info |
| `IntegrityError` (SQLAlchemy) | 409 (translate to ConflictError) | Warning |
| `Exception` (catch-all) | 500, generic message | Error + stack trace |

### 15.4 Rules

- Services raise typed `AppException` subclasses, never `HTTPException`
- Routes never catch exceptions (handlers do)
- 500 responses never include stack traces or SQL
- Every error response includes `request_id`

---

## 16. Logging Strategy

### 16.1 Log Categories

| Category | Level | Content | Destination |
|---|---|---|---|
| **Application** | INFO | Startup, shutdown, config loaded | stdout (JSON) |
| **Request** | INFO | method, path, status, duration_ms, user_id | stdout (JSON) |
| **Authentication** | WARNING | Failed login, token reuse, permission denied | stdout + audit table |
| **Database** | WARNING | Slow queries (>500ms), pool exhaustion | stdout |
| **Error** | ERROR | Unhandled exceptions with stack trace | stdout + error tracker |
| **Audit** | INFO | Who did what, when, to which resource | `audit_logs` table + stdout |

### 16.2 Structured Logging Format

```json
{
  "timestamp": "2026-07-09T10:00:00.123Z",
  "level": "INFO",
  "logger": "app.services.harvest",
  "message": "Harvest recorded",
  "request_id": "req_abc123",
  "user_id": "usr_xyz",
  "farm_id": "farm_001",
  "resource": "harvest",
  "resource_id": "HV-004",
  "duration_ms": 45,
  "extra": { "fish_count": 1200, "pond": "Pond D" }
}
```

### 16.3 Rules

- **Never log**: passwords, JWT secrets, full tokens, PII beyond user_id
- **Always log**: request_id, user_id, farm_id on every operation log
- Use `structlog` or `python-json-logger` for JSON output
- Correlation: `request_id` propagated through services via context variable (`contextvars`)
- Audit logs are **append-only** (never updated or deleted)

---

## 17. Background Task Design

### 17.1 Task Classification

| Task | Sync or Async | Rationale |
|---|---|---|
| Record feeding | **Sync** | User waits for confirmation; must be immediate |
| Record harvest | **Sync** | Revenue-critical; needs instant feedback |
| CRUD operations | **Sync** | Standard request/response |
| Generate PDF report | **Async** | May take 10–60 seconds |
| Generate Excel report | **Async** | Large data sets |
| Send email notification | **Async** | External I/O; user doesn't wait |
| Feed low-stock alert | **Async** | Scheduled/event-triggered |
| Harvest reminder | **Async** | Scheduled (Celery Beat) |
| Dashboard aggregation | **Async** (precompute) | Heavy queries; cache result |
| AI feeding score | **Async** (future) | ML inference latency |
| Water test image processing | **Async** (future) | Image analysis |

### 17.2 Task Architecture (Phased)

**Phase 1 (MVP):** FastAPI `BackgroundTasks` for email notifications only.

**Phase 2:** Celery + Redis for report generation and scheduled alerts.

**Phase 3:** Dedicated workers for AI/IoT processing.

### 17.3 Task Flow

```
Service publishes event (e.g., HarvestCompleted)
    → Event handler enqueues Celery task
        → Worker picks up task
            → Executes (generate report, send email)
                → Updates task status in DB
                → On failure: retry with exponential backoff (max 3)
```

### 17.4 Task Status Tracking

```
ReportJob {
    id, type, status: [queued, processing, completed, failed],
    created_by, created_at, completed_at,
    artifact_url, error_message
}
```

Client polls `GET /reports/{id}/status` or receives webhook (future).

---

## 18. Event System

### 18.1 Domain Events

| Event | Published By | Handlers |
|---|---|---|
| `FishBatchCreated` | `BatchService` | Audit log, dashboard cache invalidation |
| `FeedingRecorded` | `FeedingService` | Inventory deduction, compliance update, audit |
| `HarvestCompleted` | `HarvestService` | Batch count update, revenue calc, notification |
| `WaterTestRecorded` | `WaterService` (future) | Alert if parameters out of range |
| `InventoryRestocked` | `InventoryService` | Low-stock alert cancellation, audit |
| `InventoryLowStock` | `InventoryService` | Notification to managers |
| `NotificationGenerated` | `NotificationService` | In-app delivery, email dispatch |
| `UserLoggedIn` | `AuthService` | Audit log |
| `ReportRequested` | `ReportService` | Enqueue generation task |

### 18.2 Event Architecture (Phased)

**Phase 1:** In-process event bus (simple pub/sub within the app). Handlers run synchronously after commit.

**Phase 2:** Redis pub/sub for cross-process events (API → worker).

**Phase 3:** Kafka for event sourcing and analytics pipeline.

### 18.3 Event Contract

```
DomainEvent (base)
    event_id: UUID
    event_type: str
    occurred_at: datetime
    farm_id: UUID
    actor_id: UUID
    payload: dict
    correlation_id: str  # request_id
```

### 18.4 Rules

- Events published **after** successful `commit()` (not before)
- Event handlers must be **idempotent** (safe to retry)
- Event handlers must **not** raise exceptions that rollback the originating transaction
- Failed handlers log error and enqueue retry (never block the HTTP response)

---

## 19. Storage Strategy

### 19.1 File Categories

| Category | Max Size | Formats | Retention |
|---|---|---|---|
| Profile photos | 2 MB | JPEG, PNG, WebP | Until replaced |
| Farm logos | 2 MB | JPEG, PNG, SVG | Until replaced |
| Harvest images | 10 MB | JPEG, PNG | 7 years (compliance) |
| Water test images | 10 MB | JPEG, PNG | 3 years |
| Generated reports | 50 MB | PDF, XLSX | 90 days (configurable) |

### 19.2 Storage Abstraction

```
StorageBackend (Protocol)
    ├── upload(file, path, metadata) → StorageRef
    ├── download(path) → bytes
    ├── delete(path) → bool
    ├── get_signed_url(path, ttl) → str
    └── exists(path) → bool

LocalStorageBackend     # Development
S3StorageBackend        # Production (future)
```

### 19.3 File Metadata (Database)

```
FileAsset {
    id, farm_id, category, original_filename,
    storage_path, mime_type, size_bytes,
    uploaded_by, created_at
}
```

- Services validate file type/size, then delegate to `StorageBackend`
- Routes never handle raw file bytes directly (use `UploadFile` → service)
- All downloads via signed URLs (never expose internal paths)

---

## 20. Security Architecture

| Measure | Implementation | Rationale |
|---|---|---|
| **Password hashing** | Argon2id | Resistant to GPU cracking; OWASP recommended |
| **JWT access tokens** | Short-lived (15 min), signed HS256/RS256 | Limits exposure window if stolen |
| **JWT refresh tokens** | Rotation + reuse detection | Prevents long-lived token theft |
| **Rate limiting** | Per-IP on `/auth/login` (5/min), per-user on API (100/min) | Prevents brute force and abuse |
| **Input sanitization** | Pydantic validation + `bleach` for text fields | Prevents stored XSS in notes/reports |
| **SQL injection** | SQLAlchemy parameterized queries only; no raw SQL with f-strings | ORM enforces parameterization |
| **XSS protection** | JSON API (no HTML rendering); `Content-Type: application/json` | API-only backend; frontend handles rendering |
| **Secure headers** | HSTS, X-Content-Type-Options, X-Frame-Options, CSP | Middleware adds on every response |
| **Secrets management** | Env vars in dev; Vault/AWS SM in production | Secrets never in code or images |
| **HTTPS** | TLS termination at reverse proxy (Nginx/ALB) | Encrypt in transit; enforce redirect |
| **CORS** | Strict origin whitelist | Prevents cross-origin token theft |
| **Multi-tenant isolation** | `farm_id` on every query + service-level verification | Prevents cross-farm data leaks |
| **Audit trail** | Append-only audit log for all mutations | Accountability for farm operations |
| **Dependency scanning** | `pip-audit` / Dependabot in CI | Known CVE prevention |

---

## 21. Testing Architecture

### 21.1 Test Pyramid

```
        ╱  API Tests  ╲          (10%) — Full HTTP request/response
       ╱ Integration   ╲        (20%) — DB + repos, real Postgres
      ╱  Service Tests   ╲      (30%) — Business logic, mocked repos
     ╱   Unit Tests        ╲    (40%) — Domain rules, validators, pure functions
```

### 21.2 Test Categories

| Category | Scope | Tools | Database |
|---|---|---|---|
| **Unit** | Domain rules, validators, schema validation | pytest | None |
| **Service** | Business workflows with mocked repos | pytest + unittest.mock | None |
| **Repository** | CRUD operations, query correctness | pytest | Test Postgres (Docker) |
| **API** | Full HTTP cycle, auth, permissions | pytest + httpx AsyncClient | Test Postgres |
| **Auth** | Login, refresh, token expiry, RBAC | pytest + httpx | Test Postgres |
| **Integration** | Multi-service workflows (harvest flow) | pytest | Test Postgres |

### 21.3 Fixtures & Factories

```
tests/factories/
    user_factory.py       → create_user(role="manager")
    farm_factory.py       → create_farm(name="Green Valley")
    pond_factory.py       → create_pond(farm=farm, species="Catfish")
    batch_factory.py      → create_batch(pond=pond, count=3000)
    feeding_factory.py
    harvest_factory.py
```

- Use `factory_boy` or lightweight factory functions
- Each test creates only the data it needs (no shared state)
- Database reset between tests (transaction rollback or truncate)

### 21.4 Mocking Strategy

| Component | Mock In | Real In |
|---|---|---|
| Repositories | Service tests | Repository tests, API tests |
| Database | Unit, service tests | Repository, integration, API tests |
| Storage backend | All except storage tests | Storage integration tests |
| Email/notification | All except notification tests | Notification integration tests |
| Celery tasks | API tests (assert enqueue called) | Task unit tests |
| External APIs | Always mocked | Never called in tests |

### 21.5 CI Pipeline

```
lint (ruff) → type-check (mypy) → unit tests → integration tests (Docker Postgres) → API tests → coverage report (≥80%)
```

---

## 22. Observability

### 22.1 Health Checks

| Endpoint | Checks | Use |
|---|---|---|
| `GET /health` | App is running | Load balancer liveness |
| `GET /health/ready` | DB connection, storage backend | Orchestrator readiness |
| `GET /health/live` | Process responsive | Kubernetes liveness |

### 22.2 Metrics (Future Prometheus)

| Metric | Type | Labels |
|---|---|---|
| `http_requests_total` | Counter | method, path, status |
| `http_request_duration_seconds` | Histogram | method, path |
| `db_pool_checked_out` | Gauge | — |
| `db_query_duration_seconds` | Histogram | operation |
| `celery_tasks_total` | Counter | task_name, status |
| `active_users` | Gauge | farm_id |

### 22.3 Tracing (Future)

- OpenTelemetry SDK instrumenting FastAPI, SQLAlchemy, Celery
- `request_id` as trace correlation ID from day one
- Export to Jaeger/Tempo

### 22.4 Error Tracking

- Sentry (or equivalent) for unhandled exceptions
- Breadcrumb trail: request_id → user_id → service → repository
- Alert on error rate spike

### 22.5 Audit Trail

Every mutation records:
```
{ actor_id, action, resource_type, resource_id, farm_id, 
  changes: { before, after }, ip_address, timestamp, request_id }
```

Stored in `audit_logs` table; never deleted; searchable by admin.

---

## 23. Scalability Roadmap

### 23.1 Current Architecture (MVP)

```
[Next.js Frontend] → [FastAPI Monolith] → [PostgreSQL]
                          ↓
                    [Local File Storage]
```

Single deployable unit. Handles 1–50 farms, ~100 concurrent users.

### 23.2 Growth Phases

| Phase | Trigger | Architecture Change |
|---|---|---|
| **Phase A** | >50 farms, slow reports | Add Redis cache + Celery workers |
| **Phase B** | >200 farms, mobile app | API rate limiting, read replicas, CDN for files |
| **Phase C** | IoT sensor integration | WebSocket service, Kafka event stream, time-series DB |
| **Phase D** | AI features (feeding optimization) | Dedicated ML inference service, GPU workers |
| **Phase E** | Multi-region farms | Service decomposition, regional deployments |

### 23.3 Future Service Decomposition

```
                    ┌─────────────┐
                    │  API Gateway │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ Core API   │  │ Report Svc │  │ Notify Svc │
    │ (CRUD)     │  │ (Celery)   │  │ (Email)    │
    └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
          │               │               │
    ┌─────┴───────────────┴───────────────┴──────┐
    │              PostgreSQL + Redis             │
    └────────────────────────────────────────────┘
          │                               │
    ┌─────┴──────┐                 ┌──────┴──────┐
    │ AI Service │                 │ IoT Gateway │
    │ (FastAPI)  │                 │ (WebSocket) │
    └────────────┘                 └─────────────┘
```

### 23.4 Why Monolith First

- AquaCore is pre-product-market-fit; microservices add operational cost without proportional benefit
- Clean Architecture layers make future extraction straightforward:
  - `reports/` → Report Service
  - `notifications/` → Notification Service
  - `tasks/` → Worker Service
- Repository interfaces mean services don't care if data is local or remote

### 23.5 Scaling Enablers Built Into This Design

| Design Decision | Future Benefit |
|---|---|
| Repository interfaces | Swap Postgres for service client |
| Event bus | Replace in-process with Kafka |
| Storage abstraction | Move from local to S3 without service changes |
| JWT stateless auth | Horizontally scale API instances |
| `farm_id` tenant isolation | Shard by farm when needed |
| Structured logging with `request_id` | Distributed tracing ready |
| Celery task definitions separate from services | Extract workers independently |

---

## 24. Architecture Decision Rationale (ADR Summary)

| # | Decision | Alternatives Considered | Rationale |
|---|---|---|---|
| ADR-001 | Clean Architecture with 4 layers | MVC, transaction script | Long-term maintainability; farm domain complexity warrants it |
| ADR-002 | Monolith first | Microservices from day one | Team size and stage don't justify distributed system overhead |
| ADR-003 | Repository pattern with interfaces | Active Record, raw SQLAlchemy in services | Testability; future DB migration flexibility |
| ADR-004 | Service layer owns transactions | Repository auto-commit, route-level transactions | Clear transaction boundaries per business workflow |
| ADR-005 | Pydantic schema separation (Create/Update/Response) | Single schema per entity | API stability, security, OpenAPI clarity |
| ADR-006 | JWT with refresh token rotation | Session cookies, long-lived JWT | Stateless API scaling; mobile/IoT client support |
| ADR-007 | RBAC with permission strings | Role-only checks, ABAC | Simple enough for 3 roles; extensible to ABAC later |
| ADR-008 | In-process event bus (Phase 1) | Direct service calls, Kafka from start | YAGNI; events decouple without infrastructure cost |
| ADR-009 | Async SQLAlchemy | Sync SQLAlchemy | FastAPI is async-native; avoids thread pool overhead |
| ADR-010 | Alembic at project root | Inside `app/` | Standard convention; separates migrations from runtime |
| ADR-011 | Structured JSON logging | Plain text logs | Machine-parseable; required for production observability |
| ADR-012 | Storage backend protocol | Direct filesystem calls | Cloud migration without service changes |
| ADR-013 | `farm_id` tenant scoping at repository level | Schema-per-tenant, row-level security | Simplest multi-tenant for current scale; RLS as future option |
| ADR-014 | Argon2id password hashing | bcrypt, scrypt | OWASP current recommendation for new systems |
| ADR-015 | FastAPI BackgroundTasks → Celery migration path | Celery from day one | Avoid premature infrastructure; clear upgrade path |

---

## Implementation Readiness Checklist

Before writing code, confirm:

- [ ] Phase 3 API contract reviewed and aligned with route structure
- [ ] Phase 2 database schema reviewed and aligned with `models/` layout
- [ ] RBAC permission matrix approved by product owner
- [ ] Environment variable list finalized (`.env.example`)
- [ ] Docker Compose stack defined (API + Postgres + future Redis)
- [ ] CI pipeline skeleton agreed
- [ ] Error response format agreed with frontend team
- [ ] Audit log requirements confirmed with compliance stakeholder

---

**Document Status:** Ready for Principal Engineer review and implementation kickoff.  
**Next Phase:** Phase 5 — Implementation (models, repositories, services, routes) following this blueprint exactly.