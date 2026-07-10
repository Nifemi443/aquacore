# Service Layer Architecture & Business Logic Design

> **Phase:** 9 — Application / Service Layer  
> **Status:** Approved — Pre-Implementation  
> **Project:** PondDesk Fish Farm Management Platform  
> **Stack:** FastAPI · PostgreSQL · SQLAlchemy 2.0 (async) · Pydantic v2 · Python 3.13+  
> **Depends on:** Phase 1 (rules/workflows) · Phase 4 (Clean Architecture) · Phase 7 (DTOs) · Phase 8 (repositories / UoW)

Designs the business logic layer that owns workflows, invariants, transactions, and domain events. No FastAPI routes, no SQL, no ORM model definitions, no repository implementations in this phase.

## Related Documents

- [Domain Model](./01-domain-model.md) — Business rules & workflows (source of truth for invariants)
- [Backend Architecture §9](./04-backend-architecture.md#9-service-architecture) — Service catalog & layer rules
- [Repository Layer](./08-repository-layer.md) — Data access & Unit of Work
- [Pydantic Schemas](./07-pydantic-schemas.md) — Input/output DTOs
- [API Contract](./03-api-contract.md) — Error codes & endpoint semantics
- [Security](../security/README.md) — RBAC (enforced at edge + re-checked for sensitive ops)

---

## Table of Contents

- [1. Service Architecture Overview](#1-service-architecture-overview)
- [2. Folder Structure](#2-folder-structure)
- [3. Base Service Design](#3-base-service-design)
- [4. Service Responsibilities](#4-service-responsibilities)
- [5. Business Rules](#5-business-rules)
- [6. Workflow Specifications](#6-workflow-specifications)
- [7. Transaction Strategy](#7-transaction-strategy)
- [8. Domain Events](#8-domain-events)
- [9. Notification Strategy](#9-notification-strategy)
- [10. Error Handling](#10-error-handling)
- [11. Dependency Injection](#11-dependency-injection)
- [12. Logging Strategy](#12-logging-strategy)
- [13. Background Task Strategy](#13-background-task-strategy)
- [14. Testing Strategy](#14-testing-strategy)
- [15. Service Best Practices](#15-service-best-practices)
- [16. Architecture Decision Rationale](#16-architecture-decision-rationale)

---

## 1. Service Architecture Overview

### 1.1 Role in the Stack

```
Routes (HTTP only)
    ↓  Pydantic DTOs + CurrentUser
Services (THIS LAYER)
    ↓  UnitOfWork / Repository Protocols
Repositories
    ↓
PostgreSQL

Services also → Domain rules (pure) → Event bus → Handlers / Tasks
```

### 1.2 Design Goals

| Goal | Approach |
|------|----------|
| **Own business logic** | All invariants and workflows live here or in `app/domain/rules` |
| **Coordinate repositories** | Via Unit of Work for multi-aggregate use cases |
| **Own transactions** | `commit` / `rollback` after successful workflow |
| **Domain events** | Publish after successful commit |
| **FastAPI-independent** | No `Request`, `Response`, status codes, or Depends inside services |
| **Fully testable** | Fake UoW / repos; pure rule unit tests |
| **SOLID** | One primary aggregate per service; no god `FarmOpsService` |

### 1.3 What Services Must Never Do

| Forbidden | Why |
|-----------|-----|
| Write SQL / use `AsyncSession` directly | Breaks repository boundary (Phase 8) |
| Return HTTP responses / status codes | Delivery concern of routes |
| Import FastAPI | Couples domain to framework |
| Render JSON / know about envelopes | Phase 7 + routes |
| Contain UI logic | Wrong layer |
| Define ORM models | Phase 5 |
| Hash passwords inline without `security/` helpers | Crypto belongs in security module (services *call* it) |
| Check JWT signatures | Auth dependency does that; services receive `CurrentUser` |
| `commit` inside random helpers mid-workflow without clear boundary | Unclear TX |

Services **may** call password hashing and token utilities from `app/security/` — those are infrastructure adapters, not HTTP.

### 1.4 Domain Rules vs Services

| Location | Contains |
|----------|----------|
| `app/domain/rules/` | Pure functions: `can_harvest(batch, qty) -> None` raises domain error |
| `app/services/` | Load state via repos, call rules, persist, commit, events |
| Pydantic schemas | Format/shape only (Phase 7) |

---

## 2. Folder Structure

```
app/services/
├── __init__.py
├── base.py                      # BaseService helpers (logging context, not TX magic)
├── exceptions.py                # Re-export / thin aliases to app.exceptions + domain
├── auth/
│   └── auth_service.py
├── users/
│   └── user_service.py
├── farms/
│   └── farm_service.py
├── ponds/
│   └── pond_service.py
├── batches/
│   └── batch_service.py
├── feeding/
│   └── feeding_service.py
├── inventory/
│   └── inventory_service.py
├── water/
│   └── water_service.py
├── mortality/
│   └── mortality_service.py
├── harvest/
│   └── harvest_service.py
├── reports/
│   └── report_service.py
├── notifications/
│   └── notification_service.py
├── settings/
│   ├── farm_settings_service.py
│   └── user_preferences_service.py
├── vendors/                     # Optional split or under inventory/catalog
│   └── vendor_service.py
└── ai/                          # Future — stubs / interfaces only in MVP
    └── ai_insight_service.py
```

Also (from Phase 4, not duplicated here):

```
app/domain/
├── rules/          # Pure business predicates
├── events/         # Event dataclasses
└── exceptions/     # Domain errors
```

### 2.1 Folder Responsibilities

| Folder | Responsibility |
|--------|----------------|
| `base.py` | Shared logging context helpers, common assert_farm_access utilities |
| `auth/` | Login, register, refresh, password flows |
| `users/` | User admin/profile (non-auth) |
| `farms/` | Tenant lifecycle |
| `ponds/` | Pond CRUD + status transitions |
| `batches/` | Stocking, transfer, close, quantity coordination |
| `feeding/` | Daily feeding + inventory deduction orchestration |
| `inventory/` | Purchases, adjustments, low-stock detection |
| `water/` | Pond water tests + threshold evaluation triggers |
| `mortality/` | Loss recording + batch quantity update |
| `harvest/` | Harvest + batch close/partial + revenue fields |
| `reports/` | Queue report jobs (async generation elsewhere) |
| `notifications/` | Persist + dispatch preferences |
| `settings/` | Farm policies + user preferences |
| `ai/` | Future insight generation — no MVP business coupling |

---

## 3. Base Service Design

### 3.1 Recommended `BaseService`

Lightweight — **not** a second ORM session manager.

| Responsibility | Include? | Notes |
|----------------|----------|-------|
| Hold `uow: UnitOfWork` | Yes | Constructor injection |
| Hold `events: EventBus` | Yes | Optional |
| `assert_farm_scope(entity.farm_id, user.farm_id)` | Yes | Shared guard |
| `require_active_batch(batch)` | Prefer domain rule call | Thin wrapper OK |
| Transaction `commit`/`rollback` | Prefer explicit in each public method or `@transactional` decorator | Avoid hidden magic |
| Structured logger with `request_id` | Yes | From contextvars |
| HTTP / FastAPI | **No** | |
| Generic CRUD for all models | **No** | Anti-pattern |

### 3.2 Transaction Helper Pattern

Prefer explicit:

```
async def record_harvest(...):
    try:
        ...
        await self._uow.commit()
        await self._events.publish(HarvestCompleted(...))
    except Exception:
        await self._uow.rollback()
        raise
```

Optional decorator `@atomic` that commits on success / rollbacks on error — must not nest blindly.

### 3.3 Validation Split Reminder

| Step | Layer |
|------|-------|
| DTO already validated | Pydantic (route) |
| Load entities | Repository |
| Invariants | Domain rules + service |
| Persist | Repository |
| Commit | Service |

---

## 4. Service Responsibilities

For each service: purpose, dependencies, public methods, I/O.

### 4.1 AuthService

**Purpose:** Credential verification, token issuance/rotation, password reset.  
**Dependencies:** `UserRepository`, `RefreshTokenRepository`, `FarmRepository`, `FarmMembershipRepository`, `RoleRepository`, password hasher, JWT issuer, UoW.  
**Does not:** Know about cookies (routes set cookies if used).

| Method | Input | Output |
|--------|-------|--------|
| `register` | `RegisterRequest` | `(User, Farm?, tokens)` |
| `login` | `LoginRequest` | `Token pair + user context` |
| `refresh` | refresh token | New token pair |
| `logout` | refresh token / user | None (revoke) |
| `forgot_password` | email | None (always opaque success) |
| `reset_password` | token + new password | None |
| `change_password` | user + passwords | None |

### 4.2 UserService

**Purpose:** Profile and admin user management within farm memberships.  
**Dependencies:** `UserRepository`, `FarmMembershipRepository`, UoW.

| Method | Notes |
|--------|-------|
| `get_current_profile` | From `CurrentUser` |
| `update_profile` | Name/phone |
| `list_farm_members` | Manager+ |
| `invite_or_create_member` | Admin |
| `deactivate_member` | Soft revoke membership |

### 4.3 FarmService

**Purpose:** Farm tenant create/update; activate/deactivate.  
**Dependencies:** `FarmRepository`, `FarmSettingsRepository`, UoW.

| Method | Notes |
|--------|-------|
| `create_farm` | Creates settings row atomically |
| `get_farm` / `update_farm` | Scoped |
| `soft_delete_farm` | Admin; careful with dependents |

### 4.4 PondService

**Purpose:** Pond master lifecycle.  
**Dependencies:** `PondRepository`, UoW, events.

| Method | Input | Output |
|--------|-------|--------|
| `create_pond` | `PondCreate`, user | `Pond` |
| `update_pond` / `patch_pond` | Patch DTO | `Pond` |
| `get_pond` / `list_ponds` | filters | entity / page |
| `soft_delete_pond` | id | — |
| `change_status` | status enum | Validates empty/active rules |

**Rules:** Unique name per farm; cannot delete pond with active batch (service checks via `BatchRepository`).

### 4.5 BatchService (Fish Batch)

**Purpose:** Stocking, transfers, closure, quantity coordination API for other services.  
**Dependencies:** `BatchRepository`, `PondRepository`, `SpeciesRepository`, `VendorRepository`, UoW, events.

| Method | Notes |
|--------|-------|
| `create_batch` | Validate pond/species/farm; one-active-batch policy |
| `get_batch` / `list_batches` | |
| `transfer_batch` | Capacity + pond status; write `BatchTransfer` |
| `add_weight_sample` | Update `current_avg_weight_kg` |
| `close_batch` / `write_off` | Manager+; status machine |
| `adjust_quantity` | Internal helper used by mortality/harvest — or keep private |

### 4.6 FeedingService

**Purpose:** Record feedings; deduct inventory; compliance signals.  
**Dependencies:** `FeedingRepository`, `BatchRepository`, `InventoryRepository`, `FarmSettingsRepository`, UoW, events.

| Method | Notes |
|--------|-------|
| `record_feeding` | Active batch; inventory ≥ qty; deduct + ledger TX |
| `update_feeding` | Within edit window from settings |
| `void_feeding` | Soft-delete + reverse inventory (compensating TX) |
| `list_feedings` / `get_daily_schedule` | |

### 4.7 InventoryService

**Purpose:** Stock balances, purchases, adjustments, low-stock detection.  
**Dependencies:** `InventoryRepository`, `VendorRepository`, `FeedTypeRepository`, UoW, events.

| Method | Notes |
|--------|-------|
| `restock_feed` / `record_purchase` | Increase balance + ledger PURCHASE |
| `adjust_stock` | Spoilage/correction; never negative |
| `list_inventory` / `get_item` | |
| `check_low_stock` | May emit `InventoryLowStock` |

### 4.8 WaterService

**Purpose:** Pond water tests; evaluate thresholds; alert.  
**Dependencies:** `WaterRepository`, `PondRepository`, `FarmSettingsRepository`, `SpeciesRepository` (optional ranges), UoW, events.

| Method | Notes |
|--------|-------|
| `record_water_test` | **Pond only**; set status HEALTHY/WARNING/CRITICAL |
| `update_water_test` | Policy window |
| `list` / `get_latest_for_pond` | |
| `void_water_test` | Soft-delete |

### 4.9 MortalityService

**Purpose:** Record deaths; reduce batch population; spike alerts.  
**Dependencies:** `MortalityRepository`, `BatchRepository`, `FarmSettingsRepository`, UoW, events.

| Method | Notes |
|--------|-------|
| `record_mortality` | qty ≤ current; update batch qty atomically |
| `void_mortality` | Restore qty if policy allows |
| `list` | |

### 4.10 HarvestService

**Purpose:** Partial/full harvest; revenue fields; batch status transitions.  
**Dependencies:** `HarvestRepository`, `BatchRepository`, `PondRepository`, `CustomerRepository`, UoW, events.

| Method | Notes |
|--------|-------|
| `record_harvest` | qty ≤ current; date ≥ stocking; update qty; FULL → close batch/free pond |
| `update_harvest` | Pre-finalization only |
| `void_harvest` | Compensating qty |
| `list` / `get` | |

### 4.11 ReportService

**Purpose:** Accept report requests; persist job; enqueue generation.  
**Dependencies:** `ReportRepository`, task queue / background, UoW, events.

| Method | Notes |
|--------|-------|
| `request_report` | Validate filters; status PENDING; publish `ReportRequested` |
| `get_report` / `list` | |
| `mark_ready` / `mark_failed` | Called by worker (internal) |

### 4.12 NotificationService

**Purpose:** Create in-app notifications; fan-out to email async.  
**Dependencies:** `NotificationRepository`, preferences, email port, UoW.

| Method | Notes |
|--------|-------|
| `notify_user` / `notify_farm` | Persist rows |
| `mark_read` / `list_inbox` | |
| `dispatch_pending_emails` | Worker |

### 4.13 Settings Services

**FarmSettingsService:** Update thresholds, edit windows, alert JSON.  
**UserPreferencesService:** Theme, locale, notification toggles.

### 4.14 Future AiInsightService

**Purpose:** Request AI analysis jobs; store recommendations (future table).  
**MVP:** Interface stub only; no coupling from core harvest/feeding paths.

---

## 5. Business Rules

### 5.1 Rule Catalog (Enforcement Map)

| Rule | Enforce in | Error code (Phase 3) |
|------|------------|----------------------|
| Harvest qty ≤ `current_quantity` | Domain + `HarvestService` | `HARVEST_EXCEEDS_COUNT` |
| Mortality qty ≤ population | Domain + `MortalityService` | Conflict / validation |
| Cannot feed inactive/closed/archived batches | `FeedingService` | `BATCH_NOT_ACTIVE` |
| Cannot stock/add fish to inactive/drained ponds | `BatchService` | Business rule |
| Feed inventory cannot go negative | `InventoryService` / feeding deduct | `INSUFFICIENT_INVENTORY` |
| Harvest date ≥ stocking date | Domain + service | Validation / business |
| Feeding date ≥ stocking date | Domain + service | Validation |
| Only managers+ close/write-off batch | Route permission **and** service assert role | `FORBIDDEN` |
| Workers cannot delete masters | Permission dependency; service double-check on delete | `FORBIDDEN` |
| Duplicate pond names (per farm) | `exists_by_name` + DB unique | `POND_NAME_EXISTS` |
| One active batch per pond | Service check + DB partial unique | Conflict |
| Water records pond-scoped only | No batch_id in DTO/service | — |
| Edit feeding within N hours | `FarmSettings.feeding_edit_window_hours` | `EDIT_WINDOW_EXPIRED` |
| Pond capacity on stocking | `BatchService` | `POND_CAPACITY_EXCEEDED` |
| Soft-deleted resources act as missing | Service treats as not found | `NOT_FOUND` |

### 5.2 How Rules Are Enforced

```
1. Pydantic: qty > 0, date formats
2. Service loads batch/pond/inventory FOR UPDATE when needed (repo method with lock)
3. Domain rule function raises DomainError
4. Service maps to AppException with error_code
5. DB constraints catch races (unique, check, partial unique)
6. IntegrityError → ConflictError
```

**Optimistic vs pessimistic:** For harvest/mortality/inventory, use row locks (`SELECT … FOR UPDATE` via repository `get_for_update`) inside the same transaction.

### 5.3 Authorization vs Business Rules

| Concern | Where |
|---------|-------|
| Has permission `harvest:create` | FastAPI `Depends` |
| Resource in user's farm | Service `assert_farm_scope` |
| Manager-only close batch | Permission + service role check |
| Worker cannot delete pond | Permission matrix |

Services still verify farm scope even if route checked permission — defense in depth.

---

## 6. Workflow Specifications

### 6.1 Create Fish Batch

```
CreateBatch(dto, user)
  → assert permission context (caller)
  → load Farm membership / farm_id
  → load Pond (farm_id) — must exist, allow stocking status
  → load Species
  → optional Vendor
  → domain: initial_quantity > 0; dates coherent
  → repo: exists_by_code? → conflict
  → repo: get_active_by_pond? → conflict if policy max=1
  → capacity check vs pond.max_fish_count
  → build FishBatch (status PLANNED or ACTIVE)
  → batches.add
  → optional: set pond status ACTIVE
  → uow.commit()
  → publish FishBatchCreated
  → audit log
  → return batch
```

### 6.2 Record Feeding

```
RecordFeeding(dto, user)
  → load Batch (farm) — status ACTIVE or HARVEST_READY
  → load FeedInventory for feed_type
  → if COMPLETED: assert inventory.qty >= quantity_kg
  → domain date ≥ stocking_date
  → feedings.add(record)
  → if COMPLETED: inventory.adjust(-qty); inventory.add_transaction(FEEDING)
  → uow.commit()
  → publish FeedingRecorded
  → if missed pattern / compliance: notify managers (async)
  → return feeding
```

### 6.3 Record Water Test

```
RecordWaterTest(dto, user)
  → load Pond (farm) — no batch_id accepted
  → evaluate params vs farm_settings.alert_thresholds (+ species if single active batch context optional)
  → set WaterStatus HEALTHY|WARNING|CRITICAL
  → water.add
  → uow.commit()
  → publish WaterTestRecorded
  → if WARNING/CRITICAL: NotificationService / event → alert
  → return water_record
```

### 6.4 Record Mortality

```
RecordMortality(dto, user)
  → load Batch FOR UPDATE
  → assert active production status
  → domain: 0 < qty ≤ current_quantity
  → mortality.add
  → batch.current_quantity -= qty
  → uow.commit()
  → publish MortalityRecorded
  → if spike vs settings threshold: notify
  → return mortality
```

### 6.5 Record Harvest

```
RecordHarvest(dto, user)
  → load Batch FOR UPDATE + Pond
  → domain: qty ≤ current; harvest_date ≥ stocking_date
  → optional customer
  → harvests.add
  → batch.current_quantity -= qty
  → if FULL or qty exhausts: status HARVESTED/CLOSED; actual_harvest_date; pond → EMPTY if no other active
  → uow.commit()
  → publish HarvestCompleted
  → notify managers (harvest recorded / pond freed)
  → return harvest
```

### 6.6 Restock Feed

```
RestockFeed(purchase_dto, user)
  → load/create FeedInventory line
  → purchases.add
  → inventory.quantity_on_hand += qty
  → ledger TX PURCHASE
  → uow.commit()
  → publish InventoryRestocked
  → clear low-stock notifications if above reorder
  → return purchase + balance
```

### 6.7 Generate Reports

```
RequestReport(dto, user)
  → validate type/date range/scope entities exist
  → reports.add(PENDING)
  → uow.commit()
  → publish ReportRequested → Celery/BackgroundTasks
  → return report (202 at route)
Worker:
  → generate file → storage
  → report_service.mark_ready
  → notify user
```

---

## 7. Transaction Strategy

### 7.1 Boundaries

| Use case | Single TX includes |
|----------|-------------------|
| Create batch | Batch insert (+ pond status) |
| Feeding completed | Feeding + inventory + ledger |
| Mortality | Mortality + batch qty |
| Harvest | Harvest + batch qty (+ pond status) |
| Purchase | Purchase + inventory + ledger |
| Register | User + farm + settings + membership |

### 7.2 Lifecycle

```
begin (implicit with session)
  repository writes
  flush if need IDs
commit  → success
rollback → on any exception before commit
```

### 7.3 Nested Operations

- Prefer **one service method = one transaction**
- If `FeedingService` needs inventory updates, call **inventory repository via UoW**, not `InventoryService.record_purchase` (avoids nested commits)
- Cross-service calls: only for **read-only** queries or **event-driven** follow-ups after commit

### 7.4 Atomicity Rule

All multi-aggregate invariants (harvest + qty) must succeed or fail together — never commit harvest then fail qty update.

---

## 8. Domain Events

### 8.1 Event Catalog

| Event | Publisher | Typical handlers |
|-------|-----------|------------------|
| `FishBatchCreated` | BatchService | Audit, cache invalidate |
| `FeedingRecorded` | FeedingService | Compliance metrics, audit |
| `FeedingMissed` | FeedingService / scheduler | Notify managers |
| `InventoryRestocked` | InventoryService | Clear low-stock state |
| `InventoryLowStock` | InventoryService | Notify managers |
| `HarvestCompleted` | HarvestService | Notify, dashboard invalidate |
| `MortalityRecorded` | MortalityService | Spike detection notify |
| `WaterTestRecorded` | WaterService | Alert if not HEALTHY |
| `WaterQualityAlert` | WaterService | Notify |
| `NotificationCreated` | NotificationService | Email dispatch task |
| `ReportRequested` | ReportService | Generate report task |
| `UserLoggedIn` | AuthService | Audit |

### 8.2 Publishing Rules

1. Publish **after** successful `commit`  
2. Handlers must be **idempotent**  
3. Handler failures must **not** roll back completed business TX — retry via queue  
4. Include `farm_id`, `actor_id`, `correlation_id` (request_id), payload ids  

### 8.3 In-Process Bus (MVP)

Phase 4 ADR-008: in-process bus first; later Redis/Kafka. Services depend on `EventBus` protocol.

---

## 9. Notification Strategy

### 9.1 When to Notify

| Trigger | Severity | Audience |
|---------|----------|----------|
| Low feed inventory | WARNING | Managers |
| Upcoming harvest (scheduler) | INFO | Managers |
| Missed feeding | WARNING | Managers + assigned worker |
| Water WARNING | WARNING | Managers |
| Water CRITICAL | CRITICAL | Managers (+ optional SMS future) |
| Batch ready / HARVEST_READY | INFO | Managers |
| Mortality spike | WARNING/CRITICAL | Managers |
| Report ready | INFO | Requesting user |
| Harvest completed | INFO | Managers |

### 9.2 Flow

```
Domain event
  → handler checks user_preferences / farm notification_defaults
  → NotificationService.notify_* (persist)
  → enqueue email if enabled
```

Do **not** send email inside HarvestService directly.

---

## 10. Error Handling

### 10.1 Service-Level Exception Types

Map to Phase 3 / Phase 4 `AppException` hierarchy:

| Service exception | HTTP | When |
|-------------------|------|------|
| `ResourceNotFoundError` | 404 | Repo returned None / soft-deleted |
| `BusinessValidationError` | 422 | Domain rule failed (batch not active) |
| `ResourceConflictError` | 409 | Duplicate name, capacity, harvest exceeds |
| `InventoryError` | 409 | Insufficient stock / negative blocked |
| `HarvestError` | 409/422 | Harvest-specific conflicts |
| `WaterQualityError` | 422 | Optional — invalid combo; prefer generic business |
| `AuthorizationError` | 403 | Role check failed inside service |
| `EditWindowExpiredError` | 403 | Past edit window |

### 10.2 What Belongs in the Service Layer

- Raising the exceptions above after domain checks  
- Mapping repository integrity errors to conflict codes  
- **Not** catching and converting to JSON  

Routes never catch; exception handlers format Phase 3 envelopes.

---

## 11. Dependency Injection

### 11.1 Constructor Dependencies

```
HarvestService(
  uow: UnitOfWork,
  events: EventBus,
  # optional: clock, settings reader
)
```

Access repos via `self._uow.harvests`, `self._uow.batches`, …

### 11.2 What Gets Injected

| Dependency | Source |
|------------|--------|
| UnitOfWork / repositories | `Depends(get_unit_of_work)` |
| EventBus | Singleton |
| Settings (app config) | `get_settings()` |
| Current user | Passed as method arg from route (not stored on service) |
| Security tools | Hasher, token service |
| Other services | **Avoid** for write paths; prefer events |

### 11.3 Service-to-Service Calls

| Allowed | Discouraged |
|---------|-------------|
| Read-only query service | Service A commits then calls Service B write (nested TX) |
| After-commit event → NotificationService | FeedingService → InventoryService.restock (use repos) |
| Report worker → ReportService.mark_ready | Circular service imports |

**Best practice:** Services call **repositories through UoW** for all writes in one use case. Use **events** for cross-cutting reactions.

---

## 12. Logging Strategy

### 12.1 What to Log

| Category | Level | Examples |
|----------|-------|----------|
| Business success | INFO | `harvest_recorded`, batch_id, qty, farm_id, user_id |
| Business rejection | INFO/WARN | Rule failed with code |
| Unexpected | ERROR | Exception with stack |
| Auth failures | WARN | Login failed (no password) |
| Audit | INFO + DB | Mutations via AuditLogRepository |

### 12.2 Fields Always Present

`request_id`, `user_id`, `farm_id`, `action`, `resource_type`, `resource_id` when applicable.

### 12.3 Never Log

Passwords, tokens, full payment card data (N/A), raw PII beyond ids where avoidable.

---

## 13. Background Task Strategy

| Operation | Sync in request? | Async? |
|-----------|------------------|--------|
| CRUD + harvest/feeding/mortality | **Yes** | — |
| Email notifications | No | **Yes** |
| Report PDF/Excel generation | No | **Yes** |
| Daily missed-feeding reminders | — | **Yes** (scheduler) |
| Harvest due reminders | — | **Yes** |
| AI analysis | — | **Yes** (future) |
| Dashboard cache warm | — | Optional |

Service enqueues work **after commit** via event → task.

---

## 14. Testing Strategy

### 14.1 Unit Tests (Primary for Services)

- Fake `UnitOfWork` + in-memory repos  
- Assert: rule violations raise correct errors  
- Assert: on success, entities added and `commit` called  
- Assert: events published only after commit (mock order)  
- Failure: inventory insufficient leaves no feeding  

### 14.2 Domain Rule Tests

- Pure functions without fakes: harvest qty, date order, status transitions  

### 14.3 Workflow / Integration Tests

- Real Postgres + real repos + service  
- Concurrent harvest race → one conflict  

### 14.4 Scenarios Checklist

| Scenario | Expected |
|----------|----------|
| Harvest > population | Conflict, no qty change |
| Feed closed batch | BusinessValidationError |
| Duplicate pond name | Conflict |
| Worker deletes pond | Forbidden |
| Water with batch_id | Impossible at DTO; service ignores |
| Feeding void restores inventory | Compensating ledger |

---

## 15. Service Best Practices

1. One public method ≈ one use case ≈ one transaction  
2. Accept Pydantic DTOs + `CurrentUser`; return ORM entities or read DTOs — routes wrap envelopes  
3. Keep methods readable as workflows (steps in §6)  
4. Put pure rules in `domain/rules`  
5. Lock rows when updating quantities  
6. Publish events after commit only  
7. No FastAPI imports in `app/services` (CI grep)  
8. Prefer UoW over five separate repo ctor args  
9. Idempotent where retries happen (report request keys)  
10. Document permission assumptions in docstrings  

### 15.1 Method Signature Convention

```
async def record_harvest(
    self,
    data: HarvestCreate,
    user: CurrentUser,
) -> HarvestRecord:
```

---

## 16. Architecture Decision Rationale

| # | Decision | Alternatives | Rationale |
|---|----------|--------------|-----------|
| SVC-001 | Services own transactions | Repo commits | ADR-004; multi-aggregate safety |
| SVC-002 | Domain rules as pure functions | Rules only in services | Testability; reuse |
| SVC-003 | UoW write coordination | Service-to-service writes | Avoid nested commits |
| SVC-004 | Events after commit | Before commit | No phantom notifications |
| SVC-005 | Notifications via events | Direct email in harvest | Separation of concerns |
| SVC-006 | CurrentUser as arg | Service-scoped user state | Safer concurrency; clearer tests |
| SVC-007 | Row locks on qty updates | Last-write-wins | Prevents negative population |
| SVC-008 | Permission at route + farm scope in service | Route-only authz | Defense in depth |
| SVC-009 | AI service isolated | Mix AI into feeding | Failures must not block ops |
| SVC-010 | No SQL in services | “Just a quick query” | Phase 8 boundary |
| SVC-011 | Compensating TX on void | Hard delete facts | Auditability |
| SVC-012 | Explicit workflow docs | Tribal knowledge | Onboarding + review checklist |

### 16.1 Alignment Map

| Phase | Contribution |
|-------|--------------|
| Phase 1 | Rules & workflows |
| Phase 3 | Error codes clients see |
| Phase 4 | Layering & event bus phasing |
| Phase 7 | DTO inputs |
| Phase 8 | Repos + UoW |
| Phase 9 | This specification |

### 16.2 Implementation Readiness Checklist

- [ ] Create `app/domain/rules` for harvest, mortality, feeding, inventory  
- [ ] Create service packages per §2  
- [ ] Implement `HarvestService`, `FeedingService`, `BatchService` first  
- [ ] Wire `get_*_service` Depends with UoW + EventBus  
- [ ] Unit tests with fakes for all §6 workflows  
- [ ] CI grep: no `fastapi` import under `app/services`  
- [ ] CI grep: no `session.commit` under `app/repositories`  

---

**Document Status:** Ready for service implementation.  
**Next Phase:** Phase 10 — API routes / dependency wiring (thin controllers over these services) + end-to-end auth.
