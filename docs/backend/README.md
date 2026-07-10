# Backend Documentation Index

Quick reference for FastAPI backend implementation. The canonical blueprint is in the architecture docs.

## Canonical Document

**[FastAPI Backend Architecture (Phase 4)](../architecture/04-backend-architecture.md)** — Folder structure, layers, DI, startup, security, testing, scalability.

**[Pydantic Schemas (Phase 7)](../architecture/07-pydantic-schemas.md)** — DTO architecture, envelopes, validation split.

**[Repository Layer (Phase 8)](../architecture/08-repository-layer.md)** — Async repositories, Unit of Work, query strategy.

**[Service Layer (Phase 9)](../architecture/09-service-layer.md)** — Business workflows, rules, transactions, events.

## Related Documents

- [API Contract](../architecture/03-api-contract.md) — HTTP contract to implement
- [Pydantic Schemas](../architecture/07-pydantic-schemas.md) — Request/response DTOs
- [Repository Layer](../architecture/08-repository-layer.md) — Data access design
- [Service Layer](../architecture/09-service-layer.md) — Business logic design
- [Database Architecture](../architecture/02-database-architecture.md) — ORM model targets
- [ORM Model Design](../architecture/05-orm-models.md) — SQLAlchemy models
- [ADRs](../adr/README.md) — Accepted architecture decisions
- [Testing](../testing/README.md) — Test pyramid and fixtures
- [Deployment](../deployment/README.md) — Startup lifecycle
- [Security](../security/README.md) — Auth implementation details

## Stack

| Component | Technology |
|-----------|------------|
| Runtime | Python 3.13+ |
| Framework | FastAPI |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Validation | Pydantic v2 |
| Auth | JWT + refresh token rotation |
| Container | Docker |
| Future | Redis, Celery, Kafka |

## Layer Rules (Summary)

```
Routes  →  Services  →  Repositories  →  ORM Models  →  PostgreSQL
```

| Layer | Owns | Never Does |
|-------|------|------------|
| **Routes** | HTTP binding, status codes | Business rules, SQL |
| **Schemas** | Request/response DTOs | DB queries, auth decisions |
| **Services** | Workflows, transactions, events | Raw SQL, HTTP responses |
| **Repositories** | CRUD + query composition | Business logic, commits |
| **Domain** | Pure rules, events, value objects | Framework imports |

Full details: [§3 Layer Responsibilities](../architecture/04-backend-architecture.md#3-layer-responsibilities)

## Folder Structure

See [§2 Folder Structure](../architecture/04-backend-architecture.md#2-folder-structure) for the complete `backend/app/` layout.

## Service Catalog

| Service | Responsibility |
|---------|----------------|
| `AuthService` | Login, refresh, logout, password reset |
| `FarmService` | Farm CRUD, farm settings |
| `PondService` | Pond CRUD, status |
| `BatchService` | Stocking, transfer, mortality, lifecycle |
| `FeedingService` | Record feeding, daily schedule |
| `InventoryService` | Stock levels, movements, alerts |
| `HarvestService` | Record harvest, revenue |
| `ReportService` | Queue and retrieve reports |
| `NotificationService` | In-app and email dispatch |
| `SettingsService` | User/farm preferences |
| `UserService` | User management, roles |

## Schema Naming Convention

| Pattern | Usage |
|---------|-------|
| `{Entity}Create` | POST input |
| `{Entity}Update` | PATCH input |
| `{Entity}Response` | Single item output |
| `{Entity}Summary` | List item output |
| `{Entity}ListResponse` | Paginated list |

## Validation Layers

1. **Input** — Pydantic schemas (shape/format)
2. **Business** — Services + domain rules (invariants)
3. **Database** — Constraints + repository IntegrityError handling

See [§12 Validation Strategy](../architecture/04-backend-architecture.md#12-validation-strategy)

## Implementation Readiness Checklist

From Phase 4 — confirm before writing code:

- [ ] Phase 3 API contract reviewed
- [ ] Phase 2 database schema reviewed
- [ ] RBAC permission matrix approved
- [ ] `.env.example` finalized
- [ ] Docker Compose stack defined
- [ ] CI pipeline skeleton agreed
- [ ] Error response format agreed with frontend
- [ ] Audit log requirements confirmed
