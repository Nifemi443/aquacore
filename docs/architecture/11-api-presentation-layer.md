# FastAPI Routes, Dependency Injection & API Presentation Layer

> **Phase:** 11 — API Presentation Layer  
> **Status:** Approved — Pre-Implementation  
> **Project:** PondDesk Fish Farm Management Platform  
> **Stack:** FastAPI · Pydantic v2 · JWT · Python 3.13+  
> **Depends on:** Phase 3 (wire contract) · Phase 4 (app layout) · Phase 7 (DTOs) · Phase 9 (services) · Phase 10 (auth dependencies)

Designs the HTTP delivery layer: thin routers, dependency injection, envelopes, OpenAPI, middleware wiring, and health endpoints. No business logic, SQL, repositories, or service implementations in this phase.

## Related Documents

- [API Contract](./03-api-contract.md) — Endpoint catalog, envelopes, status codes (wire source of truth)
- [Backend Architecture §10](./04-backend-architecture.md#10-route-architecture) — Thin-route rules
- [Pydantic Schemas](./07-pydantic-schemas.md) — Request/response DTOs
- [Service Layer](./09-service-layer.md) — Use cases routes call
- [Security Architecture](./10-security-architecture.md) — Auth dependencies & middleware
- [API Guide](../api/README.md) — Router map quick reference

---

## Table of Contents

- [1. API Layer Overview](#1-api-layer-overview)
- [2. Folder Structure](#2-folder-structure)
- [3. Router Organization](#3-router-organization)
- [4. Dependency Injection Design](#4-dependency-injection-design)
- [5. Request Lifecycle](#5-request-lifecycle)
- [6. Response Standards](#6-response-standards)
- [7. Error Handling](#7-error-handling)
- [8. Middleware Stack](#8-middleware-stack)
- [9. Health Endpoints](#9-health-endpoints)
- [10. OpenAPI Strategy](#10-openapi-strategy)
- [11. Rate Limiting](#11-rate-limiting)
- [12. Testing Strategy](#12-testing-strategy)
- [13. Best Practices](#13-best-practices)
- [14. Architecture Decision Rationale](#14-architecture-decision-rationale)

---

## 1. API Layer Overview

### 1.1 Role in Clean Architecture

```
Client (Web / Mobile)
        ↓
   Middleware (CORS, request_id, rate limit, headers)
        ↓
   FastAPI Route  ← THIS LAYER (presentation only)
        ↓  Depends: user, permission, service
   Service Layer  (Phase 9)
        ↓
   Repository / UoW (Phase 8)
        ↓
   PostgreSQL
```

The presentation layer translates HTTP ↔ application use cases. It owns status codes, OpenAPI metadata, dependency wiring, and envelope wrapping. It does **not** own business rules.

### 1.2 Design Goals

| Goal | Approach |
|------|----------|
| **Extremely thin** | One service call per handler; no branching business logic |
| **DI everywhere** | Session, user, permissions, services via `Depends` |
| **Standardized responses** | Phase 3 success/error envelopes |
| **Documented** | Tags, examples, security schemes, response models |
| **Testable** | `dependency_overrides` + mock services |
| **Versioned** | `/api/v1/` package; `/api/v2/` when breaking |

### 1.3 What Routes Must Never Do

| Forbidden | Belongs in |
|-----------|------------|
| SQL / `AsyncSession` queries | Repositories |
| Business rules / calculations | Services / domain |
| `commit()` / transaction policy | Services / UoW |
| Generate reports / send email | Services + background tasks |
| Create notifications directly | Event handlers / NotificationService |
| Decode JWT manually in handlers | `dependencies/auth.py` |
| Return raw ORM models | Map via Phase 7 response schemas |
| Catch exceptions locally (except rare streaming) | Centralized exception handlers |

**Why:** Duplicating logic in routes breaks mobile/IoT clients that share the same services, makes RBAC inconsistent, and defeats the test pyramid (service tests become useless if routes reimplement rules).

### 1.4 Route Responsibilities (Only)

1. Bind path/query/body to Pydantic schemas  
2. Declare dependencies (auth, permission, service)  
3. Call **one** service method  
4. Map result → response DTO / envelope  
5. Set HTTP status (`200`, `201`, `202`, …)  
6. Contribute OpenAPI metadata (summary, tags, responses)

---

## 2. Folder Structure

### 2.1 Recommended Layout

Extends Phase 4’s flat `endpoints/*.py` into **one package per resource** for growth (water, mortality, files, dashboard) without mega-files.

```
app/
├── main.py                          # create_app(), middleware, exception handlers
│
├── api/                             # HTTP presentation layer
│   ├── __init__.py
│   ├── router.py                    # Mounts /api → version routers
│   ├── responses/                   # Envelope helpers (success/error builders)
│   │   ├── __init__.py
│   │   ├── envelopes.py             # ok(), created(), accepted(), fail helpers
│   │   └── examples.py              # OpenAPI example payloads
│   └── v1/
│       ├── __init__.py
│       ├── router.py                # Aggregates all v1 resource routers
│       ├── auth/
│       │   ├── __init__.py
│       │   └── routes.py
│       ├── users/
│       ├── farms/
│       ├── ponds/
│       ├── batches/
│       ├── feeding/                 # Daily feedings
│       ├── inventory/
│       ├── water/
│       ├── mortality/
│       ├── harvest/
│       ├── reports/
│       ├── notifications/
│       ├── settings/
│       ├── files/                   # Uploads (Phase 3 §14.8)
│       ├── dashboard/               # Aggregated dashboard
│       ├── search/                  # Global search (if in contract)
│       └── health/
│
├── dependencies/                    # FastAPI DI providers (NOT inside api/ only)
│   ├── db.py
│   ├── auth.py
│   ├── permissions.py
│   ├── services.py
│   └── repositories.py              # Optional; prefer services-only injection
│
├── middleware/
│   ├── request_id.py
│   ├── request_logging.py
│   ├── security_headers.py
│   └── rate_limit.py
│
├── exceptions/
│   ├── handlers.py                  # register_exception_handlers(app)
│   └── ...
│
└── schemas/                         # Phase 7 DTOs (imported by routes)
```

### 2.2 Folder Responsibilities

| Path | Responsibility |
|------|----------------|
| `api/` | HTTP adapters only — routers, response helpers |
| `api/router.py` | Mount `APIRouter(prefix="/api")` → `v1` |
| `api/v1/router.py` | `include_router` for each resource with tags/prefixes |
| `api/v1/<resource>/routes.py` | Endpoint functions for that resource |
| `api/responses/` | Shared envelope construction + OpenAPI examples |
| `dependencies/` | Reusable `Depends` callables (session, user, services) |
| `middleware/` | ASGI cross-cutting concerns |
| `exceptions/handlers.py` | Map domain/app errors → HTTP envelopes |
| `main.py` | Application factory; wires middleware + handlers + routers |

### 2.3 Naming

| Item | Convention |
|------|------------|
| Router module | `routes.py` inside package |
| Router variable | `router = APIRouter()` |
| Prefix | Set at `include_router(..., prefix="/ponds")` in `v1/router.py` |
| Operation id | `{resource}_{action}` e.g. `ponds_create`, `harvests_record` |

---

## 3. Router Organization

### 3.1 Version Aggregator

```
/api/v1/router includes:
  auth, users, farms, ponds, batches, feeding, inventory,
  water, mortality, harvest, reports, notifications, settings,
  files, dashboard, search, health
```

Base path: **`/api/v1`**. Health may also be exposed at `/health` (unversioned) for probes — see §9.

### 3.2 Routers Catalog

| Router | Prefix | Why it exists | Auth |
|--------|--------|---------------|------|
| **auth** | `/auth` | Login, refresh, logout, register, password flows | Mixed (public + protected) |
| **users** | `/users` | Invite, list members, change role, remove | JWT + `users:*` |
| **farms** | `/farms` | Farm CRUD, switch context | JWT + farm perms |
| **ponds** | `/ponds` | Pond master data | JWT + `ponds:*` |
| **batches** | `/batches` | Stocking, transfer, close, lifecycle | JWT + `batches:*` |
| **feeding** | `/feedings` | Daily feeding records | JWT + `feedings:*` |
| **inventory** | `/inventory` | Feed stock, restock, adjust | JWT + `inventory:*` |
| **water** | `/water-records` | Pond-scoped water tests (not batch) | JWT + `water:*` |
| **mortality** | `/mortalities` or under batches | Mortality recording | JWT + `mortality:*` |
| **harvest** | `/harvests` | Harvest recording / void | JWT + `harvests:*` |
| **reports** | `/reports` | Async report jobs + download | JWT + `reports:*` |
| **notifications** | `/notifications` | In-app list/dismiss | JWT + `notifications:*` |
| **settings** | `/settings` | Farm + user preferences | JWT + `settings:*` |
| **files** | `/files` | Multipart uploads | JWT + purpose checks |
| **dashboard** | `/dashboard` | Single aggregated read | JWT + `dashboard:read` |
| **search** | `/search` | Cross-entity search | JWT |
| **health** | `/health` | Liveness/readiness/version | Public |

### 3.3 Why Separate Routers

- **OpenAPI tags** stay clean and navigable  
- **Permission defaults** can be applied per-router where useful  
- **Code ownership** maps to product modules  
- **Test isolation** — override one service per router suite  
- **Water vs batches** stay separate so pond-only water rule is not buried in batch routes  

### 3.4 Example Thin Handler (Design Sketch — Not Implementation)

```
POST /api/v1/harvests
  Depends: get_current_active_user, require_permission("harvests:write"), get_harvest_service
  Body: HarvestCreate
  → result = await harvest_service.record_harvest(body, current_user)
  → return envelope(HarvestResponse.model_validate(result), status=201)
```

No quantity checks, no inventory math, no `session.commit` in the route.

### 3.6 File Upload Routes

| Item | Spec |
|------|------|
| Route | `POST /api/v1/files/upload` |
| Content-Type | `multipart/form-data` |
| Fields | `file`, `purpose` (`PROFILE`, `FARM_LOGO`, `WATER_TEST`, `HARVEST`) |
| Auth | JWT + farm scope |
| Max size | 5 MB images |
| Types | JPEG, PNG, WebP — MIME + magic-byte check |

**Thin route behavior:** validate multipart → `FileService.save_upload(...)` → `created(FileResponse)`. Route does **not** talk to S3; storage protocol is behind the service (ADR-012). Metadata in DB; access via signed URLs (1-hour). Optional convenience: `POST /harvests/{id}/images` still delegates to `FileService`.

### 3.7 API Versioning

| Topic | Policy |
|-------|--------|
| Current | `/api/v1/` — all MVP features |
| Breaking change | Introduce `/api/v2/` package parallel to `v1/` |
| Deprecation | `Deprecation` + `Sunset` headers; ≥ 6 months overlap (Phase 3 §14.7) |
| Non-breaking | New optional response fields / new endpoints stay in v1 |
| Compatibility | v1 routers must not silently change error_code meanings |
| Shared code | Dependencies, schemas, services shared; only route adapters version |

```
app/api/
  v1/   ← current
  v2/   ← future breaking surface (empty until needed)
```

---

## 4. Dependency Injection Design

### 4.1 Provider Catalog

| Provider | Module | Yields | Scope |
|----------|--------|--------|-------|
| `get_settings` | `config` / deps | `Settings` | App singleton (`lru_cache`) |
| `get_db_session` | `dependencies/db.py` | `AsyncSession` | **Request** (yield + close) |
| `get_uow` | `dependencies/db.py` | `UnitOfWork` | Request |
| `get_current_user` | `dependencies/auth.py` | `CurrentUser` | Request |
| `get_current_active_user` | `dependencies/auth.py` | `CurrentUser` | Request |
| `require_permission(code)` | `dependencies/permissions.py` | Callable dependency | Request |
| `get_*_service` | `dependencies/services.py` | Service instance | Request |
| `get_storage` | `dependencies/…` | Storage protocol | App or request |

### 4.2 Lifecycles

| Lifecycle | Examples | Rules |
|-----------|----------|-------|
| **Singleton** | Settings, JWT verifier public key, engine | Created once at startup |
| **Request-scoped** | DB session, UoW, services, CurrentUser | New per request; session closed in `finally` |
| **Factory (per call)** | `require_permission("x")` | Returns a Depends-compatible callable |

### 4.3 Wiring Pattern

```
get_harvest_service
  ← depends on get_uow (or session + repos)
  ← constructs HarvestService(uow, event_bus, …)
  ← route Depends(get_harvest_service)
```

**Prefer injecting services into routes**, not repositories. Routes that inject repos bypass the service layer and recreate Phase 9 anti-patterns.

### 4.4 Auth & Permission Composition

```
Protected write route:
  current_user: CurrentUser = Depends(get_current_active_user)
  _: None = Depends(require_permission("ponds:write"))
  service: PondService = Depends(get_pond_service)
```

Public auth routes omit user dependencies. Refresh uses refresh-token validation, not access JWT.

### 4.5 Test Overrides

```
app.dependency_overrides[get_db_session] = override_session
app.dependency_overrides[get_current_user] = lambda: fake_manager
app.dependency_overrides[get_harvest_service] = lambda: mock_harvest_service
```

Clear overrides in fixture teardown.

### 4.6 Configuration Injection

- Routes never read `os.environ`  
- Services receive settings via constructor if needed  
- Feature flags (e.g. email verification required) come from `Settings`

---

## 5. Request Lifecycle

### 5.1 End-to-End Flow

```
1. Client
     → HTTPS request + optional Authorization + X-Farm-Id + X-Request-Id
2. Middleware (outer → inner)
     → Trusted Host → CORS → GZip → Request ID → Security Headers
     → Rate Limit → Logging / Timing
3. FastAPI routing
     → Match path + method to handler
4. Dependency injection
     → Settings / session / UoW
5. Authentication (Depends)
     → Validate access JWT → CurrentUser (or skip if public)
6. Authorization (Depends)
     → require_permission / farm membership
7. Pydantic validation
     → Path, query, body schemas (422 on failure)
8. Route handler
     → Call service method with DTOs + CurrentUser
9. Service layer
     → Business rules, multi-repo coordination, commit, events
10. Repository layer
     → Parameterized SQLAlchemy access, farm_id filters
11. Database
     → Persist / read
12. Response serialization
     → ORM/entity → Response schema → success envelope
13. Exception handlers (on failure)
     → Map to error envelope + status
14. Client
     → JSON + request_id
```

### 5.2 Step Notes

| Step | Notes |
|------|-------|
| Auth before handler body | Fail 401 before service work |
| Validation before service | Shape errors never hit domain |
| One service call | Keeps transactions coherent |
| Envelope after success | Routes use shared `ok()` / `created()` helpers |
| Events after commit | Inside service (Phase 9), invisible to route |

### 5.3 Farm Context Resolution

1. JWT carries `farm_id`  
2. Optional `X-Farm-Id` must match JWT (or trigger switch-farm flow — Phase 10)  
3. Service still verifies entity `farm_id`  

---

## 6. Response Standards

### 6.1 Success Envelope (Phase 3)

```json
{
  "success": true,
  "message": "Harvest recorded successfully.",
  "data": { },
  "request_id": "req_abc123"
}
```

| Helper | HTTP | Use |
|--------|------|-----|
| `ok(data, message)` | 200 | GET, PATCH, DELETE, actions |
| `created(data, message)` | 201 | POST create |
| `accepted(data, message)` | 202 | Async reports |
| Prefer envelope over bare `204` | — | Clients parse one shape |

### 6.2 Paginated Success

```json
{
  "success": true,
  "message": "Ponds retrieved successfully.",
  "data": {
    "items": [ ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "total_pages": 8,
      "has_next": true,
      "has_previous": false
    }
  },
  "request_id": "req_abc123"
}
```

### 6.3 Error Envelope

```json
{
  "success": false,
  "message": "Harvest quantity exceeds current fish count.",
  "error_code": "HARVEST_EXCEEDS_COUNT",
  "errors": [
    { "field": "quantity", "message": "…", "code": "VALUE_TOO_HIGH" }
  ],
  "request_id": "req_abc123"
}
```

### 6.4 Error Categories → HTTP

| Category | HTTP | Example `error_code` |
|----------|------|----------------------|
| Validation (Pydantic) | 422 | `VALIDATION_ERROR` |
| Business rule | 409 or 422 | `HARVEST_EXCEEDS_COUNT` |
| Authentication | 401 | `EXPIRED_TOKEN`, `INVALID_CREDENTIALS` |
| Authorization | 403 | `FORBIDDEN`, `FARM_ACCESS_DENIED` |
| Not found | 404 | `NOT_FOUND` |
| Conflict | 409 | `DUPLICATE_POND_NAME` |
| Rate limit | 429 | `RATE_LIMITED` |
| Unexpected | 500 | `INTERNAL_ERROR` (no internals) |

### 6.5 Metadata Headers

| Header | Purpose |
|--------|---------|
| `X-Request-Id` | Correlation (echo client or generate) |
| `X-Response-Time` | Timing middleware |
| `Deprecation` / `Sunset` | Version sunset |
| `Retry-After` | On 429 |

---

## 7. Error Handling

### 7.1 Centralized Handlers

Register once in `create_app()`:

| Exception | Handler behavior |
|-----------|------------------|
| `RequestValidationError` | 422 envelope; field errors from Pydantic |
| `AuthenticationError` | 401 + security `error_code` |
| `AuthorizationError` | 403 |
| `NotFoundError` | 404 |
| `ConflictError` | 409 |
| `BusinessRuleError` | 409/422 per Phase 3 map |
| `RateLimitError` | 429 + `Retry-After` |
| `IntegrityError` (escaped) | Map to 409/400 — prefer catch in repo/service |
| `AppException` (base) | Use `status_code` + `error_code` on exception |
| `Exception` | 500 `INTERNAL_ERROR`; log stack with `request_id` |

### 7.2 Route Policy

- Routes **do not** `try/except` for business errors  
- Services raise typed exceptions  
- Handlers attach `request_id` from context var  

### 7.3 Database Exceptions

- Repositories translate unique violations → `ConflictError` where possible  
- Unhandled DB errors → 500 after logging; never leak SQL  

### 7.4 HTTPException

- Avoid ad-hoc `HTTPException` in services  
- Allowed sparingly in dependencies (auth) **or** map dependency failures to `AuthenticationError` for one envelope path  

---

## 8. Middleware Stack

### 8.1 Order (Outermost → Innermost)

| # | Middleware | Why this position |
|---|------------|-------------------|
| 1 | **Trusted Hosts** | Reject bad Host before any work |
| 2 | **CORS** | Handle preflight early |
| 3 | **GZip** | Compress final body; after CORS |
| 4 | **Request ID** | Available for all subsequent logs/errors |
| 5 | **Security Headers** | Apply to all responses |
| 6 | **Rate Limiting** | Cheap reject before auth/DB |
| 7 | **Request Logging** | Has request_id; logs status after call |
| 8 | **Timing** | Measures inner stack including route |

### 8.2 Not Middleware

| Concern | Mechanism |
|---------|-----------|
| Authentication | `Depends(get_current_user)` |
| Authorization | `Depends(require_permission)` |
| Transactions | Service / UoW |
| Validation | Pydantic |

**Why order matters:** Rate limiting before JWT verification saves CPU on floods. Request ID before logging ensures every log line correlates. CORS before auth so browsers get correct preflight headers without 401 noise.

---

## 9. Health Endpoints

### 9.1 Endpoint Set

| Endpoint | Purpose | Checks | Auth |
|----------|---------|--------|------|
| `GET /health` or `/api/v1/health` | Liveness | Process up | Public |
| `GET /health/live` | K8s liveness | No dependency checks | Public |
| `GET /health/ready` | Readiness | DB ping; optional Redis | Public |
| `GET /health/version` | Build info | git sha / app version | Public or internal-only |
| `GET /health/deps` (optional) | Deep | DB + cache + storage | Internal network / admin |

### 9.2 Response Shapes (Illustrative)

**Liveness (200):**
```json
{ "status": "ok" }
```

**Readiness (200 / 503):**
```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "cache": "ok"
  },
  "version": "0.1.0"
}
```

### 9.3 Production Usage

| Consumer | Use |
|----------|-----|
| Kubernetes / ECS | `live` → restart; `ready` → traffic |
| Load balancer | `/health/ready` |
| Deploy gates | Fail rollout if ready ≠ 200 |
| Status page | Aggregate ready + version |

Health handlers must stay **thin** and **fast** — no auth, no heavy queries. DB check: `SELECT 1` with short timeout.

---

## 10. OpenAPI Strategy

### 10.1 Global Config

| Setting | Recommendation |
|---------|----------------|
| Title | PondDesk API |
| Version | `1.0.0` (API contract version) |
| Docs | `/docs` Swagger UI (disable in prod or protect) |
| ReDoc | `/redoc` |
| OpenAPI JSON | `/openapi.json` |
| Servers | Local, staging, production URLs |

### 10.2 Tags

Align with routers: `Auth`, `Users`, `Farms`, `Ponds`, `Batches`, `Feedings`, `Inventory`, `Water Records`, `Mortality`, `Harvests`, `Reports`, `Notifications`, `Settings`, `Files`, `Dashboard`, `Health`.

### 10.3 Per-Operation Metadata

| Field | Practice |
|-------|----------|
| `summary` | Short verb phrase |
| `description` | Business intent + permission required |
| `operation_id` | Stable `ponds_create` style |
| `response_model` | Envelope wrapping entity schema |
| `responses` | Document 401, 403, 404, 409, 422 |
| `examples` | From `api/responses/examples.py` |

### 10.4 Security Schemes

```
HTTPBearer:
  type: http
  scheme: bearer
  bearerFormat: JWT
```

Mark public routes `security=[]`. Protected routes declare Bearer requirement.

### 10.5 Example Payloads

Provide examples for:

- Login success / invalid credentials  
- Create pond / duplicate name  
- Record harvest / exceeds count  
- Paginated list  
- Validation error (422)  

### 10.6 Documentation Surfaces

| Surface | Audience |
|---------|----------|
| Swagger UI | Interactive explore (dev/staging) |
| ReDoc | Readable reference |
| Phase 3 markdown | Product/contract authority |
| This Phase 11 doc | Engineer implementation guide |

---

## 11. Rate Limiting

Aligned with Phase 3 §9.3 / Phase 10.

| Scope | Limit | Notes |
|-------|------:|-------|
| Auth login/register | 5–10 / min / IP | Stricter on login |
| Password reset | 3 / hour / email | Anti-enumeration + abuse |
| Token refresh | 30 / min / IP | |
| Reports generate | 5 / hour / user | CPU-heavy |
| Search | 30 / min / user | |
| File uploads | 20 / hour / user | |
| General API | 100 / min / user | Default |

**Presentation-layer role:** middleware or dependency applies limits; routes declare heavier limits via dependency where needed (`Depends(rate_limit("reports"))`). On exceed → 429 envelope + `Retry-After`.

MVP: in-process. Production: Redis sliding window.

---

## 12. Testing Strategy

### 12.1 Route / API Tests

| Focus | Technique |
|-------|-----------|
| Status codes & envelopes | `httpx.AsyncClient` + ASGI |
| Auth required | Missing Bearer → 401 |
| RBAC | Worker vs Manager fixtures → 403/201 |
| Validation | Bad body → 422 field errors |
| Happy path | Mock service returns entity → 201 envelope |
| request_id | Present on success and error |

### 12.2 Dependency Overrides

- Override `get_*_service` with `AsyncMock` asserting call args  
- Override `get_current_user` with role-specific `CurrentUser`  
- Do **not** hit real DB in pure route unit tests; use integration suite for full stack  

### 12.3 Layers

| Test type | Mocks | Asserts |
|-----------|-------|---------|
| Route unit | Service mocked | Status, envelope, service called once |
| Auth dependency | JWT fixtures | 401/403 codes |
| Integration | Test Postgres | Real service + route |
| Contract | OpenAPI snapshot (optional) | Schema drift |

### 12.4 Response Validation

Re-parse response JSON with Phase 7 envelope models in tests to catch accidental shape drift.

---

## 13. Best Practices

1. One service call per route handler.  
2. Inject services, never repositories, from routes.  
3. Always return Phase 3 envelopes (including errors via handlers).  
4. Declare permissions on every mutating route.  
5. Use stable `operation_id` values.  
6. Keep handlers under ~20 lines.  
7. No `os.getenv` in routes.  
8. Disable or protect `/docs` in production.  
9. Prefer `APIRouter` per resource package.  
10. Share pagination query schema (`PageParams`).  
11. Water routes stay pond-scoped — never accept `batch_id` for water create.  
12. CI grep: no `select(` / `session.execute` under `app/api/`.  
13. Map ORM → Response in route or thin mapper — never leak ORM.  
14. Uploads/reports/notifications: route accepts HTTP only; service/worker does the work.

| Action | Route does | Service / worker does |
|--------|------------|------------------------|
| Upload | Accept multipart, call FileService | Store object, persist metadata |
| Report | `202` + call ReportService.queue | Celery/ARQ generates file |
| Notify | Nothing direct | Event handler after commit |

---

## 14. Architecture Decision Rationale

| # | Decision | Alternatives | Rationale |
|---|----------|--------------|-----------|
| API-001 | Package-per-resource under `api/v1/` | Single `endpoints.py` megafile | Scales with modules; clearer OpenAPI tags |
| API-002 | Dependencies in `app/dependencies/` | Nested only under `api/` | Reusable by workers/tests; matches Phase 4 |
| API-003 | Inject services only | Inject repos in routes | Preserves Clean Architecture |
| API-004 | Phase 3 envelopes everywhere | Raw Pydantic models | One client parser; `error_code` for i18n |
| API-005 | Central exception handlers | Per-route try/except | Consistent errors; thin routes |
| API-006 | Auth via Depends | Global auth middleware | Public health/login; Phase 10 SEC-005 |
| API-007 | `/api/v1` + future `/api/v2` | Header versioning only | Explicit, cache-friendly, Phase 3 §14.7 |
| API-008 | Unversioned `/health/live|ready` | Health only under `/api/v1` | K8s probes independent of API version |
| API-009 | Response helpers module | Inline dicts | DRY envelopes + OpenAPI examples |
| API-010 | Rate limit in middleware | Only per-route | Defense for all endpoints; route can tighten |
| API-011 | Files via FileService | Route → S3 | Storage swappable (ADR-012) |
| API-012 | Mock services in route tests | Always full DB | Fast feedback; service tests cover rules |
| API-013 | Water as own router | Nested under batches | Enforces pond-only water invariant at API surface |
| API-014 | No business logic in this phase doc | Code-first routes | Matches design-before-build for phases 5–10 |

### 14.1 Alignment Map

| Phase | Contribution |
|-------|--------------|
| Phase 3 | Paths, envelopes, status codes, uploads, versioning |
| Phase 4 | App layout, thin route rules, middleware order |
| Phase 7 | DTO types routes bind and return |
| Phase 9 | Service methods routes call |
| Phase 10 | Auth/permission dependencies |
| Phase 11 | This specification — presentation layer |

### 14.2 Implementation Readiness Checklist

- [ ] `create_app()` wires middleware (§8) + exception handlers (§7)  
- [ ] `api/v1/router.py` includes all resource routers with tags  
- [ ] Envelope helpers match Phase 3 schemas  
- [ ] `dependencies/services.py` providers for each Phase 9 service  
- [ ] Auth + permission Depends on protected routes  
- [ ] Health live/ready endpoints for deploy probes  
- [ ] OpenAPI security scheme + examples for auth/harvest/ponds  
- [ ] Route tests with `dependency_overrides`  
- [ ] CI guards: no SQL in `app/api/`  
- [ ] `/docs` disabled or protected in production settings  

---

**Document Status:** Ready for FastAPI route & DI implementation.  
**Next Phase:** [Phase 12 — Background Processing](./12-background-processing.md), then Phase 13 — scaffold & vertical-slice implementation.
