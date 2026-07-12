# Testing Architecture & Quality Assurance

> **Phase:** 13 — Testing Architecture  
> **Status:** Approved — Pre-Implementation  
> **Project:** PondDesk Fish Farm Management Platform  
> **Stack:** Pytest · HTTPX · PostgreSQL (Docker) · FastAPI · SQLAlchemy 2.0 · Pydantic v2 · Python 3.13+  
> **Depends on:** Phases 3–12 (contracts, layers, security, async) · existing [Testing Index](../testing/README.md)

Designs the complete quality engineering strategy: pyramid, suite layout, unit/integration/E2E/API/DB/security/async/performance testing, fixtures, mocking, CI, coverage, and failure scenarios. No test implementation code in this phase.

## Related Documents

- [Testing Index](../testing/README.md) — Quick reference (this document is canonical for Phase 13)
- [API Contract §12](./03-api-contract.md#12-testing-strategy)
- [Backend Architecture §21](./04-backend-architecture.md#21-testing-architecture)
- [Security Architecture §15](./10-security-architecture.md#15-testing-strategy)
- [Background Processing §14](./12-background-processing.md#14-testing-strategy)
- [Service Layer §14](./09-service-layer.md#14-testing-strategy)
- [Migration Strategy](./06-migration-strategy.md) — Migration test expectations

---

## Table of Contents

- [1. Testing Philosophy](#1-testing-philosophy)
- [2. Folder Structure](#2-folder-structure)
- [3. Unit Testing Strategy](#3-unit-testing-strategy)
- [4. Integration Testing Strategy](#4-integration-testing-strategy)
- [5. End-to-End Testing Strategy](#5-end-to-end-testing-strategy)
- [6. API Testing](#6-api-testing)
- [7. Database Testing](#7-database-testing)
- [8. Security Testing](#8-security-testing)
- [9. Background Task Testing](#9-background-task-testing)
- [10. Performance Testing](#10-performance-testing)
- [11. Test Data Strategy](#11-test-data-strategy)
- [12. Mocking Strategy](#12-mocking-strategy)
- [13. CI/CD Testing Pipeline](#13-cicd-testing-pipeline)
- [14. Code Quality Standards](#14-code-quality-standards)
- [15. Coverage Strategy](#15-coverage-strategy)
- [16. Best Practices](#16-best-practices)
- [17. Architecture Decision Rationale](#17-architecture-decision-rationale)

---

## 1. Testing Philosophy

### 1.1 Goals

| Goal | How testing supports it |
|------|-------------------------|
| **Reliability** | Critical business rules (harvest ≤ population, inventory ≥ 0) have dedicated, high-coverage tests |
| **Maintainability** | Tests follow layer boundaries; fakes at ports, not deep mocks of internals |
| **Scalability of suite** | Pyramid keeps most tests fast; expensive E2E/load run selectively |
| **Production confidence** | Security, migrations, and failure scenarios are first-class, not afterthoughts |
| **Shift-left** | Domain/unit tests catch defects before API/DB wiring |

### 1.2 Test Pyramid (Authoritative)

Aligned with Phase 4 / CLAUDE.md:

```
        ╱  API / E2E   ╲     ~10%
       ╱  Integration   ╲    ~20%
      ╱  Service tests   ╲   ~30%
     ╱  Unit (domain+)    ╲  ~40%
```

| Band | Share | Speed | Dependencies |
|------|------:|-------|--------------|
| Unit (domain, schemas, security helpers, utils) | ~40% | ms | None |
| Service (workflows, fake repos/UoW) | ~30% | ms–tens ms | None / in-memory fakes |
| Integration (repos, DB, migrations, tasks eager) | ~20% | seconds | Test Postgres (+ Redis optional) |
| API / thin E2E journeys | ~10% | seconds–tens | Test Postgres + ASGI |

### 1.3 Principles

1. **Test behavior, not implementation** — assert outcomes and error codes, not private helpers  
2. **One reason to fail** — focused assertions per test  
3. **Deterministic** — fixed clocks, seeds, JWT secrets  
4. **Independent** — no order dependence; isolate DB via transaction rollback or truncate  
5. **Layer-honest** — unit tests do not boot FastAPI; API tests do not re-test Argon2 math  
6. **Farm-scoped realism** — multi-tenant leaks are regression-tested  
7. **Critical path first** — harvest, feeding+inventory, auth refresh reuse, soft delete  

### 1.4 What This Phase Does Not Do

- Does not implement pytest modules or factories  
- Does not prescribe proprietary vendor lock-in beyond Docker Postgres + pytest + httpx  
- Does not replace Phase 3 contract — API tests verify the contract  

---

## 2. Folder Structure

```
tests/
├── conftest.py                      # Root fixtures: app, db, client, settings
├── pytest.ini / pyproject.toml      # Markers, paths, coverage config
│
├── unit/
│   ├── domain/                      # Pure rules: harvest, mortality, feeding, inventory
│   ├── services/                    # Service workflows with fake repos / UoW
│   ├── schemas/                     # Pydantic validation & serialization
│   ├── security/                    # JWT build/verify, password policy, permissions bundles
│   ├── events/                      # Handler mapping (enqueue called) with mocks
│   └── utils/                       # Pagination helpers, time, money/weight VOs
│
├── integration/
│   ├── api/                         # HTTP + real DB (overlaps markers with api/)
│   ├── database/                    # Constraints, soft delete, transactions
│   ├── repositories/                # Repo CRUD against Postgres
│   ├── authentication/              # Login/refresh/logout persistence
│   ├── migrations/                  # Alembic upgrade/downgrade smoke
│   └── tasks/                       # Celery eager / outbox relay
│
├── api/                             # Alias or primary home for ASGI API suites
│   └── v1/
│       ├── auth/
│       ├── ponds/
│       ├── batches/
│       ├── feedings/
│       ├── inventory/
│       ├── harvests/
│       ├── reports/
│       └── ...
│
├── e2e/
│   └── user_flows/                  # Multi-step journeys (few, high value)
│
├── security/                        # Permission matrix, rate limit, token abuse
├── performance/                     # Benchmarks / k6 or locust scripts (optional CI nightly)
├── load/                            # Sustained load profiles (staging)
│
├── fixtures/                        # Shared pytest fixtures (session/function)
├── factories/                       # factory_boy or builders for ORM/DTOs
├── mocks/                           # Fake repos, fake email, fake storage, fake AI
└── data/                            # Static JSON/CSV samples for imports
```

### 2.1 Folder Responsibilities

| Folder | Responsibility |
|--------|----------------|
| `unit/` | Fast, no I/O; domain + services + schemas + crypto helpers |
| `integration/` | Real Postgres (and optional Redis); repos, migrations, auth persistence, eager tasks |
| `api/` | Route contracts via `httpx.AsyncClient` + ASGI; RBAC status codes |
| `e2e/user_flows/` | Long happy-path / critical journeys spanning many endpoints |
| `security/` | Dedicated abuse and matrix tests (may call API) |
| `performance/` / `load/` | Non-functional; not blocking every PR unless smoke |
| `fixtures/` | `db_session`, `client`, `auth_headers`, `farm_context` |
| `factories/` | Composable builders: User, Farm, Pond, Batch, Feeding… |
| `mocks/` | Protocol-compliant fakes for ports (storage, mailer, bus, broker) |
| `data/` | Golden files for CSV import / report fixtures |

### 2.2 Pytest Markers

| Marker | Use |
|--------|-----|
| `@pytest.mark.unit` | No Docker |
| `@pytest.mark.integration` | Needs Postgres |
| `@pytest.mark.api` | ASGI + DB |
| `@pytest.mark.e2e` | Long flows |
| `@pytest.mark.security` | Authz/authn abuse |
| `@pytest.mark.slow` | Perf / load / full migration matrix |
| `@pytest.mark.task` | Celery/async |

CI runs `unit` on every PR; `integration`+`api` with Docker services; `e2e`/`slow` on main or nightly.

---

## 3. Unit Testing Strategy

### 3.1 What to Unit-Test

| Target | Examples |
|--------|----------|
| **Business rules** | Harvest qty ≤ population; mortality ≤ population; feed archived batch rejected; inventory cannot go negative |
| **Services** | `record_harvest` happy path + rule violations with fake UoW |
| **Schemas** | Required fields, `gt=0`, email format, extra=forbid on auth DTOs |
| **Auth helpers** | Password policy; permission bundle resolution; token claim shape builders |
| **Permissions** | Role → permission set membership |
| **Utilities** | Pagination math, timezone conversion for schedules |
| **Event handlers** | Given event → `enqueue_*` called once with ids |

### 3.2 Isolation

- No real database, Redis, SMTP, or S3  
- Fake repositories implementing Phase 8 protocols  
- Fake `EventBus` recording published events  
- Fixed `JWT_SECRET` and frozen time (`freezegun` or injectable clock)  

### 3.3 Dependency Injection

- Construct services with fakes in the test (no FastAPI DI required)  
- For route-unit tests (optional): `dependency_overrides` with mock services  

### 3.4 Mocking

| Prefer | Avoid |
|--------|-------|
| Fake repo in-memory dicts | Mocking SQLAlchemy session internals |
| Spy on `EventBus.publish` | Asserting call order of private methods |
| Fake hasher (`hash == verify`) for speed where crypto not under test | Patching `argon2` globally without restore |

### 3.5 Coverage Focus

Domain rules and services: highest bar (§15). Repositories are **not** unit-tested with mocks of SQL — they belong in integration.

---

## 4. Integration Testing Strategy

### 4.1 Database & Repositories

| Test | Assert |
|------|--------|
| CRUD per aggregate | Create/read/update/soft-delete with `farm_id` |
| Uniqueness | Duplicate pond name → integrity / ConflictError |
| Soft delete filters | Soft-deleted ponds excluded from default list |
| Tenant isolation | Query with farm A never returns farm B rows |
| Ledger append-only | No update path on inventory transactions |
| Water FK | Water record requires pond; no batch_id column usage |

### 4.2 FastAPI Routes (API-integration)

Full stack: real session, real services, real repos — assert HTTP status + Phase 3 envelopes.

### 4.3 Authentication / Authorization

- Login persists hashed refresh token  
- Refresh rotation + reuse detection against DB  
- Permission denied returns `403` + `FORBIDDEN`  
- Cross-farm resource id → `404` or `403` without leakage  

### 4.4 Background Tasks

- Eager Celery mode: report `PENDING → READY`  
- Handler enqueue façade invoked after commit  
- Retry policy unit/integration with controlled failures (§9)  

### 4.5 External Services

- Use fakes implementing storage/email protocols  
- One optional “contract” test against LocalStack/MinIO in nightly  

### 4.6 DB Fixture Lifecycle

**Recommended:** function-scoped connection + transaction rollback after each test (fast).  
**Alternative:** truncate tables between tests when concurrency or commits inside nested TX break rollback.

Apply Alembic migrations once per session to a disposable database.

---

## 5. End-to-End Testing Strategy

### 5.1 Purpose

Validate **complete business journeys** that unit/service tests cannot see: auth cookies/headers, multi-endpoint state, report async polling.

Keep the E2E suite **small** (5–10 flows). Flaky E2E destroys confidence.

### 5.2 Primary Journey — Stock to Harvest

```
Register/Login
  → Create Farm (or use seeded)
  → Create Pond
  → Create Fish Batch (stock)
  → Restock Feed Inventory
  → Record Feeding
  → Record Water Test (pond-scoped)
  → Record Mortality (optional)
  → Record Harvest
  → Request Report (202)
  → Poll until READY
  → Logout / refresh revoked
```

### 5.3 Additional Workflows

| Flow | Critical asserts |
|------|------------------|
| **Worker daily ops** | Worker can feed + water; cannot harvest; cannot invite users |
| **Manager inventory** | Restock OK; adjust denied if MVP policy |
| **Missed feeding path** | Seed due feeding → run reminder task → notification exists |
| **Low stock** | Feed below threshold → notification + error_code path |
| **Harvest over-limit** | Attempt excess qty → `HARVEST_EXCEEDS_COUNT`; batch unchanged |
| **Token reuse** | Refresh twice with old token → family revoked |
| **Multi-farm switch** | User in two farms; data never crosses |
| **Soft delete pond** | Deleted pond hidden; historical facts retained |

### 5.4 E2E Execution

- Same Docker Postgres as integration  
- Real app factory; fake email/storage  
- Celery eager for report completion in-process  
- Marker `@e2e`; run on main / nightly / pre-release  

---

## 6. API Testing

### 6.1 Matrix

| Area | Cases |
|------|-------|
| **Authentication** | Login success/fail; refresh; logout; `/me` |
| **CRUD** | Create 201; get 200; patch 200; soft-delete 200 |
| **Pagination** | `page`, `limit`, `total`, `has_next`; max limit clamp |
| **Filtering / sorting** | Status filters; `sort`/`order`; invalid sort → 422 |
| **Validation** | Missing fields; negative qty; bad UUID → 422 envelope |
| **Permissions** | Each role × sensitive route (see §8) |
| **Error responses** | `error_code`, `request_id`, no stack traces |
| **Idempotent reads** | GET does not mutate |
| **File uploads** | Valid image 201; oversize/wrong MIME 422 |
| **Exports / reports** | 202 + PENDING; download when READY; 404 other farm |
| **Water invariant** | Reject batch_id on water create if client sends it |

### 6.2 Client Setup

- `httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test")`  
- Helper to obtain Bearer tokens per role  
- Assert against Phase 7 envelope models where practical  

### 6.3 OpenAPI Drift (Optional)

Snapshot or schemathesis against `/openapi.json` on main — catch undocumented breaking changes.

---

## 7. Database Testing

| Concern | Strategy |
|---------|----------|
| **Migrations** | `alembic upgrade head` on empty DB; optional `downgrade -1` + upgrade; model metadata vs DB diff check |
| **Constraints** | Unique `(farm_id, pond_name)`; FK violations; CHECK qty > 0 if present |
| **Indexes** | Existence smoke for hot paths (optional); EXPLAIN in perf suite |
| **Relationships** | ORM relationship loads (`selectinload`) in repo tests |
| **Transactions** | Service commit atomicity: force mid-flow error → no partial harvest |
| **Rollback** | Exception before commit leaves DB clean |
| **Cascade** | Prefer soft delete; verify hard-delete cascades only where designed (usually none on facts) |
| **Soft deletes** | `deleted_at` set; default queries filter; admin restore path if any |
| **Ledger immutability** | Attempted update/delete of inventory_transactions fails or is unsupported |

Use **Testcontainers** or Compose Postgres 15+ matching production major version.

---

## 8. Security Testing

Align with Phase 10 §15 mandatory cases.

| Category | Cases |
|----------|-------|
| **JWT** | Valid access; tampered signature; wrong `aud`/`iss`; missing Bearer |
| **Expiry** | Expired access → `EXPIRED_TOKEN`; refresh still works if valid |
| **Revocation** | Logout refresh unusable; `token_version` bump invalidates access |
| **Refresh reuse** | Second use → family revoke + `TOKEN_REUSE_DETECTED` / invalid |
| **Permission matrix** | Table-driven: role × endpoint × allow/deny |
| **Farm escape** | Substitute another farm’s UUID in path/body |
| **Rate limiting** | Login flood → 429 (may use low limits in test settings) |
| **Lockout** | N failures → `ACCOUNT_LOCKED` |
| **Password reset** | Generic response; token single-use; expired token rejected |
| **Session** | Logout-all clears all refresh rows |
| **Enumeration** | Login/forgot-password identical messages for unknown email |
| **Headers** | Security headers present on responses (smoke) |

Security tests may live under `tests/security/` but share API fixtures.

---

## 9. Background Task Testing

| Area | Approach |
|------|----------|
| **Task body** | Call task function with fake DB session / services; assert side effects |
| **Eager mode** | `task_always_eager=True` in CI for report + email |
| **Scheduled jobs** | Invoke periodic task directly; assert fan-out `enqueue` per farm |
| **Notifications** | Event → in-app row; email backend fake records message |
| **Retries** | Raise transient error; assert retry count / eventual DLQ behavior (unit with mocks) |
| **Queue routing** | Config test: report tasks route to `reports` |
| **Worker recovery** | Document manual/chaos tests in staging; optional soft-timeout test |
| **Idempotency** | Run same task twice with same key → one email / one READY report |
| **Failure marking** | Exhaust retries → `reports.status=FAILED` + notification |

Do not require live SMTP/Redis broker for default PR CI; use fakes + eager.

---

## 10. Performance Testing

### 10.1 Objectives

| Type | Question |
|------|----------|
| **Load** | Sustained N RPS with p95 latency SLO |
| **Stress** | Breaking point / graceful degradation |
| **Concurrency** | Parallel harvest/feed on same batch → no negative population |
| **DB performance** | Hot query plans; N+1 detection on list endpoints |
| **API latency** | Dashboard, list ponds, record feeding p95 budgets |
| **Resources** | Worker memory during PDF; API RSS under load |

### 10.2 Tooling

| Tool | Use |
|------|-----|
| Locust / k6 | HTTP load against staging |
| pytest-benchmark | Microbenchmarks for domain rules (optional) |
| SQLAlchemy echo / counters | N+1 in integration |
| Docker stats | Memory/CPU during report generation |

### 10.3 Indicative SLOs (Tune Later)

| Endpoint class | p95 target (staging) |
|----------------|----------------------|
| Auth login | < 500 ms |
| Simple GET | < 200 ms |
| Record feeding/harvest | < 400 ms |
| Dashboard aggregate | < 500 ms |
| Report generate (async accept) | < 300 ms to 202 |

Perf/load suites are `@slow` — nightly or pre-release, not every PR.

### 10.4 Concurrency / Race Tests

- Two concurrent harvests exceeding total population → one success, one business error; final qty ≥ 0  
- Parallel feedings depleting inventory → no negative stock  
- Use `SELECT … FOR UPDATE` paths exercised under asyncio gather / threads as designed in Phase 9  

---

## 11. Test Data Strategy

### 11.1 Factories

Use `factory_boy` or typed builder functions:

| Factory | Builds |
|---------|--------|
| `UserFactory` | User + password hash |
| `FarmFactory` | Farm + settings |
| `MembershipFactory` | User↔Farm↔Role |
| `PondFactory` | Pond in farm |
| `BatchFactory` | Active batch with counts |
| `InventoryFactory` | Feed SKU + qty |
| `FeedingFactory` / `HarvestFactory` | Fact rows |

**Rules:** minimal fields; override only what the test needs; never share mutable factory state across tests.

### 11.2 Fixtures

| Fixture | Scope | Provides |
|---------|-------|----------|
| `engine` / `db_session` | session / function | Migrated DB + rollback |
| `app` | session | FastAPI app |
| `client` | function | AsyncClient |
| `auth_admin` / `auth_manager` / `auth_worker` | function | Headers + user |
| `farm` | function | Default farm context |
| `celery_eager` | session | Eager task mode |

### 11.3 Seed vs Fake vs Random

| Kind | When |
|------|------|
| **Seed data** | Roles/permissions bundles; species list |
| **Fake deterministic** | Default factory values (`Pond-1`) |
| **Randomized** | Fuzz validation boundaries (Hypothesis optional) |
| **Static `tests/data/`** | CSV import golden files |

### 11.4 Reusable Objects

Compose fixtures: `active_batch_with_inventory` = farm + pond + batch + feed stock — documented in `fixtures/scenarios.py` to avoid copy-paste E2E setup.

---

## 12. Mocking Strategy

| Component | Unit / Service | Integration / API | Notes |
|-----------|----------------|-------------------|-------|
| Repositories | Fake implementations | Real SQLAlchemy | |
| Database | None | Test Postgres | |
| EventBus | Recording fake | Real in-process bus | |
| Email | `FakeEmailSender` | Same | Never real SMTP in CI |
| SMS / Push | Fake | Fake | |
| Redis | Fake / fakeredis | Optional real for rate-limit tests | |
| Object storage | `InMemoryStorage` | MinIO optional nightly | ADR-012 protocol |
| AI services | Stub responses | Stub | |
| Celery broker | Eager / mock enqueue | Eager | |
| Clock | Injectable / frozen | Frozen for expiry tests | |
| Argon2 | Real in security unit tests; fast params in CI | Real | Lower memory params in test settings |

**Rule:** Mock at **ports** (protocols), not at random internal functions.

---

## 13. CI/CD Testing Pipeline

### 13.1 PR Pipeline (Block Merge)

```
checkout
  → ruff check + ruff format --check
  → mypy
  → bandit (high severity gate)
  → pytest -m "unit" 
  → docker compose up postgres
  → alembic upgrade head
  → pytest -m "integration or api or security" --cov
  → coverage gate (≥80% overall; see §15)
  → pip-audit / dependabot already on repo
```

### 13.2 Main / Nightly

```
PR pipeline
  → pytest -m "e2e"
  → migration upgrade/downgrade smoke
  → optional schemathesis
  → optional load smoke against ephemeral env
```

### 13.3 Artifacts

- JUnit XML for CI UI  
- Coverage XML/HTML  
- Failed test logs with `request_id`  

### 13.4 Build Verification

- Docker image build  
- App imports (`python -c "from app.main import create_app"`)  
- OpenAPI generation succeeds  

---

## 14. Code Quality Standards

| Tool | Role | Gate |
|------|------|------|
| **Ruff** | Lint + import sort + **format** (replaces Black) | PR must pass |
| **Black** | Optional if team insists; prefer Ruff format alone | — |
| **MyPy** | Static types (`strict` gradually on `domain/`, `services/`) | PR must pass |
| **Bandit** | Security lint | Fail on high |
| **pip-audit** | Dependency CVEs | Fail/warn policy |
| **Pre-commit** | ruff, mypy (local), trailing whitespace | Recommended for all devs |
| **Coverage** | pytest-cov | §15 thresholds |

### 14.1 Pre-commit Hooks (Recommended)

```
ruff check --fix
ruff format
mypy (on staged packages)
```

No `--no-verify` in team workflow (matches project git rules).

---

## 15. Coverage Strategy

### 15.1 Targets (Realistic)

| Scope | Minimum | Aspirational |
|-------|--------:|-------------:|
| **Overall** | **80%** | 85% |
| Domain rules | **95%** | 100% |
| Services | **85%** | 90% |
| Repositories | **80%** | 85% |
| API routes | **75%** | 80% |
| Authentication / security helpers | **90%** | 95% |
| Critical business paths (harvest, feeding+inventory, refresh reuse) | Line + branch exercised | Explicit scenario list 100% |

### 15.2 Why Not 100% Overall?

- Glue code, `main.py` wiring, and rare admin paths have diminishing returns  
- Background provider adapters may be thin wrappers  
- Prefer **critical path certainty** over vanity overall %  

### 15.3 Enforcement

- CI fails under overall 80%  
- Optional per-package fail under domain 95% / services 85%  
- Do not exclude `services/` or `domain/` from coverage  

### 15.4 Qualitative Gates (Beyond %)

Mandatory scenario checklists from Phase 10 §15.2 and Phase 9 workflows must exist as named tests — coverage % alone is insufficient.

---

## 16. Best Practices

### 16.1 AAA Pattern

```
Arrange — factories + auth context
Act     — service call or HTTP request
Assert  — status, envelope, DB state, events published
```

### 16.2 Independence & Speed

- No shared mutable DB state  
- Unit tests < 100ms each ideally  
- Parallelize unit with pytest-xdist; be careful with shared DB for integration  

### 16.3 Determinism

- Fixed JWT secret  
- Frozen time for `exp`  
- Sorted assertions on unordered sets  
- Avoid `utcnow()` without injection  

### 16.4 Naming

```
test_<unit>_<condition>_<expected>
test_record_harvest_when_qty_exceeds_population_raises_business_rule
test_worker_cannot_post_harvests_returns_403
```

### 16.5 Assertions

- Prefer exact `error_code` over substring message matching  
- Assert event published **after** commit (mock call order / bus recording)  
- Assert **absence** of cross-tenant data  

### 16.6 Failure Scenario Catalog

| Scenario | Layer |
|----------|-------|
| DB connection lost mid-request | Integration / chaos staging |
| Duplicate pond name | Service + API + DB constraint |
| Race on harvest qty | Concurrency integration |
| Concurrent inventory deplete | Concurrency integration |
| Invalid JSON / schema | API 422 |
| Permission denied | API/security 403 |
| Expired / revoked token | Security 401 |
| Report worker failure | Task → FAILED + user visible |
| Soft-deleted pond reuse | Business rule 409/404 |

### 16.7 Anti-Patterns

- Testing Framework instead of product (asserting FastAPI internals)  
- Excess E2E for every CRUD  
- Sleep-based async waits without polling helpers  
- Production credentials in fixtures  
- Skipping failing tests without ticket  

---

## 17. Architecture Decision Rationale

| # | Decision | Alternatives | Rationale |
|---|----------|--------------|-----------|
| QA-001 | Pyramid 40/30/20/10 | Ice cream cone (UI-heavy) | Fast feedback; matches Phase 4 |
| QA-002 | Test Postgres for integration | SQLite | Parity with JSONB, UUIDs, constraints |
| QA-003 | Transaction rollback isolation | Truncate always | Speed for large suites |
| QA-004 | Fake ports over mock internals | Heavy Mockito-style | Stable under refactors |
| QA-005 | Celery eager in CI | Always live Redis workers | Deterministic PR CI |
| QA-006 | Small E2E set | Full UI E2E day one | Backend API journeys first |
| QA-007 | Ruff format (not Black required) | Black + isort | One tool; already in stack |
| QA-008 | Overall coverage ≥80% | 100% mandate | Realistic; critical-path checklists |
| QA-009 | Table-driven RBAC tests | Ad-hoc per route | Matrix completeness (Phase 10) |
| QA-010 | Concurrency tests for qty/inventory | Optimistic only | Protects ledger invariants |
| QA-011 | Markers for CI selection | Run everything always | Keep PR fast |
| QA-012 | Security suite first-class | Bury in API tests | Explicit abuse coverage |
| QA-013 | Factories over static fixtures-only | Giant seed DB | Per-test minimal data |
| QA-014 | Design-only this phase | Write all tests now | Matches phases 5–12 discipline |

### 17.1 Alignment Map

| Source | Contribution |
|--------|--------------|
| Phase 3 §12 | API test categories |
| Phase 4 §21 | Pyramid, DI overrides, CI sketch |
| Phase 6 | Migration testing |
| Phase 9–12 | Workflow, security, task scenarios |
| Phase 13 | This specification — full QA architecture |

### 17.2 Implementation Readiness Checklist

- [ ] Create `tests/` tree + markers in `pyproject.toml`  
- [ ] Docker Compose `db` for CI + local  
- [ ] Factories for User/Farm/Pond/Batch/Inventory  
- [ ] Unit tests for all Phase 9 critical rules  
- [ ] Service tests with fake UoW for harvest/feeding/inventory  
- [ ] API auth + RBAC matrix  
- [ ] Migration upgrade smoke in CI  
- [ ] Coverage gate 80% + domain 95%  
- [ ] Pre-commit: ruff + mypy  
- [ ] Document how to run `unit` vs `integration` locally  

---

**Document Status:** Ready for test harness & suite implementation.  
**Next Phase:** [Phase 14 — Infrastructure Architecture](./14-infrastructure-architecture.md), then [Phase 15 — CI/CD & Production Deployment](./15-cicd-deployment-architecture.md).
