# AI Development Guide

Instructions for AI coding assistants (Claude, Cursor, Copilot, etc.) working on the AquaCore project.

## Before Writing Any Code

1. Read [CLAUDE.md](../CLAUDE.md) at the project root
2. Read the relevant architecture phase document in `docs/architecture/`
3. Check [ADRs](adr/README.md) for accepted decisions
4. Do not invent architecture — follow existing designs

## Documentation Hierarchy

| Priority | Location | Use When |
|----------|----------|----------|
| 1 | `docs/architecture/` | Understanding design intent |
| 2 | `docs/adr/` | Resolving implementation choices |
| 3 | `docs/backend/`, `docs/api/`, `docs/database/` | Quick reference during coding |
| 4 | `docs/diagrams/` | Visual context |
| 5 | `src/` (frontend) | UI patterns and conventions |

## Project Structure (Target Backend)

```
backend/
├── app/
│   ├── api/v1/endpoints/     # Routes ONLY — thin HTTP layer
│   ├── services/             # Business logic — all workflows here
│   ├── repositories/         # Data access — CRUD + queries only
│   ├── models/               # SQLAlchemy ORM models
│   ├── schemas/              # Pydantic v2 DTOs
│   ├── domain/               # Pure business rules (no framework imports)
│   ├── dependencies/         # FastAPI DI providers
│   ├── security/             # JWT, password hashing
│   ├── permissions/          # RBAC policies
│   ├── exceptions/           # Typed exceptions + handlers
│   └── config/               # Pydantic Settings
├── migrations/               # Alembic (project root)
└── tests/
```

## Layer Rules (Non-Negotiable)

### Routes (`api/v1/endpoints/`)
- Receive request → validate via Pydantic → call ONE service method → return response schema
- NEVER: business rules, SQL, calculations, direct repository calls

### Services (`services/`)
- Implement business rules, coordinate repositories, own transactions (`commit()`)
- Publish domain events after successful commit
- NEVER: HTTP responses, raw SQL, JWT decoding

### Repositories (`repositories/`)
- CRUD + query composition, always filter by `farm_id`
- NEVER: business logic, `commit()`, emails, reports

### Domain (`domain/`)
- Pure functions for invariants (e.g., harvest eligibility)
- NEVER: import FastAPI, SQLAlchemy, or any I/O

### Schemas (`schemas/`)
- Separate Create / Update / Response / List / Summary per entity
- NEVER: database queries or authorization logic

## Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Files | `snake_case.py` | `harvest_service.py` |
| Classes | `PascalCase` | `HarvestService` |
| Functions | `snake_case` | `record_harvest()` |
| Constants | `UPPER_SNAKE` | `MAX_BATCH_SIZE` |
| API routes | `kebab-case` paths | `/api/v1/water-records` |
| DB tables | `snake_case` plural | `fish_batches` |
| DB columns | `snake_case` | `farm_id`, `created_at` |
| Pydantic schemas | `{Entity}{Action}` | `HarvestCreate`, `HarvestResponse` |
| Permissions | `{resource}:{action}` | `harvest:create` |
| Domain events | `PascalCase` past tense | `HarvestCompleted` |

## Database Conventions

- UUID primary keys (`gen_random_uuid()`)
- `farm_id` on all operational tables (multi-tenant)
- `created_at`, `updated_at` (timestamptz) on all tables
- `deleted_at` for soft delete on master entities
- `recorded_by` (user FK) on operational facts
- `audit_log` is append-only
- `inventory_transactions` is immutable ledger
- Water records FK → `ponds` only (NOT `fish_batches`)

## API Conventions

- Base path: `/api/v1/`
- Auth: `Authorization: Bearer <access_token>`
- Farm context: `X-Farm-Id` header or JWT `farm_id` claim
- Pagination: `?page=1&page_size=20` with `meta` envelope
- Errors: standardized `{ error: { code, message, details, request_id } }`
- Soft delete: `DELETE` sets `deleted_at`, never hard deletes facts

## Validation Placement

| Type | Where | Example |
|------|-------|---------|
| Format/shape | Pydantic schema | Invalid email, negative quantity field |
| Business rule | Service + domain | Harvest > available fish |
| Uniqueness (race) | DB constraint + repo catch | Duplicate pond name |
| Authorization | `dependencies/permissions.py` | Worker cannot create pond |

## Authentication & Authorization

- JWT access token: 15 min
- Refresh token: 7 days with rotation
- Password hashing: Argon2id (ADR-014)
- Roles: `ADMIN`, `MANAGER`, `WORKER`
- Permission checks via `require_permission("resource:action")` dependency
- Resource ownership verified in service layer (`farm_id` match)

## Error Handling

- Services raise typed `AppException` subclasses
- Routes never catch exceptions
- Never expose stack traces or SQL in responses
- Always include `request_id` in error responses

## Testing Requirements

- Unit tests for domain rules and services (mocked repos)
- Integration tests for repositories (real test Postgres)
- API tests for endpoints (httpx AsyncClient)
- Use factories in `tests/factories/`
- Override DI via `app.dependency_overrides`
- Target: ≥80% overall coverage

## Frontend Conventions (Existing MVP)

- Framework: Next.js 14 App Router, TypeScript, Tailwind
- Design tokens: CSS variables in `globals.css` (`--color-accent`, etc.)
- Shared nav: `src/components/app/` (do not duplicate sidebar markup)
- Module pages: `src/components/*Module.tsx`
- Accent color: `#0D7A5F`

## What NOT to Do

- Do not put business logic in routes or repositories
- Do not return ORM models directly from routes
- Do not commit transactions in repositories
- Do not import FastAPI/SQLAlchemy in `domain/`
- Do not skip `farm_id` filtering in any query
- Do not hard-delete operational fact records
- Do not modify architecture without a new ADR
- Do not regenerate Phase 1–4 documents — they are canonical in `docs/architecture/`

## Implementation Order (Phase 5)

1. Project scaffold (`backend/`, Docker, config, health checks)
2. Database models + Alembic migrations (from Phase 2)
3. Repository interfaces + SQLAlchemy implementations
4. Pydantic schemas (from Phase 3 request/response specs)
5. Services (business rules from Phase 1)
6. API routes (from Phase 3 endpoint catalog)
7. Auth + RBAC
8. Tests per layer
9. Background tasks (reports, notifications)

## Key References

- [Domain Model](architecture/01-domain-model.md)
- [Database Architecture](architecture/02-database-architecture.md)
- [API Contract](architecture/03-api-contract.md)
- [Backend Architecture](architecture/04-backend-architecture.md)
- [ADR Index](adr/README.md)
- [Security](security/README.md)
- [Testing](testing/README.md)
