# Pydantic v2 Schema Architecture (DTO Layer)

> **Phase:** 7 — Request/Response Schema Design  
> **Status:** Approved — Pre-Implementation  
> **Project:** PondDesk Fish Farm Management Platform  
> **Stack:** Pydantic v2 · FastAPI · Python 3.13+  
> **Depends on:** Phase 3 (API contract) · Phase 4 (schema strategy) · Phase 5 (ORM — independent of DTOs)

Designs the complete Data Transfer Object layer: the typed contract between clients and the backend. Schemas never import SQLAlchemy models. No routes, repositories, or services in this phase.

## Related Documents

- [API Contract](./03-api-contract.md) — Endpoint shapes, envelopes, error codes (source of truth for wire format)
- [Backend Architecture §11](./04-backend-architecture.md#11-schema-strategy) — Create/Update/Response separation (ADR-005)
- [ORM Model Design](./05-orm-models.md) — Persistence fields DTOs map *from* (via `from_attributes`)
- [Domain Model](./01-domain-model.md) — Business validation context
- [API Guide](../api/README.md) — Router map quick reference

---

## Table of Contents

- [1. Schema Architecture](#1-schema-architecture)
- [2. Folder Structure](#2-folder-structure)
- [3. Base Schemas](#3-base-schemas)
- [4. Common Schemas](#4-common-schemas)
- [5. Authentication Schemas](#5-authentication-schemas)
- [6. Resource Schemas](#6-resource-schemas)
- [7. Validation Strategy](#7-validation-strategy)
- [8. Response Format](#8-response-format)
- [9. Serialization Strategy](#9-serialization-strategy)
- [10. Best Practices](#10-best-practices)
- [11. Design Rationale](#11-design-rationale)

---

## 1. Schema Architecture

### 1.1 Role of the DTO Layer

```
Client JSON
    ↓
Pydantic Request Schema   ← input validation, coercion, OpenAPI
    ↓
Service / Domain          ← business rules (not in schemas)
    ↓
ORM / Repository
    ↓
Pydantic Response Schema  ← safe projection, computed fields
    ↓
API Envelope
    ↓
Client JSON
```

| Responsibility | Schemas own | Schemas never own |
|----------------|-------------|-------------------|
| Shape & types | ✓ | — |
| Format validation | ✓ | — |
| OpenAPI documentation | ✓ | — |
| Serialization to/from JSON | ✓ | — |
| Business invariants | — | ✓ (services/domain) |
| DB queries / sessions | — | ✓ |
| Authorization decisions | — | ✓ |
| Password hashing | — | ✓ |

### 1.2 Independence from ORM

- DTOs live in `app/schemas/`
- ORM lives in `app/models/`
- Mapping direction: **ORM → Response** via `model_validate(orm, from_attributes=True)`
- Mapping direction: **Create/Update → service dict/entity** — services construct domain/ORM objects
- Never subclass ORM models as Pydantic models
- Never expose `password_hash`, internal ledger internals, or raw audit JSON unless explicitly designed

### 1.3 Naming Convention (ADR-005 + Phase 4)

| Pattern | HTTP use |
|---------|----------|
| `{Entity}Create` | `POST` body |
| `{Entity}Update` | Full replacement body (rare; prefer Patch) |
| `{Entity}Patch` | `PATCH` body — all fields optional |
| `{Entity}Response` | Single resource in `data` |
| `{Entity}Summary` | List item / compact card |
| `{Entity}Detail` | Expanded single resource (nested relations) |
| `{Entity}ListData` | `{ items, pagination }` inside envelope `data` |
| `{Entity}Filter` | Query params for list endpoints |
| `{Entity}Search` | Free-text + scoped search body/query |
| `{Entity}Export` | Export job request |
| `{Entity}Import` | Import upload metadata / row DTO |
| `{Entity}BulkCreate` | Batch create payload |
| `{Entity}BulkUpdate` | Batch update payload |
| `{Entity}BulkDelete` | Batch delete payload |

### 1.4 Schema Type Responsibilities

| Schema type | Responsibility |
|-------------|----------------|
| **Create** | Required fields for new resource; no `id`/`created_at` |
| **Update** | Full replace semantics — all mutable fields required |
| **Patch** | Partial update — every field `Optional` / unset-aware |
| **Response** | Public fields safe for clients; includes ids + timestamps |
| **List Response** | Envelope `data` containing `items[]` + `pagination` |
| **Summary** | Minimal fields for tables/cards (performance) |
| **Detail** | Summary + nested related summaries + computed metrics |
| **Filter** | Typed query filters (`status`, `pond_id`, date range) |
| **Search** | `q` string + optional scopes |
| **Pagination** | Page/limit or cursor params (common module) |
| **Export** | Format, date range, filters for report/export jobs |
| **Import** | Row-level validation for CSV/Excel import |
| **Bulk Create/Update/Delete** | Lists of creates/patches/ids with max length caps |

### 1.5 Pydantic v2 Defaults

All schemas use:

```
model_config = ConfigDict(
    from_attributes=True,      # Response/Detail/Summary only
    str_strip_whitespace=True, # Inputs
    extra="forbid",            # Inputs — reject unknown fields
    populate_by_name=True,     # Allow aliases
)
```

- **Input schemas:** `extra="forbid"`
- **Response schemas:** `extra="ignore"` (forward compatible) + `from_attributes=True`
- Prefer `Annotated[..., Field(...)]` over class-body validators when possible

---

## 2. Folder Structure

```
app/schemas/
├── __init__.py                 # Selective re-exports (avoid circular imports)
├── common/
│   ├── __init__.py
│   ├── base.py                 # ApiModel, ORMModel, TimestampMixin schemas
│   ├── envelope.py             # SuccessEnvelope, ErrorEnvelope, generics
│   ├── pagination.py           # Offset + cursor request/response
│   ├── sorting.py              # SortField, SortOrder
│   ├── filtering.py            # DateRangeFilter, shared filter bits
│   ├── errors.py               # ErrorDetail, ValidationErrorBody
│   ├── health.py               # HealthResponse, ReadyResponse
│   └── types.py                # Annotated UUID, Email, Phone, Decimal types
├── auth/
│   ├── __init__.py
│   ├── requests.py             # Register, Login, Refresh, Password flows
│   ├── responses.py            # TokenResponse, CurrentUserResponse
│   └── tokens.py               # JWT payload (internal DTO, not public API)
├── users/
├── farms/
├── ponds/
├── species/
├── batches/
├── feeding/
├── feed_inventory/
├── water/
├── mortality/
├── harvest/
├── vendors/
├── customers/                  # Buyers for harvest (Phase 2)
├── reports/
├── notifications/
├── settings/
│   ├── farm_settings.py
│   └── user_preferences.py
└── files/                      # Optional — Phase 3 /files
```

### 2.1 Why Each Folder Exists

| Folder | Why |
|--------|-----|
| `common/` | Shared envelopes, pagination, errors — one place to change API-wide contracts |
| `auth/` | Public auth DTOs isolated from user profile CRUD |
| `users/` | User admin/profile schemas (no password hash in responses) |
| `farms/` | Tenant root create/update/response |
| `ponds/` | High-traffic production master DTOs |
| `species/` | Catalog DTOs (global + farm-custom) |
| `batches/` | Fish batch lifecycle — densest computed fields |
| `feeding/` | Daily operations; status enums; quantity rules |
| `feed_inventory/` | Stock balances, purchases, movements |
| `water/` | Pond-scoped water tests (never batch-scoped) |
| `mortality/` | Loss events tied to batches |
| `harvest/` | Revenue-critical create/response |
| `vendors/` | Supplier catalog |
| `customers/` | Buyer catalog for harvests |
| `reports/` | Async job request + status response |
| `notifications/` | Inbox list/mark-read |
| `settings/` | Farm settings + user preferences (1:1 resources) |
| `files/` | Upload metadata / signed URL responses |

### 2.2 File Split Convention

Per resource package:

```
ponds/
├── __init__.py
├── create.py          # PondCreate
├── update.py          # PondUpdate, PondPatch
├── response.py        # PondResponse, PondSummary, PondDetail
├── list.py            # PondListData, PondFilter, PondSearch
└── bulk.py            # PondBulkCreate, PondBulkDelete (if needed)
```

Small domains may use a single `schemas.py` file until they grow.

---

## 3. Base Schemas

### 3.1 Foundation Classes

| Base | Purpose |
|------|---------|
| `ApiModel` | Root for all DTOs — shared `ConfigDict` |
| `InputModel(ApiModel)` | `extra="forbid"`, strip whitespace |
| `OutputModel(ApiModel)` | `from_attributes=True`, `extra="ignore"` |
| `ORMOutputModel(OutputModel)` | Marker for ORM-mapped responses |
| `TimestampOut` | Mixin: `created_at`, `updated_at` |
| `SoftDeleteOut` | Mixin: `deleted_at: datetime \| None` |
| `FarmScopedOut` | Mixin: `farm_id: UUID` |
| `IdentifiedOut` | Mixin: `id: UUID` |

### 3.2 Composition Pattern

```
PondResponse =
    IdentifiedOut
  + FarmScopedOut
  + TimestampOut
  + SoftDeleteOut
  + pond-specific fields
```

Prefer **mixin composition** over deep inheritance trees.

### 3.3 Generic Envelope Bases

| Generic | Purpose |
|---------|---------|
| `SuccessEnvelope[T]` | `success`, `message`, `data: T`, optional `meta` |
| `ListEnvelope[T]` | Success with `data: ListData[T]` |
| `ErrorEnvelope` | `success=False`, `message`, `error_code`, `errors`, `request_id` |

Use `TypeVar` bound to `BaseModel` for OpenAPI clarity.

---

## 4. Common Schemas

### 4.1 Identity & Time

| Schema | Fields | Notes |
|--------|--------|-------|
| `UUIDResponse` | `id: UUID` | Minimal create acknowledgement |
| `TimestampResponse` | `created_at`, `updated_at` | ISO-8601 UTC |
| `DeletedResourceResponse` | `id`, `deleted_at` | Soft-delete confirmation |

### 4.2 Pagination

#### Offset (default — Phase 3)

**Request (`PaginationParams`):**

| Field | Type | Default | Validation |
|-------|------|---------|------------|
| `page` | `int` | `1` | `ge=1` |
| `limit` | `int` | `20` | `ge=1`, `le=100` |

**Response (`PaginationMeta`):**

| Field | Type |
|-------|------|
| `page` | `int` |
| `limit` | `int` |
| `total` | `int` |
| `total_pages` | `int` |
| `has_next` | `bool` |
| `has_previous` | `bool` |

**List data:**

```
ListData[T] = { items: list[T], pagination: PaginationMeta }
```

#### Cursor (optional — large fact tables)

**Request:** `cursor: str | None`, `limit: int`  
**Response:** `next_cursor`, `prev_cursor`, `has_more`  
Use for `feeding_records`, `water_records`, `audit_log` when offset cost grows.

### 4.3 Sorting & Filtering

| Schema | Fields |
|--------|--------|
| `SortOrder` | Enum: `asc`, `desc` |
| `SortParams` | `sort_by: str`, `sort_order: SortOrder` |
| `DateRangeFilter` | `date_from: date \| None`, `date_to: date \| None` (+ model validator `date_from ≤ date_to`) |
| `SearchParams` | `q: str \| None` (`min_length=1`, `max_length=200` when set) |

Resource filters extend these (e.g. `PondFilter(DateRangeFilter)` with `status`, `pond_type`).

### 4.4 API Messages & Health

| Schema | Purpose |
|--------|---------|
| `APIMessage` | `{ message: str }` for simple acknowledgements inside `data` |
| `SuccessResponse` | Alias of `SuccessEnvelope[None]` or `SuccessEnvelope[APIMessage]` |
| `HealthResponse` | `{ status: "ok", version: str }` |
| `ReadyResponse` | `{ status: "ready", database: bool, storage: bool }` |
| `Metadata` | Optional envelope `meta`: `{ request_id, server_time }` |

### 4.5 Error Schemas

| Schema | Purpose |
|--------|---------|
| `ErrorDetail` | `field`, `message`, `code` |
| `ErrorResponse` / `ErrorEnvelope` | Wire error body (Phase 3 §6.2) |
| `ValidationErrorResponse` | 422 specialization; `error_code=VALIDATION_ERROR` |

### 4.6 Shared Annotated Types (`common/types.py`)

| Alias | Definition |
|-------|------------|
| `EntityId` | `Annotated[UUID, Field(...)]` |
| `EmailAddress` | `Annotated[EmailStr, AfterValidator(lower)]` |
| `NonEmptyStr` | `Annotated[str, Field(min_length=1, max_length=...)]` |
| `PhoneNumber` | Optional E.164 pattern |
| `PositiveInt` | `Annotated[int, Field(gt=0)]` |
| `NonNegativeInt` | `Annotated[int, Field(ge=0)]` |
| `PositiveDecimal` | `Annotated[Decimal, Field(gt=0)]` |
| `NonNegativeDecimal` | `Annotated[Decimal, Field(ge=0)]` |
| `TemperatureC` | `Annotated[Decimal, Field(ge=0, le=45)]` |
| `PhValue` | `Annotated[Decimal, Field(ge=0, le=14)]` |
| `Percent` | `Annotated[int, Field(ge=0, le=100)]` |

---

## 5. Authentication Schemas

### 5.1 Requests

| Schema | Key fields | Notes |
|--------|------------|-------|
| `RegisterRequest` | `email`, `password`, `full_name`, `phone?`, `farm_name?` | Password complexity via `Field` + `field_validator` |
| `LoginRequest` | `email`, `password` | Normalize email |
| `RefreshTokenRequest` | `refresh_token` | If not cookie-only |
| `ForgotPasswordRequest` | `email` | Always same success message |
| `ResetPasswordRequest` | `token`, `new_password` | |
| `ChangePasswordRequest` | `current_password`, `new_password` | Authenticated |

### 5.2 Responses

| Schema | Key fields |
|--------|------------|
| `TokenResponse` | `access_token`, `refresh_token?`, `token_type="bearer"`, `expires_in` |
| `AccessTokenResponse` | Access-only variant after refresh |
| `CurrentUserResponse` | `id`, `email`, `full_name`, `phone?`, `role`, `permissions[]`, `farm_id`, `farm_name?` |
| `MessageResponse` | Generic success message for forgot-password |

### 5.3 Internal Token DTOs (not public OpenAPI)

| Schema | Purpose |
|--------|---------|
| `JWTPayload` | `sub`, `farm_id`, `role`, `permissions`, `iat`, `exp`, `jti`, `type` |
| `AccessTokenClaims` | Typed access token |
| `RefreshTokenRecord` | Internal representation after DB load |

**Security:** Never include `password` or `password_hash` on any response schema. Login/Register responses return tokens + `CurrentUserResponse` subset only.

---

## 6. Resource Schemas

For each domain: purpose, primary schemas, notable fields/validation. Align field names with Phase 2/5 where exposed.

### 6.1 Users

| Schema | Notes |
|--------|-------|
| `UserCreate` | Admin invite / create |
| `UserPatch` | `full_name`, `phone`, `is_active` |
| `UserResponse` / `UserSummary` | No secrets |
| `UserFilter` | `is_active`, `role`, `q` |

### 6.2 Farms

| Schema | Notes |
|--------|-------|
| `FarmCreate` | `name`, `location?`, `timezone`, `measurement_unit` |
| `FarmPatch` | Profile fields |
| `FarmResponse` / `FarmDetail` | Include settings summary optional |
| `FarmFilter` | Admin multi-farm list |

### 6.3 Ponds

| Schema | Notes |
|--------|-------|
| `PondCreate` | `name`, `pond_type`, capacity fields, flags |
| `PondPatch` | Status transitions constrained in service |
| `PondResponse` | Status, type, capacity, notes |
| `PondSummary` | `id`, `name`, `status`, `active_batch_code?` |
| `PondDetail` | Summary + latest water status + active batch summary |
| `PondFilter` | `status`, `pond_type`, `q` |
| `PondBulkCreate` | `items: list[PondCreate]` `max_length=50` |

### 6.4 Species

| Schema | Notes |
|--------|-------|
| `SpeciesCreate` | Farm-custom or admin global |
| `SpeciesResponse` | Optimal temp/pH ranges |
| `SpeciesFilter` | `is_active`, `q` |

### 6.5 Fish Batches (`batches/`)

| Schema | Notes |
|--------|-------|
| `BatchCreate` | `pond_id`, `species_id`, `batch_code`, quantities, dates, `vendor_id?` |
| `BatchPatch` | Notes, expected harvest, weights — not arbitrary quantity edits |
| `BatchResponse` | Includes `current_quantity`, status |
| `BatchSummary` | Card fields + `survival_rate` computed |
| `BatchDetail` | Nested pond/species summaries + recent mortality/harvest counts |
| `BatchFilter` | `status`, `pond_id`, `species_id`, date ranges |
| `BatchExport` | Report-style export request |

**Computed on response (not stored input):** `age_days`, `days_until_harvest`, `survival_rate`, `estimated_biomass_kg`.

### 6.6 Feeding

| Schema | Notes |
|--------|-------|
| `FeedingCreate` | `fish_batch_id`, `feed_type_id`, `fed_at`, `quantity_kg`, `status`, method |
| `FeedingPatch` | Within edit window (service enforces) |
| `FeedingResponse` / `FeedingSummary` | Include pond/batch labels for UI |
| `FeedingFilter` | `feeding_date`, `status`, `pond_id`, `batch_id` |
| `FeedingBulkCreate` | Morning schedule upload |

**Validation:** `quantity_kg > 0` when status is COMPLETED.

### 6.7 Feed Inventory

| Schema | Notes |
|--------|-------|
| `FeedInventoryResponse` | Balance, reorder, location |
| `FeedInventoryPatch` | Reorder level, storage location (not raw qty without movement) |
| `FeedPurchaseCreate` | Vendor, type, qty, prices, invoice |
| `FeedPurchaseResponse` | |
| `InventoryMovementCreate` | Adjustment/spoilage with reason |
| `FeedInventoryFilter` | `low_stock_only`, `feed_type_id` |

### 6.8 Water Records

| Schema | Notes |
|--------|-------|
| `WaterRecordCreate` | **`pond_id` only** — no `fish_batch_id` |
| `WaterRecordPatch` | Corrections within policy |
| `WaterRecordResponse` / `Detail` | Params + `status` + `source` |
| `WaterRecordFilter` | `pond_id`, date range, `status` |
| `WaterRecordExport` | Water quality report input |

**Validation:** temperature 0–45, pH 0–14, level 0–100.

### 6.9 Mortality

| Schema | Notes |
|--------|-------|
| `MortalityCreate` | `fish_batch_id`, `quantity > 0`, `cause`, `recorded_at` |
| `MortalityResponse` | |
| `MortalityFilter` | batch, date, cause |

Business rule (quantity ≤ population) is **service-layer**, not schema.

### 6.10 Harvest

| Schema | Notes |
|--------|-------|
| `HarvestCreate` | batch, quantities, weights, price, customer?, type, status |
| `HarvestPatch` | Limited fields pre-finalization |
| `HarvestResponse` | Includes `total_revenue` computed |
| `HarvestSummary` | List/table |
| `HarvestFilter` | date, pond, batch, status |
| `HarvestExport` | |

**Validation:** `quantity > 0`, `avg_weight_kg > 0`, `total_weight_kg > 0`. Exceeds-count → service → 409.

### 6.11 Vendors & Customers

| Schema | Notes |
|--------|-------|
| `VendorCreate` / `Patch` / `Response` / `Filter` | Category enum |
| `CustomerCreate` / `Patch` / `Response` / `Filter` | Harvest buyers |

### 6.12 Reports

| Schema | Notes |
|--------|-------|
| `ReportCreate` | `report_type`, date range, format, filters/parameters |
| `ReportResponse` | status, `file_url?`, timestamps |
| `ReportFilter` | type, status |
| `ReportExport` | Alias of create for clarity |

Async: `202` + `ReportResponse` with `PENDING`.

### 6.13 Notifications

| Schema | Notes |
|--------|-------|
| `NotificationResponse` / `Summary` | type, severity, read state |
| `NotificationFilter` | `is_read`, type, severity |
| `NotificationMarkRead` | `ids: list[UUID]` or mark-all flag |
| `NotificationBulkDelete` | Optional |

### 6.14 Settings

| Schema | Notes |
|--------|-------|
| `FarmSettingsResponse` | Full policy object |
| `FarmSettingsPatch` | Thresholds, windows, JSON maps |
| `UserPreferencesResponse` | theme, language, date_format, notification_prefs |
| `UserPreferencesPatch` | Partial preference updates |

### 6.15 Bulk Operations (Cross-cutting Shape)

```
BulkCreate[T]:
  items: list[T]  # 1..N, N capped per resource (e.g. 50–100)

BulkUpdate[T]:
  items: list[{ id: UUID, data: T }]

BulkDelete:
  ids: list[UUID]  # 1..N capped
```

Responses: `BulkResult` with `succeeded[]`, `failed[]` (`id`, `error_code`, `message`) for partial success policies — or all-or-nothing if service wraps one transaction.

---

## 7. Validation Strategy

### 7.1 What Belongs in Pydantic

| Rule | Mechanism | Example |
|------|-----------|---------|
| Required fields | Field presence on Create | `name: str` |
| Numeric bounds | `Field(gt=0)` / Annotated types | Fish count, feed kg, harvest weight |
| Ranges | `Field(ge=, le=)` | Temperature, pH, percent |
| Formats | `EmailStr`, UUID, regex | Email, phone |
| String cleanup | `str_strip_whitespace`, `AfterValidator` | Names, emails lowercased |
| Date order | `model_validator` | `date_from ≤ date_to` |
| Conditional fields | `model_validator` | `quantity_kg` required if feeding COMPLETED |
| Enum membership | Enum types | `PondStatus`, `BatchStatus` |
| Collection caps | `Field(max_length=)` | Bulk items |
| Future dates | `field_validator` | Operational dates ≤ now+1 day (Phase 3) |

### 7.2 What Does Not Belong in Pydantic

| Rule | Belongs in |
|------|------------|
| Harvest ≤ `current_quantity` | Service + domain |
| Sufficient feed inventory | Service |
| Pond capacity / one active batch | Service + DB partial unique |
| Edit window expired | Service (farm settings) |
| Permission to mutate | Auth dependencies |
| Soft-deleted target visibility | Repository/service |

### 7.3 Recommended Field Rules (PondDesk)

| Field | Schema rule |
|-------|-------------|
| Fish / mortality / harvest counts | `gt=0` (or `ge=0` only for `current_quantity` on responses) |
| Feed quantity kg | `gt=0` for completed feedings |
| Harvest weights | `gt=0` |
| Temperature °C | `0–45` |
| pH | `0–14` |
| Water level % | `0–100` |
| Email | `EmailStr` + lowercase |
| Phone | Optional E.164 |
| UUIDs | `UUID` type (reject invalid) |
| Names | strip + `min_length=1` |
| Passwords | `min_length=8`; complexity validator on auth inputs only |
| Expected harvest date | On create: `>= stocking_date` when both present |

### 7.4 Validator Styles (Pydantic v2)

| Style | Use |
|-------|-----|
| `FieldConstraints` / `Annotated` | Simple bounds — preferred |
| `@field_validator` | Per-field normalize/parse |
| `@model_validator(mode="after")` | Cross-field rules |
| `AfterValidator` / `BeforeValidator` | Reusable annotated pipelines |
| `WrapValidator` | Rare — custom error shaping |

---

## 8. Response Format

### 8.1 Success Envelope (Phase 3 Canonical)

```json
{
  "success": true,
  "message": "Harvest recorded successfully.",
  "data": {},
  "meta": {
    "request_id": "req_abc123",
    "server_time": "2026-07-10T20:00:00Z"
  }
}
```

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `success` | `bool` | Yes | Always `true` for 2xx with body |
| `message` | `str` | Yes | Human-readable outcome |
| `data` | `T \| null` | Yes | Payload; `null` only when intentional |
| `meta` | `object \| null` | No | Request metadata; omit or null if unused |
| `errors` | — | No | **Omitted** on success (do not send empty array unless clients require it) |

**Paginated:**

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
  }
}
```

### 8.2 Error Envelope (Phase 3 Canonical)

```json
{
  "success": false,
  "message": "Harvest quantity exceeds current fish count.",
  "error_code": "HARVEST_EXCEEDS_COUNT",
  "errors": [
    {
      "field": "quantity",
      "message": "Cannot harvest 500 fish. Current count is 420.",
      "code": "VALUE_TOO_HIGH"
    }
  ],
  "request_id": "req_abc123"
}
```

| Field | Meaning |
|-------|---------|
| `success` | Always `false` |
| `message` | Top-level summary |
| `error_code` | Stable machine code (Phase 3 §6.4) |
| `errors` | Optional field-level details |
| `request_id` | Correlation id |

**Note:** Phase 4’s alternate `{ error: { code, message, details } }` shape is **superseded for the public API by Phase 3**. Exception handlers must emit Phase 3 envelopes.

### 8.3 Error Model Catalog

| Error class | HTTP | `error_code` examples | Schema |
|-------------|------|----------------------|--------|
| Validation | 422 | `VALIDATION_ERROR` | `ValidationErrorResponse` |
| Authentication | 401 | `UNAUTHORIZED` | `ErrorEnvelope` |
| Authorization | 403 | `FORBIDDEN`, `EDIT_WINDOW_EXPIRED` | `ErrorEnvelope` |
| Not found | 404 | `NOT_FOUND`, `POND_NOT_FOUND`, … | `ErrorEnvelope` |
| Conflict / business | 409 | `HARVEST_EXCEEDS_COUNT`, `POND_NAME_EXISTS`, … | `ErrorEnvelope` + field errors |
| Business rule (non-conflict) | 422 | `BATCH_NOT_ACTIVE` | `ErrorEnvelope` |
| Rate limit | 429 | `RATE_LIMIT_EXCEEDED` | `ErrorEnvelope` (+ Retry-After header) |
| Database unexpected | 500 | `INTERNAL_ERROR` | Generic message only |
| Database integrity (mapped) | 409 | Conflict codes | Mapped in exception handlers |

---

## 9. Serialization Strategy

### 9.1 Computed Fields

Use `@computed_field` on response models:

| Model | Computed field |
|-------|----------------|
| `BatchSummary` | `survival_rate`, `age_days`, `days_until_harvest` |
| `HarvestResponse` | `total_revenue` |
| `FeedInventoryResponse` | `is_low_stock` |
| `PaginationMeta` | `total_pages`, `has_next`, `has_previous` (or set in constructor) |

Prefer computing in schema when pure functions of response fields; prefer service when needing extra DB aggregates.

### 9.2 Custom Serializers

| Type | Strategy |
|------|----------|
| `datetime` | UTC ISO-8601 with `Z` via serializer |
| `date` | ISO `YYYY-MM-DD` |
| `Decimal` | Serialize as string **or** float — **choose string for money**; document in OpenAPI. PondDesk recommendation: **string for currency**, plain number for weights if UI expects numbers |
| `UUID` | Standard string form |
| `Enum` | Serialize **values** (`COMPLETED`), not names |
| Optional nested | Exclude `None` with `response_model_exclude_none` sparingly — prefer explicit nulls for clients |

### 9.3 Aliases

- Wire format uses `snake_case` (Phase 3)
- Aliases only when integrating external systems
- `populate_by_name=True` when aliases exist

### 9.4 ORM → DTO

```
PondResponse.model_validate(pond_orm)
```

For nested:

- Build `PondDetail` in service/repository DTO assembler, **or**
- Use nested `PondSummary` with carefully loaded relationships

Avoid lazy-load during response validation (`lazy="raise"` on ORM).

### 9.5 Input → Service

Pass Pydantic models into services, or `.model_dump(exclude_unset=True)` for PATCH:

| Operation | Dump mode |
|-----------|-----------|
| Create | `model_dump()` |
| Patch | `model_dump(exclude_unset=True)` |
| Update (full) | `model_dump()` |

---

## 10. Best Practices

### 10.1 Design Practices

| Practice | Guidance |
|----------|----------|
| **Inheritance** | Shallow mixins (`TimestampOut`) — avoid 5-level hierarchies |
| **Composition** | Nested `PondSummary` inside `BatchDetail` |
| **Generics** | `SuccessEnvelope[T]`, `ListData[T]`, `BulkCreate[T]` |
| **Base schemas** | `InputModel` / `OutputModel` split |
| **Shared validators** | Annotated types in `common/types.py` |
| **Strict types** | `extra="forbid"` on inputs |
| **Annotated types** | Prefer over repetitive Field copies |
| **ConfigDict** | Per base class; don’t repeat on every model |
| **Field validation** | Bounds and formats |
| **Model validation** | Cross-field only |

### 10.2 OpenAPI Quality

- Explicit `json_schema_extra` examples on critical Create models (`HarvestCreate`, `FeedingCreate`)
- Document enums with descriptions
- Use `Field(description=...)` for farm-facing fields
- Keep response models free of write-only fields (`password`)

### 10.3 Versioning

- Schemas version with API (`/api/v1/`)
- Breaking DTO changes require `/api/v2/` or additive fields only
- Additive optional response fields are non-breaking

### 10.4 Testing Schemas

| Test | Assert |
|------|--------|
| Unit | Create rejects `quantity=0` |
| Unit | Patch dump excludes unset |
| Unit | Water create rejects `fish_batch_id` if somehow passed (`extra=forbid`) |
| Unit | Envelope generics serialize |
| Contract | Golden JSON examples match Phase 3 |

### 10.5 Anti-Patterns

| Anti-pattern | Why |
|--------------|-----|
| One `PondSchema` for in/out | Leaks fields; wrong optionality |
| ORM model as response | Security + coupling |
| Business rules in validators needing DB | Hidden I/O; untestable in isolation |
| `orm_mode` v1 config | Use v2 `from_attributes` |
| Returning different envelope shapes per module | Client chaos |
| Huge Detail graphs by default | Use Summary for lists |

---

## 11. Design Rationale

| # | Decision | Alternatives | Rationale |
|---|----------|--------------|-----------|
| DTO-001 | Separate Create/Patch/Response | Single model | ADR-005; security & optionality |
| DTO-002 | Phase 3 success/error envelopes | Ad-hoc JSON | Existing API contract; frontend already implied |
| DTO-003 | Schemas independent of ORM | Shared inheritance | Phase 4 clean architecture |
| DTO-004 | Offset pagination default | Cursor-only | Matches Phase 3; cursor optional later |
| DTO-005 | `extra=forbid` on inputs | Ignore extras | Catch client bugs early |
| DTO-006 | Annotated shared types | Copy-paste Field | DRY validation |
| DTO-007 | Patch uses `exclude_unset` | Nullable means clear | Distinguishes “omit” vs “set null” when needed via `Optional` + sentinel policy |
| DTO-008 | Water DTOs pond-scoped only | Optional batch_id | Phase 1/2 critical rule |
| DTO-009 | Bulk caps (≤50–100) | Unlimited arrays | Protect request size & TX time |
| DTO-010 | Computed fields on responses | Always persist | Survival rate etc. derived; keep DB lean |
| DTO-011 | Money as Decimal string on wire | Float | Avoid binary precision issues |
| DTO-012 | Internal JWT DTOs not in public schema module exports | Expose in OpenAPI | Tokens are implementation detail |

### 11.1 Alignment Map

| Phase | Contribution |
|-------|--------------|
| Phase 1 | Which fields are meaningful |
| Phase 2/5 | Canonical field names/types |
| Phase 3 | Envelope, status codes, error codes |
| Phase 4 | Folder placement, naming, no business logic |
| Phase 7 | Full DTO catalog & validation split |

### 11.2 Implementation Readiness Checklist

- [ ] Create `app/schemas/common/` with envelope, pagination, types  
- [ ] Implement auth request/response schemas  
- [ ] Implement resource schemas per module (start: ponds, batches, feeding, harvest)  
- [ ] Wire FastAPI `response_model=SuccessEnvelope[...]`  
- [ ] Map Pydantic `ValidationError` → Phase 3 `ValidationErrorResponse`  
- [ ] Unit-test annotated bounds and PATCH `exclude_unset`  
- [ ] Confirm no schema imports from `app.models`  

---

**Document Status:** Ready for schema module implementation.  
**Next Phase:** Phase 8 — Repository interfaces & implementations (consuming ORM; returning entities that routes map through these DTOs).
See [Repository Layer](./08-repository-layer.md).
