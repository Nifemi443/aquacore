# Repository Layer Architecture & Data Access Design

> **Phase:** 8 — Repository / Data Access Layer  
> **Status:** Approved — Pre-Implementation  
> **Project:** PondDesk Fish Farm Management Platform  
> **Stack:** FastAPI · PostgreSQL 15+ · SQLAlchemy 2.0 (async) · Alembic · Pydantic v2 · Python 3.13+  
> **Depends on:** Phase 2 (schema) · Phase 4 (Clean Architecture) · Phase 5 (ORM) · Phase 7 (DTOs map *after* repos)

Designs the data access layer that abstracts all database I/O from business logic. No API routes, no service implementations, no business rules in this phase.

## Related Documents

- [Backend Architecture §8](./04-backend-architecture.md#8-repository-architecture) — Repository rules & Unit of Work
- [ORM Model Design](./05-orm-models.md) — Entities repositories persist
- [Pydantic Schemas](./07-pydantic-schemas.md) — DTOs built *above* repositories
- [Database Architecture](./02-database-architecture.md) — Indexes, soft delete, constraints
- [Migration Strategy](./06-migration-strategy.md) — Schema evolution
- [Testing Guide](../testing/README.md) — Test pyramid

---

## Table of Contents

- [1. Repository Architecture Overview](#1-repository-architecture-overview)
- [2. Folder Structure](#2-folder-structure)
- [3. Base Repository Design](#3-base-repository-design)
- [4. Repository Responsibilities](#4-repository-responsibilities)
- [5. Repository Method Catalog](#5-repository-method-catalog)
- [6. Query Design Strategy](#6-query-design-strategy)
- [7. Async Session Lifecycle](#7-async-session-lifecycle)
- [8. Transaction Strategy](#8-transaction-strategy)
- [9. Error Handling Strategy](#9-error-handling-strategy)
- [10. Soft Delete Strategy](#10-soft-delete-strategy)
- [11. Bulk Operations Strategy](#11-bulk-operations-strategy)
- [12. Performance Optimization](#12-performance-optimization)
- [13. Dependency Injection Strategy](#13-dependency-injection-strategy)
- [14. Testing Strategy](#14-testing-strategy)
- [15. Repository Best Practices](#15-repository-best-practices)
- [16. Architecture Decision Rationale](#16-architecture-decision-rationale)

---

## 1. Repository Architecture Overview

### 1.1 Purpose

The Repository Layer is the **only** module allowed to issue SQLAlchemy queries against PostgreSQL for application use cases. Services orchestrate; repositories read and write aggregates.

```
Routes → Services → Repositories → AsyncSession → PostgreSQL
                      ↑
                 Protocols / interfaces
```

### 1.2 Design Goals

| Goal | Approach |
|------|----------|
| **Encapsulation** | No `select()` / `session.execute` outside repositories (and rare admin scripts) |
| **Async-first** | `AsyncSession` throughout |
| **DI-friendly** | Constructed per request with injected session |
| **Testable** | Protocol interfaces + fakes/mocks |
| **SOLID** | One repository per aggregate; ISP via focused interfaces |
| **Clean Architecture** | Interfaces inward; SQLAlchemy impl in infrastructure |
| **Multi-tenant safety** | Operational queries always scoped by `farm_id` |
| **No business logic** | No harvest eligibility, no emails, no authz |

### 1.3 Aggregate → Repository Map

| Aggregate / concern | Repository | Primary model(s) |
|---------------------|------------|------------------|
| Identity | `UserRepository` | `User`, related tokens via dedicated repo |
| Auth sessions | `RefreshTokenRepository` | `RefreshToken` |
| Membership / RBAC data | `FarmMembershipRepository` | `FarmMembership`, reads `Role` |
| Roles (catalog) | `RoleRepository` | `Role` |
| Tenant | `FarmRepository` | `Farm` |
| Farm settings | `FarmSettingsRepository` | `FarmSettings` |
| User preferences | `UserPreferencesRepository` | `UserPreferences` |
| Ponds | `PondRepository` | `Pond` |
| Species | `SpeciesRepository` | `Species` |
| Fish batches | `BatchRepository` | `FishBatch`, `BatchTransfer`, `WeightSample` |
| Feeding | `FeedingRepository` | `FeedingRecord` |
| Feed inventory | `InventoryRepository` | `FeedInventory`, `FeedPurchase`, `InventoryTransaction` |
| Feed catalog | `FeedTypeRepository` | `FeedType`, `FeedCategory` |
| Water | `WaterRepository` | `WaterRecord` (**pond-scoped**) |
| Mortality | `MortalityRepository` | `MortalityRecord` |
| Harvest | `HarvestRepository` | `HarvestRecord` |
| Vendors / customers | `VendorRepository`, `CustomerRepository` | Catalog |
| Reports | `ReportRepository` | `Report` |
| Notifications | `NotificationRepository` | `Notification` |
| Audit | `AuditLogRepository` | `AuditLog` (append-only) |

### 1.4 Interface vs Implementation

Per Phase 4:

```
app/repositories/
├── interfaces/          # Protocols (typing.Protocol)
└── sqlalchemy/          # SqlAlchemy*Repository implementations
```

Services depend on **interfaces**, not concrete classes — enables fakes in unit tests and future read-replica adapters.

### 1.5 What Repositories Must Never Do

| Forbidden | Why | Belongs in |
|-----------|-----|------------|
| Business rules (harvest ≤ count) | Couples persistence to domain | Services / domain |
| `session.commit()` / `rollback()` | Transaction ownership | Services / UoW |
| Send emails / notifications | Side effects | Event handlers / notification service |
| Call external APIs | I/O policy | Infrastructure clients via services |
| Generate PDF/Excel reports | Heavy CPU / files | Report engine / tasks |
| Authentication (JWT decode) | Security boundary | `security/` + dependencies |
| Authorization (permission checks) | Policy | `require_permission` + services |
| Build HTTP responses / status codes | Delivery concern | Routes |
| Import Pydantic request schemas as persistence API | Coupling | Map in services |
| Hard-delete ledger / audit rows | Compliance | Never (app policy) |

---

## 2. Folder Structure

```
app/repositories/
├── __init__.py
├── base.py                          # Generic helpers / typing aliases (optional)
├── unit_of_work.py                  # UnitOfWork protocol + SQLAlchemy UoW
├── exceptions.py                    # RepositoryError, translate IntegrityError
├── interfaces/
│   ├── __init__.py
│   ├── base.py                      # BaseRepository Protocol[T]
│   ├── user_repository.py
│   ├── farm_repository.py
│   ├── farm_settings_repository.py
│   ├── pond_repository.py
│   ├── species_repository.py
│   ├── batch_repository.py
│   ├── feeding_repository.py
│   ├── inventory_repository.py
│   ├── water_repository.py
│   ├── mortality_repository.py
│   ├── harvest_repository.py
│   ├── report_repository.py
│   ├── notification_repository.py
│   ├── vendor_repository.py
│   ├── customer_repository.py
│   ├── role_repository.py
│   ├── membership_repository.py
│   └── refresh_token_repository.py
└── sqlalchemy/
    ├── __init__.py
    ├── base.py                      # SqlAlchemyRepository[T] concrete base
    ├── user_repository.py
    ├── farm_repository.py
    ├── farm_settings_repository.py
    ├── pond_repository.py
    ├── species_repository.py
    ├── batch_repository.py
    ├── feeding_repository.py
    ├── inventory_repository.py
    ├── water_repository.py
    ├── mortality_repository.py
    ├── harvest_repository.py
    ├── report_repository.py
    ├── notification_repository.py
    └── ...
```

### 2.1 File Responsibilities

| Path | Responsibility |
|------|----------------|
| `interfaces/*.py` | Public contracts for services |
| `sqlalchemy/*.py` | SQLAlchemy 2.0 `select()` implementations |
| `sqlalchemy/base.py` | Shared CRUD/soft-delete/paginate helpers |
| `unit_of_work.py` | Groups repos + `commit`/`rollback` |
| `exceptions.py` | Translate DB errors → typed app errors (or re-raise for service mapping) |

---

## 3. Base Repository Design

### 3.1 Generic Protocol

```
BaseRepository[T]  (Protocol)
  session: AsyncSession   # injected; not created here

  # Identity
  async def get_by_id(self, id: UUID, *, farm_id: UUID | None = None, include_deleted: bool = False) -> T | None
  async def exists(self, id: UUID, *, farm_id: UUID | None = None) -> bool
  async def count(self, *, farm_id: UUID | None = None, filters: ...) -> int

  # Persistence
  async def add(self, entity: T) -> T
  async def add_all(self, entities: Sequence[T]) -> Sequence[T]
  async def delete(self, entity: T) -> None          # hard delete — restricted
  async def soft_delete(self, entity: T, *, when: datetime | None = None) -> T
  async def restore(self, entity: T) -> T

  # Pagination helper (optional on base)
  async def paginate(self, stmt, *, page: int, limit: int) -> tuple[list[T], int]
```

### 3.2 Methods That Belong in Base

| Method | In base? | Notes |
|--------|----------|-------|
| `get_by_id` | Yes | Farm-scoped override in farm-scoped repos |
| `exists` | Yes | |
| `count` | Yes | With filter hook |
| `add` / `add_all` | Yes | `session.add`; no commit |
| `soft_delete` / `restore` | Yes | Only if model has `deleted_at` |
| `paginate` | Yes | Shared offset pagination |
| `bulk_insert` | Yes (careful) | `insert().values()` or `add_all` |
| Domain list/search | **No** | Specialized per aggregate |
| Aggregations (survival, KPIs) | **No** | Specialized or reporting repo |
| `commit` | **Never** | |

### 3.3 Farm-Scoped Base

Most operational repos inherit / compose:

```
FarmScopedRepository[T](BaseRepository[T])
  - Every read/write requires farm_id
  - get_by_id(id, farm_id) ignores rows outside tenant
  - default list filters deleted_at IS NULL
```

### 3.4 Concrete SQLAlchemy Base Behavior

- Use SQLAlchemy 2.0 style: `select(Model)`, `session.execute`, `scalars()`
- `add`: `session.add(entity)`; return entity (caller may `flush` via UoW)
- `get_by_id`: optional `selectinload` via parameter or subclass override
- Soft delete: set `deleted_at = now()`; do not remove row
- Never expire entire session inside repository methods

---

## 4. Repository Responsibilities

### 4.1 UserRepository

**Responsibilities:** Load/store users; email uniqueness checks; soft-delete users.  
**Dependencies:** `AsyncSession`  
**Returns:** `User | None`, `bool`, paginated `list[User]`

| Method | Returns |
|--------|---------|
| `get_by_id(user_id)` | `User \| None` |
| `get_by_email(email)` | `User \| None` |
| `add(user)` | `User` |
| `exists_by_email(email)` | `bool` |
| `list(filters, page, limit)` | `(list[User], total)` |
| `soft_delete(user)` | `User` |

### 4.2 FarmRepository

**Responsibilities:** Tenant CRUD; slug uniqueness.  
**Returns:** `Farm`

| Method | Notes |
|--------|-------|
| `get_by_id` / `get_by_slug` | Active membership checked in service |
| `add` / `soft_delete` | |
| `exists_by_slug` | Conflict detection |

### 4.3 FarmSettingsRepository / UserPreferencesRepository

**Responsibilities:** 1:1 settings rows.  
**Methods:** `get_by_farm_id`, `get_by_user_id`, `add`, `update` (mutate entity).

### 4.4 PondRepository

**Responsibilities:** Pond master data; name uniqueness per farm; status filters.  
**Always:** `farm_id` on reads.

| Method | Notes |
|--------|-------|
| `get_by_id(pond_id, farm_id)` | |
| `list_by_farm(farm_id, filters, sort, page, limit)` | |
| `exists_by_name(farm_id, name)` | Partial unique awareness |
| `count_by_status(farm_id)` | Dashboard aggregates |
| `add` / `soft_delete` / `restore` | |

### 4.5 BatchRepository (FishBatch)

**Responsibilities:** Batch aggregate persistence; quantity updates; transfers/samples as related writes.  
**Critical methods:**

| Method | Returns / notes |
|--------|-----------------|
| `get_by_id(batch_id, farm_id)` | Optional load species/pond |
| `get_active_by_pond(pond_id, farm_id)` | Enforce one-active policy support |
| `list_by_farm(...)` | Filter by status, pond, species |
| `exists_by_code(farm_id, batch_code)` | |
| `add(batch)` | |
| `update_quantity(batch, new_qty)` | Persist `current_quantity` only — **no rule check** |
| `add_transfer(transfer)` | Immutable history |
| `add_weight_sample(sample)` | |
| `list_transfers(batch_id)` | |

Quantity eligibility is **service** responsibility; repository only writes the value the service computed.

### 4.6 FeedingRepository

**Responsibilities:** Feeding facts; daily lists; batch history.

| Method | Notes |
|--------|-------|
| `get_by_id(id, farm_id)` | |
| `list_by_farm(farm_id, filters, page, limit)` | Date/status/pond |
| `list_by_batch(batch_id, farm_id, ...)` | History |
| `add` / `soft_delete` (void) | |
| `sum_quantity_kg(farm_id, date)` | Aggregation for dashboard |

### 4.7 InventoryRepository

**Responsibilities:** Stock balances, purchases, ledger append.

| Method | Notes |
|--------|-------|
| `get_balance(farm_id, feed_type_id)` | `FeedInventory \| None` |
| `list_balances(farm_id, filters)` | Low-stock filter |
| `add_purchase(purchase)` | |
| `adjust_balance(inventory, delta)` | Write qty — service validates |
| `add_transaction(tx)` | **Append-only**; no update/delete methods |
| `list_transactions(inventory_id, page)` | |

### 4.8 WaterRepository

**Responsibilities:** Pond-scoped water records only.

| Method | Notes |
|--------|-------|
| `get_by_id(id, farm_id)` | |
| `list_by_pond(pond_id, farm_id, ...)` | |
| `list_by_farm(farm_id, filters, ...)` | |
| `latest_by_pond(pond_id, farm_id)` | Detail screens |
| `add` / `soft_delete` | |
| ~~`list_by_batch`~~ | **Does not exist** |

### 4.9 MortalityRepository

**Responsibilities:** Mortality facts; batch history; sums for survival repair tools.

| Method | Notes |
|--------|-------|
| `add` / `get_by_id` / `list_by_batch` / `list_by_farm` | |
| `sum_quantity(batch_id)` | Support recompute tools |
| `soft_delete` | Void |

### 4.10 HarvestRepository

**Responsibilities:** Harvest facts; farm/batch lists; revenue aggregates for reports (read-only SQL).

| Method | Notes |
|--------|-------|
| `add` / `get_by_id` / `list_by_farm` / `list_by_batch` | |
| `sum_total_weight(farm_id, date_from, date_to)` | Reporting |
| `soft_delete` | Void |

### 4.11 ReportRepository

**Responsibilities:** Report job metadata CRUD; status transitions persistence.

| Method | Notes |
|--------|-------|
| `add` / `get_by_id` / `list_by_farm` | |
| `update_status(report, status, file_url?, generated_at?)` | Field writes only |

### 4.12 NotificationRepository

**Responsibilities:** Inbox persistence; mark read; unread counts.

| Method | Notes |
|--------|-------|
| `add` / `list_for_user(farm_id, user_id, filters, page)` | |
| `mark_read(ids, user_id, farm_id)` | |
| `count_unread(farm_id, user_id)` | |
| `add_all` | Bulk insert from event handlers |

### 4.13 Supporting Repositories

| Repository | Responsibility |
|------------|----------------|
| `RoleRepository` | `get_by_name`, `list_all` |
| `FarmMembershipRepository` | `get(user_id, farm_id)`, `list_farms_for_user`, `add`, `soft_delete` |
| `RefreshTokenRepository` | `add`, `get_by_hash`, `revoke`, `revoke_all_for_user` |
| `VendorRepository` / `CustomerRepository` | Catalog CRUD farm-scoped |
| `SpeciesRepository` | Global + farm-custom list |
| `FeedTypeRepository` | Feed catalog |
| `AuditLogRepository` | `add` only (no update/delete) |

---

## 5. Repository Method Catalog

### 5.1 Naming Conventions

| Pattern | Meaning |
|---------|---------|
| `get_by_id` | Single row by PK (+ `farm_id` when scoped) |
| `get_by_<field>` | Unique lookup (`get_by_email`, `get_by_slug`) |
| `list_<scope>` | Collection (`list_by_farm`, `list_by_batch`) |
| `search` | Free-text + filters |
| `add` | Stage insert |
| `add_all` | Stage many inserts |
| `soft_delete` / `restore` | Soft-delete lifecycle |
| `exists` / `exists_by_<field>` | Boolean |
| `count` / `count_by_<dim>` | Integers |
| `sum_<metric>` | Aggregates |
| `paginate` | Internal helper returning `(items, total)` |

**Consistency rules:**

- Prefer `add` over `create` (create implies business use case)
- Prefer `get_*` returning `None` over raising — services raise `NotFoundError`
- Always put `farm_id` as explicit argument on operational methods (not hidden global)
- Use `include_deleted: bool = False` rather than separate methods when possible
- Async: all public methods `async def`

### 5.2 Standard Return Types

| Operation | Return |
|-----------|--------|
| Get one | `Model \| None` |
| List | `list[Model]` or `tuple[list[Model], int]` when paginated |
| Exists | `bool` |
| Count / sum | `int` / `Decimal` |
| Add | Same entity instance (identity-mapped) |
| Soft delete | Updated entity |

Repositories return **ORM models** (or lightweight named tuples / `TypedDict` for pure projections). They do **not** return Pydantic response schemas.

### 5.3 Projection / Read Models (Optional)

For heavy list endpoints, allow:

```
async def list_summaries(farm_id, ...) -> list[PondSummaryRow]
```

Where `PondSummaryRow` is a typed dataclass / `RowMapping` — still in repository layer, mapped to Pydantic in route/service. Keeps SQL column selection efficient.

---

## 6. Query Design Strategy

| Strategy | When to use | PondDesk examples |
|----------|-------------|-------------------|
| **Filtering** | Structured enums/FKs/dates | `status`, `pond_id`, `feeding_date` |
| **Searching** | `ilike` on name/code | Pond name, batch_code, vendor name |
| **Sorting** | User-selected columns allow-listed | `created_at`, `name`, `harvest_date` |
| **Pagination** | All list endpoints | Offset default; cursor for huge facts later |
| **Aggregations** | Dashboard / reports | `sum(quantity_kg)`, unread counts |
| **Joins** | Need parent columns in one query | Batch list with pond name |
| **Subqueries** | Exists / latest-per-group | Latest water per pond |
| **Window functions** | Advanced reporting | Rank batches by survival |

### 6.1 Filter Objects

Accept small dataclasses / Protocol filter objects (not full Pydantic models required):

```
PondQueryFilters(status, pond_type, q, include_deleted=False)
```

Services map `PondFilter` schema → `PondQueryFilters`.

### 6.2 Sort Allow-List

Never interpolate client `sort_by` into SQL. Map string → column:

```
SORT_COLUMNS = {"name": Pond.name, "created_at": Pond.created_at, ...}
```

### 6.3 Pagination SQL

1. Apply filters to base `select`  
2. `count()` with same filters (or window count when justified)  
3. `offset/limit` + deterministic `order_by` (always include PK tie-breaker)

---

## 7. Async Session Lifecycle

### 7.1 Flow (Per Request)

```
Request
  → get_db_session() yields AsyncSession
  → get_uow(session) or get_*_repository(session)
  → Service methods call repositories
  → Service: await uow.commit()  OR  raise → rollback
  → finally: await session.close()
```

### 7.2 Session Rules

| Operation | Who | When |
|-----------|-----|------|
| Create session | DI (`get_db_session`) | Request start |
| `add` / `execute` | Repository | During service call |
| `flush` | Service/UoW optional | Need PK before commit / mid-workflow |
| `refresh` | Service/UoW | After flush when server defaults needed |
| `commit` | Service / UoW | End of successful use case |
| `rollback` | Service / UoW / DI teardown | On error |
| `close` | DI | Always |

### 7.3 Repository Session Usage

- Repositories **receive** `AsyncSession` in `__init__`
- Repositories **never** create engines or sessions
- Repositories **never** begin nested transactions unless using explicit `session.begin_nested()` requested by UoW for savepoints
- Prefer one session shared across all repos in a request

### 7.4 Flush vs Commit

| `flush` | Writes SQL inside TX; IDs available; still rollback-able |
| `commit` | Ends TX; visible to others |

Harvest flow may `flush` after inserting harvest before updating batch quantity in same TX — still single `commit` at end.

---

## 8. Transaction Strategy

### 8.1 Ownership

| Layer | Transaction role |
|-------|------------------|
| **Repository** | Participate only; no commit |
| **Service** | Owns use-case boundary; calls `commit` |
| **Unit of Work** | Preferred facade: exposes repos + `commit`/`rollback` |
| **Route** | Never opens/commits transactions |

### 8.2 Unit of Work

```
UnitOfWork
  session: AsyncSession
  ponds: PondRepository
  batches: BatchRepository
  feedings: FeedingRepository
  inventory: InventoryRepository
  harvests: HarvestRepository
  ...
  async def commit()
  async def rollback()
  async def flush()
```

Multi-aggregate example (harvest):

1. `harvests.add(record)`  
2. `batches.update_quantity(...)`  
3. optional inventory TX  
4. `await uow.commit()`  
5. publish `HarvestCompleted` **after** commit  

### 8.3 Nested Transactions

- Use `begin_nested()` (SAVEPOINTs) only for optional sub-steps that may fail without aborting the whole use case (rare)
- Default: one flat transaction per service method

### 8.4 Rollback Strategy

- On any exception: `await session.rollback()` then re-raise  
- DI dependency should rollback if session dirty and uncommitted on exit  
- After rollback, do not reuse entities without refresh/expunge policy

---

## 9. Error Handling Strategy

### 9.1 Repository Behavior

| DB situation | Repository action |
|--------------|-------------------|
| Row missing | Return `None` (not raise) |
| `IntegrityError` unique | Translate → `ConflictError` **or** re-raise wrapped `RepositoryIntegrityError` for service |
| `IntegrityError` FK | Translate → `Validation/Conflict` with stable code |
| `OperationalError` connection | Propagate as infrastructure failure → 503 |
| Deadlock / serialization failure | Propagate; service may retry once |
| Timeout | Propagate; log + 504/503 policy at handler |

**Recommendation:** Repositories catch `IntegrityError`, map to domain-neutral `RepositoryConflictError` with constraint name; services map to Phase 3 `error_code` (`POND_NAME_EXISTS`, etc.).

### 9.2 What to Propagate to Services

| Propagate | Swallow |
|-----------|---------|
| Not found as `None` | — |
| Conflicts / integrity | — |
| Connection/deadlock/timeout | — |
| Unexpected DB errors | Never hide — log and raise |

Repositories must not convert errors into HTTP exceptions.

---

## 10. Soft Delete Strategy

Aligned with Phase 2 / Phase 5:

### 10.1 Soft Delete (Masters + Voidable Facts)

| Action | Implementation |
|--------|----------------|
| Soft delete | Set `deleted_at = utcnow()` |
| Restore | Set `deleted_at = None` |
| Default reads | `WHERE deleted_at IS NULL` |
| Admin / audit include | `include_deleted=True` |

### 10.2 Permanent Delete

| Allowed | Forbidden |
|---------|-----------|
| Rare admin purge of soft-deleted masters with no FK dependents | `inventory_transactions`, `audit_log`, `batch_transfers` |
| Test DB cleanup | Production fact hard-delete |

Expose `hard_delete` only on repos that allow it; omit from ledger repos.

### 10.3 Filtering Deleted Records

Centralize in base:

```
def not_deleted(stmt, model):
    return stmt.where(model.deleted_at.is_(None))
```

Partial unique indexes (pond name, batch code) already ignore soft-deleted rows — repositories must not “reuse” names without service awareness of DB constraints.

---

## 11. Bulk Operations Strategy

### 11.1 Methods

| Method | Implementation notes |
|--------|----------------------|
| `add_all(entities)` | `session.add_all`; flush once |
| `bulk_insert(mappings)` | Core `insert()` for large pure inserts (no ORM events) |
| `bulk_update` | Prefer per-entity for correctness; `update()` with care for soft-delete |
| `bulk_soft_delete(ids, farm_id)` | Single `update` where id in ids and farm_id match |

### 11.2 Batch Processing

- Cap bulk sizes at API/schema layer (50–100); repository may assert `len <= MAX`
- For thousands of rows: chunk (e.g. 500) with intermediate `flush`
- Avoid loading entire tables into memory

### 11.3 Performance Considerations

| Approach | Pros | Cons |
|----------|------|------|
| ORM `add_all` | Simple, relationships work | Slower for huge batches |
| Core bulk insert | Fast | Skips ORM validators/events |
| Chunked commits | Lower memory | **Forbidden inside repo** — chunk flush only; one service commit |

---

## 12. Performance Optimization

### 12.1 Loading Strategies

| Strategy | Use case |
|----------|----------|
| **`lazy="raise"`** (ORM default) | Prevent accidental IO in schemas |
| **`selectinload`** | Collections on detail (`batch.feeding_records` limited) |
| **`joinedload`** | Many-to-one small parents (`batch.species`, `batch.pond`) |
| **No load** | List endpoints — use projections instead |
| **Deferred columns** | `password_hash`, large JSON — don't select unless needed |

### 12.2 Avoiding N+1

- List endpoints: never iterate `pond.fish_batches` without `selectinload`
- Prefer explicit repository methods that join required columns
- Code review checklist: any relationship access outside repo after `raise` lazy

### 12.3 Projection Queries

```
select(Pond.id, Pond.name, Pond.status)  # list cards
```

Map to summary DTO in service/route.

### 12.4 Indexes

Repositories should write queries that **hit Phase 2 indexes**:

- `(farm_id, status)`, `(farm_id, feeding_date DESC)`, `(pond_id, tested_at DESC)`, etc.
- Always filter `farm_id` first on operational lists

### 12.5 Aggregation

- Push `sum`/`count` to SQL — do not load all rows to Python
- Dashboard: dedicated repository methods, not reuse of full entity lists

---

## 13. Dependency Injection Strategy

### 13.1 Constructor Injection

```
class SqlAlchemyPondRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
```

### 13.2 FastAPI Depends

```
get_db_session() -> AsyncIterator[AsyncSession]
get_pond_repository(session=Depends(get_db_session)) -> PondRepository
get_unit_of_work(session=Depends(get_db_session)) -> UnitOfWork
get_harvest_service(uow=Depends(get_unit_of_work)) -> HarvestService
```

Prefer injecting **UnitOfWork** into services that touch multiple aggregates; inject single repo only for trivial read services.

### 13.3 Lifetime

| Object | Scope |
|--------|-------|
| `AsyncEngine` | Application singleton |
| `AsyncSession` | Request |
| Repository instances | Request (new per Depends call is fine — cheap) |
| UnitOfWork | Request |
| Service | Request |

### 13.4 Testing Overrides

```
app.dependency_overrides[get_unit_of_work] = lambda: FakeUnitOfWork()
```

Or override `get_db_session` with test session.

---

## 14. Testing Strategy

| Test type | Approach |
|-----------|----------|
| **Unit (service)** | Fake repositories in-memory dicts implementing Protocol |
| **Unit (repo query building)** | Optional — prefer integration |
| **Integration (repo)** | Real Postgres (Docker); truncate/rollback per test |
| **API** | Full stack with test DB |

### 14.1 Fake Repository Guidelines

- Implement the same Protocol  
- Support `farm_id` filtering  
- Soft-delete semantics mirrored  
- No SQLAlchemy imports in fakes  

### 14.2 Integration Test Focus

- Tenant isolation (cannot read other `farm_id`)  
- Soft-delete default exclusion  
- Unique conflicts  
- Pagination totals  
- Water repo has no batch join API  
- Ledger `add_transaction` has no delete path  

### 14.3 In-Memory SQLite

**Not recommended** as primary: Postgres enums, partial indexes, JSONB differ. Use Postgres in CI.

---

## 15. Repository Best Practices

1. **One aggregate per repository** — don't create a god `FarmDataRepository`  
2. **Explicit `farm_id`** on operational methods  
3. **Return `None` for misses** — services raise NotFound  
4. **No commits**  
5. **Allow-list sorts and filters**  
6. **Deterministic ordering** for pagination  
7. **Typed Protocols** for every public repo  
8. **Keep methods intention-revealing** (`list_low_stock`, not `list(flags=0x3)`)  
9. **Document loading assumptions** in method docstrings (`loads pond+species`)  
10. **Log slow queries** via instrumentation at session level, not ad-hoc prints  
11. **Never leak password_hash** in custom joins for listings — defer/exclude  
12. **Idempotent soft deletes** — deleting already-deleted is no-op or return same  

### 15.1 Naming Quick Reference

```
get_by_id / get_by_email / get_by_slug
list_by_farm / list_by_batch / list_by_pond
search
add / add_all
soft_delete / restore
exists / exists_by_name
count / sum_quantity_kg
```

---

## 16. Architecture Decision Rationale

| # | Decision | Alternatives | Rationale |
|---|----------|--------------|-----------|
| REP-001 | Protocol + SQLAlchemy impl | Concrete-only repos | Testability; ADR-003 |
| REP-002 | Repositories never commit | Repo auto-commit | ADR-004; multi-aggregate TX |
| REP-003 | Unit of Work facade | Pass many repos to services | Clear TX boundary; less ctor noise |
| REP-004 | Return ORM models | Return Pydantic from repos | Keep DTO mapping at edge (Phase 7) |
| REP-005 | `None` vs raise on miss | Always raise in repo | Services own NotFound messaging |
| REP-006 | Mandatory `farm_id` args | Implicit tenant context var only | Explicit, greppable isolation (ADR-013) |
| REP-007 | Soft delete in base | Per-repo copy-paste | Consistency with Phase 2 |
| REP-008 | No water-by-batch API | Convenience join | Phase 1/2 critical rule |
| REP-009 | Ledger append-only repo API | Generic CRUD | Compliance / inventory integrity |
| REP-010 | IntegrityError translation layer | Raw SQLAlchemy to routes | Stable error codes for API |
| REP-011 | Postgres for repo integration tests | SQLite memory | Parity with enums/indexes |
| REP-012 | Projection methods for lists | Always full entities | Performance for mobile/dashboard |

### 16.1 Alignment Map

| Phase | Contribution |
|-------|--------------|
| Phase 2 | Indexes & soft-delete semantics queries must honor |
| Phase 4 | Layer rules, UoW, DI |
| Phase 5 | Models repositories persist |
| Phase 7 | Schemas map *after* repo returns |
| Phase 8 | This document — how data is accessed |

### 16.2 Implementation Readiness Checklist

- [ ] Create `interfaces/` Protocols for all aggregates in §1.3  
- [ ] Implement `sqlalchemy/base.py` + farm-scoped helpers  
- [ ] Implement `UnitOfWork`  
- [ ] Implement Pond/Batch/Feeding/Harvest/Water/Inventory first (critical path)  
- [ ] Wire `dependencies/repositories.py` + `get_unit_of_work`  
- [ ] Add fake repos for service unit tests  
- [ ] Add Postgres integration tests for tenant isolation + soft delete  
- [ ] Verify no `commit()` in repository package (lint/grep CI)  

---

**Document Status:** Ready for repository interface & SQLAlchemy implementation.  
**Next Phase:** Phase 9 — Service layer design (business workflows using these repositories + Phase 7 DTOs).  
See [Service Layer](./09-service-layer.md).
