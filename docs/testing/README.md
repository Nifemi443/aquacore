# Testing Architecture

Testing strategy consolidated from Phase 3 (API) and Phase 4 (Backend).

## Related Documents

- [API Contract §12](../architecture/03-api-contract.md#12-testing-strategy)
- [Backend Architecture §21](../architecture/04-backend-architecture.md#21-testing-architecture)
- [Backend Guide](../backend/README.md)

## Test Pyramid

```
        ╱  API Tests  ╲          (10%)
       ╱ Integration   ╲        (20%)
      ╱  Service Tests   ╲      (30%)
     ╱   Unit Tests        ╲    (40%)
```

## Test Categories

| Category | Scope | Database | Tools |
|----------|-------|----------|-------|
| **Unit** | Domain rules, validators, schemas | None | pytest |
| **Service** | Business workflows, mocked repos | None | pytest + mock |
| **Repository** | CRUD, query correctness | Test Postgres | pytest |
| **API** | Full HTTP cycle, auth, RBAC | Test Postgres | pytest + httpx |
| **Auth** | Login, refresh, token expiry | Test Postgres | pytest + httpx |
| **Integration** | Multi-service workflows | Test Postgres | pytest |

## Directory Structure

```
tests/
├── conftest.py
├── factories/          # user_factory, pond_factory, batch_factory
├── fixtures/
├── unit/
│   ├── domain/
│   ├── services/
│   └── validators/
├── integration/
│   ├── repositories/
│   └── database/
└── api/
    ├── v1/
    └── auth/
```

## Mocking Strategy

| Component | Mock In | Real In |
|-----------|---------|---------|
| Repositories | Service tests | Repository + API tests |
| Database | Unit, service tests | Integration, API tests |
| Storage backend | All except storage tests | Storage integration |
| Email/notifications | All except notification tests | Notification integration |
| Celery tasks | API tests (assert enqueue) | Task unit tests |

## DI Testing

Override dependencies via `app.dependency_overrides[get_db_session]`. Never monkey-patch service internals.

## CI Pipeline

```
lint (ruff) → type-check (mypy) → unit → integration (Docker Postgres) → API → coverage (≥80%)
```

## Factories

Use `factory_boy` or lightweight factory functions. Each test creates only required data. Database reset between tests (transaction rollback or truncate).

## Coverage Targets

| Layer | Minimum |
|-------|---------|
| Domain rules | 95% |
| Services | 85% |
| Repositories | 80% |
| API routes | 75% |
| Overall | 80% |
