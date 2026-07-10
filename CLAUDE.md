# CLAUDE.md — PondDesk Project Context

This file provides context for AI coding assistants working on the PondDesk Fish Farm Management Platform.

## Project Summary

PondDesk is a commercial fish farm management SaaS for freshwater/brackish aquaculture. The frontend MVP (Next.js) is built. The backend (FastAPI + PostgreSQL) has complete architecture documentation but is not yet implemented.

**Full documentation:** [`docs/README.md`](docs/README.md)

## Architecture Documents (Canonical — Do Not Regenerate)

| Phase | Document | Content |
|-------|----------|---------|
| 1 | [`docs/architecture/01-domain-model.md`](docs/architecture/01-domain-model.md) | Business entities, rules, workflows |
| 2 | [`docs/architecture/02-database-architecture.md`](docs/architecture/02-database-architecture.md) | PostgreSQL schema, ERD, constraints |
| 3 | [`docs/architecture/03-api-contract.md`](docs/architecture/03-api-contract.md) | REST API `/api/v1/` specification |
| 4 | [`docs/architecture/04-backend-architecture.md`](docs/architecture/04-backend-architecture.md) | FastAPI internal architecture |
| 5 | [`docs/architecture/05-orm-models.md`](docs/architecture/05-orm-models.md) | SQLAlchemy 2.0 ORM model design |
| 6 | [`docs/architecture/06-migration-strategy.md`](docs/architecture/06-migration-strategy.md) | Alembic migration & versioning strategy |
| 7 | [`docs/architecture/07-pydantic-schemas.md`](docs/architecture/07-pydantic-schemas.md) | Pydantic v2 DTO / schema architecture |
| 8 | [`docs/architecture/08-repository-layer.md`](docs/architecture/08-repository-layer.md) | Repository layer & async data access design |
| 9 | [`docs/architecture/09-service-layer.md`](docs/architecture/09-service-layer.md) | Service layer & business logic design |
| 10 | [`docs/architecture/10-security-architecture.md`](docs/architecture/10-security-architecture.md) | AuthN, AuthZ, JWT, RBAC & security design |
| 11 | [`docs/architecture/11-api-presentation-layer.md`](docs/architecture/11-api-presentation-layer.md) | FastAPI routes, DI & presentation layer |
| 12 | [`docs/architecture/12-background-processing.md`](docs/architecture/12-background-processing.md) | Background tasks, events & automation |

**ADRs:** [`docs/adr/README.md`](docs/adr/README.md) (15 accepted decisions)

## Tech Stack

### Frontend (Implemented)
- Next.js 14, TypeScript, Tailwind CSS
- App Router: `src/app/`
- Modules: `src/components/*Module.tsx`
- Shared nav: `src/components/app/` (`AppSidebar`, `AppMobileNav`, `nav-config.ts`)
- Design tokens: `src/app/globals.css` (`--color-accent: #0D7A5F`)

### Backend (Architecture Only — Not Yet Built)
- Python 3.13+, FastAPI, PostgreSQL 15+
- SQLAlchemy 2.0 (async), Alembic, Pydantic v2
- JWT auth + RBAC, Docker
- Future: Redis, Celery (designed in Phase 12)

## Clean Architecture Layers

```
Routes → Services → Repositories → ORM Models → PostgreSQL
           ↓
        Domain (pure rules, no I/O)
```

**Dependency rule:** Dependencies point inward. Domain never imports FastAPI or SQLAlchemy.

## Layer Responsibilities

### Routes (`app/api/v1/endpoints/`)
- ONLY: receive request, validate input (Pydantic), call service, return response
- NEVER: business rules, SQL, calculations, direct repo calls

### Services (`app/services/`)
- Implement business rules and workflows
- Coordinate repositories within one transaction
- Own `commit()` / `rollback()`
- Publish domain events after commit
- NEVER: HTTP responses, raw SQL, JWT decoding

### Repositories (`app/repositories/`)
- ONLY: CRUD + query composition per aggregate
- Always filter by `farm_id`
- NEVER: business logic, `commit()`, side effects

### Domain (`app/domain/`)
- Pure business rules, value objects, events, exceptions
- NEVER: framework or I/O imports

### Schemas (`app/schemas/`)
- Separate: `Create`, `Update`, `Response`, `Summary`, `ListResponse` per entity
- NEVER: DB queries or auth logic

## Repository Pattern

```python
# Interface (app/repositories/interfaces/pond_repository.py)
class PondRepository(Protocol):
    async def get_by_id(self, pond_id: UUID, farm_id: UUID) -> Pond | None: ...
    async def list_by_farm(self, farm_id: UUID, filters: PondFilter) -> list[Pond]: ...
    async def create(self, pond: Pond) -> Pond: ...
    async def exists_by_name(self, farm_id: UUID, name: str) -> bool: ...

# Implementation (app/repositories/sqlalchemy/pond_repository.py)
class SqlAlchemyPondRepository(PondRepository):
    def __init__(self, session: AsyncSession): ...
```

- One repository per aggregate root
- SQLAlchemy 2.0 `select()` style (no legacy `session.query()`)
- Repositories receive session, never create their own

## Service Layer Rules

```python
# Pattern: service method
async def record_harvest(self, data: HarvestCreate, user: CurrentUser) -> Harvest:
    # 1. Business validation (domain rules)
    # 2. Repository operations (shared session)
    # 3. session.commit()
    # 4. Publish domain event
    # 5. Return result (route maps to response schema)
```

Service catalog: `AuthService`, `FarmService`, `PondService`, `BatchService`, `FeedingService`, `InventoryService`, `HarvestService`, `ReportService`, `NotificationService`, `SettingsService`, `UserService`

## API Standards

- Base: `/api/v1/`
- Auth header: `Authorization: Bearer <access_token>`
- Farm context: `X-Farm-Id` or JWT `farm_id` claim
- Error envelope: `{ "error": { "code", "message", "details", "request_id" } }`
- Pagination: `?page=1&page_size=20` with `meta` object
- Soft delete on masters; never hard-delete operational facts

### Module Routers
`/auth`, `/dashboard`, `/farms`, `/ponds`, `/batches`, `/feedings`, `/inventory`, `/water-records`, `/harvests`, `/reports`, `/notifications`, `/settings`, `/search`, `/files`

## Database Conventions

- **PKs:** UUID (`gen_random_uuid()`)
- **Tenancy:** `farm_id` on all operational data
- **Timestamps:** `created_at`, `updated_at` (timestamptz)
- **Soft delete:** `deleted_at` on master entities
- **Audit:** `recorded_by` on facts; append-only `audit_log`
- **Ledger:** `inventory_transactions` is immutable
- **Critical:** `water_records` FK → `ponds` only (NOT `fish_batches`)

### Core Tables
`users`, `roles`, `farm_memberships`, `farms`, `ponds`, `fish_batches`, `feeding_records`, `water_records`, `harvest_records`, `feed_inventory`, `inventory_transactions`, `reports`, `notifications`, `audit_log`

## Naming Conventions

| Item | Style | Example |
|------|-------|---------|
| Python files | snake_case | `harvest_service.py` |
| Classes | PascalCase | `HarvestService` |
| Functions | snake_case | `record_harvest()` |
| DB tables | snake_case plural | `fish_batches` |
| DB columns | snake_case | `farm_id` |
| Schemas | `{Entity}{Action}` | `HarvestCreate` |
| Permissions | `{resource}:{action}` | `harvest:create` |
| Events | PascalCase | `HarvestCompleted` |

## Validation Strategy

| Layer | Validates | Example |
|-------|-----------|---------|
| Pydantic schema | Format, shape, required fields | Invalid email, `quantity > 0` |
| Service + domain | Business rules, state | Harvest > available fish |
| DB constraint + repo | Uniqueness under concurrency | Duplicate pond name |

## Authentication & Authorization

- JWT access: 15 min · Refresh: 7 days (rotation + reuse detection)
- Password: Argon2id (ADR-014)
- Roles: `ADMIN`, `MANAGER`, `WORKER`
- Permissions: `ponds:read`, `harvests:write`, `reports:export`, etc.
- Auth via `Depends(get_current_user)` — not global middleware
- Resource ownership checked in services (`farm_id` match)
- Full design: [`docs/architecture/10-security-architecture.md`](docs/architecture/10-security-architecture.md)

## Dependency Injection

```python
get_settings()           # Cached singleton
get_db_session()         # Per-request, yields Session
get_current_user()       # Per-request, from JWT
require_permission()     # Per-request, RBAC gate
get_harvest_service()    # Per-request, wired repos + events
```

Override in tests: `app.dependency_overrides[get_db_session] = override_session`

## Exception Handling

- Services raise `AppException` subclasses (`NotFoundError`, `ConflictError`, `BusinessRuleError`)
- Centralized handlers in `app/exceptions/handlers.py`
- Routes never catch exceptions
- 500 responses never expose internals

## Coding Standards

- Python: `ruff` lint, `mypy` type-check
- No magic strings — use `app/core/constants.py` enums
- Structured JSON logging with `request_id`, `user_id`, `farm_id`
- Comments only for non-obvious business logic
- Minimize scope — focused diffs, no unrelated changes
- Match existing conventions in surrounding code

## Testing

- pytest + httpx AsyncClient
- Pyramid: 40% unit, 30% service, 20% integration, 10% API
- Factories in `tests/factories/`
- Test Postgres via Docker in CI
- Coverage target: ≥80%

## Critical Business Rules

1. Harvest quantity ≤ current fish count in batch
2. Mortality count ≤ current population
3. Feeding requires active batch with sufficient inventory
4. Water records are pond-scoped (not batch-scoped)
5. All operations scoped to user's `farm_id`
6. Inventory transactions are append-only

## Frontend Routes (MVP)

`/dashboard`, `/ponds`, `/batches`, `/feedings`, `/inventory`, `/harvest`, `/reports`, `/settings`

Water records UI hidden (redirects to dashboard); backend schema preserved.

## Implementation Guidelines

1. Read the relevant `docs/architecture/` phase before coding
2. Follow layer rules strictly — no shortcuts
3. Check ADRs before making architectural choices
4. Do not modify canonical architecture docs without a new ADR
5. Do not commit unless explicitly asked
6. Run `tsc` + `lint` for frontend changes; `ruff` + `mypy` + `pytest` for backend

## AI Assistant Quick Reference

- **Architecture questions** → `docs/architecture/`
- **API endpoint details** → `docs/architecture/03-api-contract.md`
- **Route / DI design** → `docs/architecture/11-api-presentation-layer.md`
- **Background jobs / events** → `docs/architecture/12-background-processing.md`
- **Table/column specs** → `docs/architecture/02-database-architecture.md`
- **Where does logic go?** → `docs/architecture/04-backend-architecture.md` §3
- **Why was X decided?** → `docs/adr/`
- **How to implement feature Y?** → `docs/AI_DEVELOPMENT_GUIDE.md`
