# Testing Architecture

Quick reference for PondDesk quality engineering. **Canonical specification:** [Phase 13 — Testing Architecture](../architecture/13-testing-architecture.md).

## Related Documents

- **[Testing Architecture (Phase 13)](../architecture/13-testing-architecture.md)** — Full pyramid, suites, CI, coverage, failure scenarios
- [Security Architecture §15](../architecture/10-security-architecture.md#15-testing-strategy) — Auth/RBAC test cases
- [Background Processing §14](../architecture/12-background-processing.md#14-testing-strategy) — Task/queue/retry tests
- [API Contract §12](../architecture/03-api-contract.md#12-testing-strategy)
- [Backend Architecture §21](../architecture/04-backend-architecture.md#21-testing-architecture)
- [Backend Guide](../backend/README.md)

## Test Pyramid

```
        ╱  API / E2E   ╲     ~10%
       ╱  Integration   ╲    ~20%
      ╱  Service tests   ╲   ~30%
     ╱  Unit (domain+)    ╲  ~40%
```

## Test Categories

| Category | Scope | Database | Tools |
|----------|-------|----------|-------|
| **Unit** | Domain rules, validators, schemas | None | pytest |
| **Service** | Business workflows, mocked repos | None | pytest + fakes |
| **Repository** | CRUD, query correctness | Test Postgres | pytest |
| **API** | Full HTTP cycle, auth, RBAC | Test Postgres | pytest + httpx |
| **Auth / Security** | Login, refresh, matrix, lockout | Test Postgres | pytest + httpx |
| **Integration** | Multi-service workflows, migrations | Test Postgres | pytest |
| **E2E** | Stock → feed → harvest → report | Test Postgres | pytest + httpx |
| **Tasks** | Eager Celery, notifications, retries | Optional Redis | pytest |

## Directory Structure

```
tests/
├── conftest.py
├── factories/
├── fixtures/
├── mocks/
├── data/
├── unit/
│   ├── domain/
│   ├── services/
│   ├── schemas/
│   ├── security/
│   └── utils/
├── integration/
│   ├── repositories/
│   ├── database/
│   ├── authentication/
│   ├── migrations/
│   └── tasks/
├── api/v1/
├── e2e/user_flows/
├── security/
├── performance/
└── load/
```

## Mocking Strategy

| Component | Mock In | Real In |
|-----------|---------|---------|
| Repositories | Service / unit tests | Repository + API tests |
| Database | Unit, service tests | Integration, API tests |
| Storage backend | All except storage tests | Storage integration |
| Email/notifications | All except notification tests | Notification integration |
| Celery tasks | API tests (assert enqueue) | Task unit / eager tests |
| AI / SMS | Always fake in CI | Staging optional |

## DI Testing

Override dependencies via `app.dependency_overrides[get_db_session]` / `get_*_service`. Never monkey-patch service internals.

## CI Pipeline

```
ruff → mypy → bandit → unit → Postgres + migrations → integration/api/security → coverage (≥80%)
```

Nightly / main: E2E, migration downgrade smoke, optional load.

## Factories

Use `factory_boy` or lightweight builders. Each test creates only required data. Database reset between tests (transaction rollback or truncate).

## Coverage Targets

| Layer | Minimum |
|-------|---------|
| Domain rules | 95% |
| Services | 85% |
| Repositories | 80% |
| API routes | 75% |
| Auth helpers | 90% |
| Overall | 80% |
