# REST API Contract

> **Phase:** 3 — API Architecture  
> **Status:** Approved — Pre-Implementation  
> **Project:** AquaCore Fish Farm Management Platform

Complete REST API specification under `/api/v1/`. Stateless, versioned, farm-scoped.

## Related Documents

- [Domain Model](./01-domain-model.md) — Phase 1 business rules
- [Database Architecture](./02-database-architecture.md) — Phase 2 table mappings
- [Backend Architecture](./04-backend-architecture.md) — Phase 4 implementation layers
- [API Guide](../api/README.md) — Endpoint quick reference
- [Security](../security/README.md) — Auth & authorization details

---

## Table of Contents

  - [1. API Architecture Overview](#1-api-architecture-overview)
    - [1.1 Design Goals](#11-design-goals)
    - [1.2 Base URL & Environment](#12-base-url-environment)
    - [1.3 Architectural Layers](#13-architectural-layers)
    - [1.4 Request Context Headers](#14-request-context-headers)
    - [1.5 Module Router Map](#15-module-router-map)
    - [1.6 Tenancy Model](#16-tenancy-model)
  - [2. Authentication Flow](#2-authentication-flow)
    - [2.1 Token Strategy](#21-token-strategy)
    - [2.2 Password Security](#22-password-security)
    - [2.3 Authentication Endpoints](#23-authentication-endpoints)
    - [2.4 Authorization Flow](#24-authorization-flow)
  - [3. Endpoint Catalog](#3-endpoint-catalog)
    - [3.1 Farms](#31-farms)
    - [3.2 Ponds](#32-ponds)
    - [3.3 Fish Batches](#33-fish-batches)
    - [3.4 Daily Feedings](#34-daily-feedings)
    - [3.5 Feed Inventory](#35-feed-inventory)
    - [3.6 Water Records](#36-water-records)
    - [3.7 Harvest](#37-harvest)
    - [3.8 Reports](#38-reports)
    - [3.9 Notifications](#39-notifications)
    - [3.10 Settings](#310-settings)
    - [3.11 Search](#311-search)
    - [3.12 Files](#312-files)
  - [4. CRUD Operations](#4-crud-operations)
    - [4.1 Standard CRUD Pattern](#41-standard-crud-pattern)
    - [4.2 Bulk Operations](#42-bulk-operations)
    - [4.3 Soft Delete Behavior](#43-soft-delete-behavior)
  - [5. Business Endpoints](#5-business-endpoints)
    - [5.1 Record Feeding](#51-record-feeding)
    - [5.2 Record Water Test](#52-record-water-test)
    - [5.3 Record Harvest](#53-record-harvest)
    - [5.4 Transfer Fish Batch](#54-transfer-fish-batch)
    - [5.5 Record Mortality](#55-record-mortality)
    - [5.6 Restock Feed](#56-restock-feed)
    - [5.7 Stock Fish (Activate Batch)](#57-stock-fish-activate-batch)
    - [5.8 Generate Report](#58-generate-report)
  - [6. Request/Response Standards](#6-requestresponse-standards)
    - [6.1 Success Response Envelope](#61-success-response-envelope)
    - [6.2 Error Response Envelope](#62-error-response-envelope)
    - [6.3 HTTP Status Code Map](#63-http-status-code-map)
    - [6.4 Standard Error Codes](#64-standard-error-codes)
  - [7. Validation Rules](#7-validation-rules)
    - [7.1 Global Rules](#71-global-rules)
    - [7.2 Entity-Specific Rules](#72-entity-specific-rules)
    - [7.3 Pydantic v2 Strategy](#73-pydantic-v2-strategy)
  - [8. Error Handling Strategy](#8-error-handling-strategy)
    - [8.1 Exception Hierarchy](#81-exception-hierarchy)
    - [8.2 Global Exception Handler](#82-global-exception-handler)
    - [8.3 Idempotency (Future)](#83-idempotency-future)
  - [9. Security Architecture](#9-security-architecture)
    - [9.1 JWT](#91-jwt)
    - [9.2 Password Hashing](#92-password-hashing)
    - [9.3 Rate Limiting](#93-rate-limiting)
    - [9.4 CORS](#94-cors)
    - [9.5 Input Validation](#95-input-validation)
    - [9.6 XSS & CSRF](#96-xss-csrf)
    - [9.7 Secure Headers (via middleware)](#97-secure-headers-via-middleware)
    - [9.8 Row-Level Security](#98-row-level-security)
  - [10. RBAC Permissions](#10-rbac-permissions)
    - [10.1 Role Hierarchy](#101-role-hierarchy)
    - [10.2 Permission Matrix](#102-permission-matrix)
    - [10.3 Permission Codes (JWT + DB)](#103-permission-codes-jwt-db)
  - [11. Performance Recommendations](#11-performance-recommendations)
    - [11.1 Dashboard — Single Aggregated Endpoint](#111-dashboard-single-aggregated-endpoint)
    - [11.2 Caching (Redis — Future)](#112-caching-redis-future)
    - [11.3 Response Compression](#113-response-compression)
    - [11.4 Background Jobs](#114-background-jobs)
    - [11.5 Async Endpoints](#115-async-endpoints)
    - [11.6 Database Optimization](#116-database-optimization)
  - [12. Testing Strategy](#12-testing-strategy)
    - [12.1 Test Pyramid](#121-test-pyramid)
    - [12.2 Unit Tests](#122-unit-tests)
    - [12.3 Integration Tests](#123-integration-tests)
    - [12.4 API Tests](#124-api-tests)
    - [12.5 Performance Tests](#125-performance-tests)
    - [12.6 Tools](#126-tools)
  - [13. Documentation Strategy](#13-documentation-strategy)
    - [13.1 OpenAPI (Auto-Generated)](#131-openapi-auto-generated)
    - [13.2 Documentation UIs](#132-documentation-uis)
    - [13.3 Documentation Standards](#133-documentation-standards)
    - [13.4 Postman Collection](#134-postman-collection)
    - [13.5 Changelog](#135-changelog)
  - [14. API Design Rationale](#14-api-design-rationale)
    - [14.1 Why REST over GraphQL](#141-why-rest-over-graphql)
    - [14.2 Why PATCH over PUT](#142-why-patch-over-put)
    - [14.3 Why Business Endpoints over Generic CRUD](#143-why-business-endpoints-over-generic-crud)
    - [14.4 Why Farm Header + JWT Claim](#144-why-farm-header-jwt-claim)
    - [14.5 Why Async Report Generation](#145-why-async-report-generation)
    - [14.6 Why Consistent Envelope](#146-why-consistent-envelope)
    - [14.7 Versioning Strategy](#147-versioning-strategy)
    - [14.8 File Upload Strategy](#148-file-upload-strategy)
    - [14.9 Pagination Standard](#149-pagination-standard)
    - [14.10 Pre-Implementation Checklist](#1410-pre-implementation-checklist)

---


## 1. API Architecture Overview

### 1.1 Design Goals

| Principle | Implementation |
|-----------|----------------|
| **Stateless** | No server-side sessions; JWT carries identity; farm context via header or token claim |
| **Versioned** | All routes under `/api/v1/`; breaking changes require `/api/v2/` |
| **Secure** | JWT + RBAC + farm-scoped tenancy + input validation |
| **Predictable** | Consistent envelopes, HTTP semantics, error codes |
| **Maintainable** | Module-based routers, service layer, repository pattern |
| **Production-ready** | Pagination, filtering, audit, soft-delete, background jobs |

### 1.2 Base URL & Environment

```
Production:  https://api.aquacore.app/api/v1/
Staging:     https://api-staging.aquacore.app/api/v1/
Local:       http://localhost:8000/api/v1/
```

### 1.3 Architectural Layers

```
┌─────────────────────────────────────────────────────────┐
│  API Layer          — FastAPI routers, Pydantic schemas │
├─────────────────────────────────────────────────────────┤
│  Auth Layer         — JWT validation, RBAC middleware   │
├─────────────────────────────────────────────────────────┤
│  Service Layer      — Business rules, transactions      │
├─────────────────────────────────────────────────────────┤
│  Repository Layer   — SQLAlchemy 2.0 queries            │
├─────────────────────────────────────────────────────────┤
│  Database           — PostgreSQL                        │
└─────────────────────────────────────────────────────────┘
```

### 1.4 Request Context Headers

| Header | Required | Purpose |
|--------|----------|---------|
| `Authorization` | Protected routes | `Bearer <access_token>` |
| `X-Farm-Id` | Multi-farm users | Active farm UUID (validated against membership) |
| `X-Request-Id` | Optional | Distributed tracing / support |
| `Accept-Language` | Optional | Locale for messages |
| `Content-Type` | POST/PATCH/PUT | `application/json` (default) |

### 1.5 Module Router Map

| Module | Router Prefix | Tag |
|--------|---------------|-----|
| Authentication | `/auth` | Auth |
| Dashboard | `/dashboard` | Dashboard |
| Farms | `/farms` | Farms |
| Ponds | `/ponds` | Ponds |
| Fish Batches | `/batches` | Batches |
| Daily Feedings | `/feedings` | Feedings |
| Feed Inventory | `/inventory` | Inventory |
| Water Records | `/water-records` | Water |
| Harvest | `/harvests` | Harvest |
| Reports | `/reports` | Reports |
| Notifications | `/notifications` | Notifications |
| Settings | `/settings` | Settings |
| Search | `/search` | Search |
| Files | `/files` | Files |

### 1.6 Tenancy Model

Every protected endpoint operates within a **farm scope**:

1. JWT identifies `user_id`
2. `X-Farm-Id` (or `farm_id` claim in token) selects active farm
3. Middleware validates `farm_memberships` + role
4. All queries filter `farm_id` automatically (repository layer)

---

## 2. Authentication Flow

### 2.1 Token Strategy

| Token | Type | Lifetime | Storage (Client) |
|-------|------|----------|------------------|
| **Access Token** | JWT (HS256 or RS256) | 15 minutes | Memory / short-lived |
| **Refresh Token** | Opaque UUID (hashed in DB) | 7 days | HttpOnly secure cookie or secure storage |

**Access Token Claims:**
```json
{
  "sub": "<user_id>",
  "email": "ayo@farm.ng",
  "farm_id": "<active_farm_id>",
  "role": "MANAGER",
  "permissions": ["ponds:read", "feedings:write"],
  "iat": 1710000000,
  "exp": 1710000900,
  "type": "access"
}
```

### 2.2 Password Security

| Aspect | Specification |
|--------|---------------|
| Hashing | bcrypt (cost factor 12) via `passlib` |
| Min length | 8 characters |
| Complexity | At least one letter + one number (configurable) |
| Reset tokens | Single-use, 1-hour expiry, hashed in DB |

### 2.3 Authentication Endpoints

---

#### `POST /api/v1/auth/register`
**Purpose:** Create user account and optionally create/join a farm.  
**Auth Required:** No

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | Valid email, unique |
| `password` | string | Yes | Min 8 chars |
| `full_name` | string | Yes | 2–200 chars |
| `phone` | string | No | E.164 format |
| `farm_name` | string | No | Required if creating new farm |

**Response (201):** User object + tokens  
**Errors:** `400`, `409` (email exists), `422`

---

#### `POST /api/v1/auth/login`
**Purpose:** Authenticate and issue tokens.  
**Auth Required:** No

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |
| `password` | string | Yes |
| `farm_id` | uuid | No | Select farm if multi-membership |

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "token_type": "bearer",
    "expires_in": 900,
    "user": { },
    "farm": { },
    "role": "MANAGER"
  }
}
```
**Errors:** `401` (invalid credentials), `403` (account deactivated), `422`

---

#### `POST /api/v1/auth/refresh`
**Purpose:** Issue new access token using refresh token.  
**Auth Required:** Refresh token only

**Request Body:** `{ "refresh_token": "..." }`  
**Response (200):** New access token (+ optional refresh rotation)  
**Errors:** `401` (expired/revoked), `422`

---

#### `POST /api/v1/auth/logout`
**Purpose:** Revoke refresh token.  
**Auth Required:** Yes

**Request Body:** `{ "refresh_token": "..." }`  
**Response (200):** Success message  
**Errors:** `401`

---

#### `POST /api/v1/auth/forgot-password`
**Purpose:** Send password reset email.  
**Auth Required:** No

**Request Body:** `{ "email": "..." }`  
**Response (200):** Always success (prevent email enumeration)  
**Errors:** `422`, `429`

---

#### `POST /api/v1/auth/reset-password`
**Purpose:** Set new password using reset token.  
**Auth Required:** No

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| `token` | string | Yes |
| `new_password` | string | Yes |

**Response (200):** Success  
**Errors:** `400` (invalid/expired token), `422`

---

#### `GET /api/v1/auth/me`
**Purpose:** Return current authenticated user, farm, role, permissions.  
**Auth Required:** Yes

**Response (200):** User profile + memberships + active farm  
**Errors:** `401`

---

#### `POST /api/v1/auth/switch-farm`
**Purpose:** Switch active farm context for multi-farm users.  
**Auth Required:** Yes

**Request Body:** `{ "farm_id": "uuid" }`  
**Response (200):** New access token with updated `farm_id` claim  
**Errors:** `403` (not a member), `404`

---

### 2.4 Authorization Flow

```
Request
  → Extract Bearer token
  → Validate JWT signature + expiry
  → Load user + farm membership
  → Check role permissions for route
  → Inject user_id, farm_id, role into request state
  → Execute handler
```

**Protected route decorator levels:**
- `@require_auth` — any authenticated user
- `@require_role(MANAGER, ADMIN)` — role gate
- `@require_permission("harvests:write")` — fine-grained gate

---

## 3. Endpoint Catalog

### 3.1 Farms

| Method | Endpoint | Purpose | Auth | Role |
|--------|----------|---------|------|------|
| `GET` | `/farms` | List farms user belongs to | Yes | Any |
| `GET` | `/farms/{farm_id}` | Get farm details | Yes | Member |
| `POST` | `/farms` | Create new farm | Yes | Any (becomes ADMIN) |
| `PATCH` | `/farms/{farm_id}` | Update farm profile | Yes | Admin, Manager |
| `DELETE` | `/farms/{farm_id}` | Soft-delete farm | Yes | Admin |
| `GET` | `/farms/{farm_id}/stats` | Farm-level statistics | Yes | Manager+ |

---

### 3.2 Ponds

| Method | Endpoint | Purpose | Auth | Role |
|--------|----------|---------|------|------|
| `GET` | `/ponds` | List ponds (filtered, paginated) | Yes | Any |
| `GET` | `/ponds/{pond_id}` | Get pond detail + current batch | Yes | Any |
| `POST` | `/ponds` | Create pond | Yes | Manager+ |
| `PATCH` | `/ponds/{pond_id}` | Update pond | Yes | Manager+ |
| `DELETE` | `/ponds/{pond_id}` | Soft-delete pond | Yes | Admin |
| `POST` | `/ponds/{pond_id}/restore` | Restore soft-deleted pond | Yes | Admin |
| `GET` | `/ponds/{pond_id}/history` | Pond batch + water history summary | Yes | Any |
| `GET` | `/ponds/{pond_id}/water-records` | Water records for pond | Yes | Any |

**Query Parameters (GET /ponds):**
| Param | Type | Description |
|-------|------|-------------|
| `status` | enum | EMPTY, ACTIVE, MAINTENANCE, DRAINED |
| `has_sensors` | bool | Filter sensor-equipped ponds |
| `search` | string | Name search |
| `sort` | string | `name`, `created_at`, `status` |
| `order` | string | `asc`, `desc` |
| `page` | int | Default 1 |
| `limit` | int | Default 20, max 100 |
| `include_deleted` | bool | Admin only |

---

### 3.3 Fish Batches

| Method | Endpoint | Purpose | Auth | Role |
|--------|----------|---------|------|------|
| `GET` | `/batches` | List batches | Yes | Any |
| `GET` | `/batches/{batch_id}` | Batch detail + metrics | Yes | Any |
| `POST` | `/batches` | Create/plan batch | Yes | Manager+ |
| `PATCH` | `/batches/{batch_id}` | Update batch metadata | Yes | Manager+ |
| `DELETE` | `/batches/{batch_id}` | Soft-delete (planned only) | Yes | Admin |
| `POST` | `/batches/{batch_id}/stock` | Activate batch (stock fish) | Yes | Manager+ |
| `POST` | `/batches/{batch_id}/transfer` | Transfer to another pond | Yes | Manager+ |
| `POST` | `/batches/{batch_id}/close` | Close batch manually | Yes | Manager+ |
| `GET` | `/batches/{batch_id}/feedings` | Batch feeding history | Yes | Any |
| `GET` | `/batches/{batch_id}/mortality` | Mortality history | Yes | Any |
| `GET` | `/batches/{batch_id}/harvests` | Harvest history | Yes | Any |
| `GET` | `/batches/{batch_id}/weight-samples` | Growth samples | Yes | Any |
| `GET` | `/batches/{batch_id}/transfers` | Transfer history | Yes | Any |

**Query Parameters (GET /batches):**
| Param | Type | Description |
|-------|------|-------------|
| `status` | enum | PLANNED, ACTIVE, HARVEST_READY, etc. |
| `species_id` | uuid | Filter by species |
| `pond_id` | uuid | Filter by pond |
| `expected_harvest_from` | date | Harvest window |
| `expected_harvest_to` | date | Harvest window |
| `search` | string | Batch code search |
| `sort` | string | `stocking_date`, `expected_harvest_date`, `status`, `created_at` |

---

### 3.4 Daily Feedings

| Method | Endpoint | Purpose | Auth | Role |
|--------|----------|---------|------|------|
| `GET` | `/feedings` | List feeding records | Yes | Any |
| `GET` | `/feedings/today` | Today's feeding schedule + status | Yes | Any |
| `GET` | `/feedings/{feeding_id}` | Single feeding record | Yes | Any |
| `POST` | `/feedings` | Record feeding | Yes | Worker+ |
| `PATCH` | `/feedings/{feeding_id}` | Edit feeding (within window) | Yes | Manager+ |
| `DELETE` | `/feedings/{feeding_id}` | Void feeding | Yes | Manager+ |
| `POST` | `/feedings/bulk` | Bulk record feedings | Yes | Worker+ |
| `POST` | `/feedings/{feeding_id}/mark-missed` | Mark as missed | Yes | Worker+ |

**Query Parameters:**
| Param | Type |
|-------|------|
| `feeding_date` | date |
| `date_from`, `date_to` | date range |
| `pond_id` | uuid |
| `batch_id` | uuid |
| `status` | SCHEDULED, COMPLETED, MISSED |
| `recorded_by` | uuid |

---

### 3.5 Feed Inventory

| Method | Endpoint | Purpose | Auth | Role |
|--------|----------|---------|------|------|
| `GET` | `/inventory` | Current stock levels | Yes | Any |
| `GET` | `/inventory/{inventory_id}` | Single inventory line | Yes | Any |
| `GET` | `/inventory/alerts` | Low-stock alerts | Yes | Any |
| `GET` | `/inventory/transactions` | Ledger history | Yes | Manager+ |
| `POST` | `/inventory/restock` | Record feed purchase + increase stock | Yes | Manager+ |
| `POST` | `/inventory/adjust` | Manual stock adjustment | Yes | Admin |
| `GET` | `/feed-types` | List feed types | Yes | Any |
| `POST` | `/feed-types` | Create feed type | Yes | Manager+ |
| `PATCH` | `/feed-types/{type_id}` | Update feed type | Yes | Manager+ |
| `GET` | `/vendors` | List vendors | Yes | Any |
| `POST` | `/vendors` | Create vendor | Yes | Manager+ |
| `PATCH` | `/vendors/{vendor_id}` | Update vendor | Yes | Manager+ |
| `DELETE` | `/vendors/{vendor_id}` | Soft-delete vendor | Yes | Admin |

---

### 3.6 Water Records

| Method | Endpoint | Purpose | Auth | Role |
|--------|----------|---------|------|------|
| `GET` | `/water-records` | List water records | Yes | Any |
| `GET` | `/water-records/{record_id}` | Single record | Yes | Any |
| `POST` | `/water-records` | Record water test | Yes | Worker+ |
| `PATCH` | `/water-records/{record_id}` | Edit record | Yes | Manager+ |
| `DELETE` | `/water-records/{record_id}` | Void record | Yes | Manager+ |
| `POST` | `/water-records/import-sensor` | Import IoT sensor batch | Yes | Manager+ |
| `GET` | `/water-records/pond-status` | Live status all ponds | Yes | Any |
| `GET` | `/water-records/alerts` | Active water alerts | Yes | Any |
| `GET` | `/water-records/trends` | Parameter trends (chart data) | Yes | Any |

**Query Parameters:**
| Param | Type |
|-------|------|
| `pond_id` | uuid |
| `date_from`, `date_to` | date |
| `status` | HEALTHY, WARNING, CRITICAL |
| `recorded_by` | uuid |

---

### 3.7 Harvest

| Method | Endpoint | Purpose | Auth | Role |
|--------|----------|---------|------|------|
| `GET` | `/harvests` | List harvest records | Yes | Any |
| `GET` | `/harvests/upcoming` | Batches nearing harvest | Yes | Any |
| `GET` | `/harvests/{harvest_id}` | Single harvest | Yes | Any |
| `POST` | `/harvests` | Record harvest | Yes | Manager+ |
| `PATCH` | `/harvests/{harvest_id}` | Edit harvest | Yes | Manager+ |
| `DELETE` | `/harvests/{harvest_id}` | Void harvest | Yes | Admin |
| `GET` | `/customers` | List buyers | Yes | Any |
| `POST` | `/customers` | Create customer | Yes | Manager+ |
| `PATCH` | `/customers/{customer_id}` | Update customer | Yes | Manager+ |

**Query Parameters:**
| Param | Type |
|-------|------|
| `date_from`, `date_to` | date |
| `batch_id` | uuid |
| `pond_id` | uuid |
| `customer_id` | uuid |
| `harvest_type` | PARTIAL, FULL |
| `search` | buyer name |

---

### 3.8 Reports

| Method | Endpoint | Purpose | Auth | Role |
|--------|----------|---------|------|------|
| `GET` | `/reports` | List generated reports | Yes | Any |
| `GET` | `/reports/{report_id}` | Report metadata | Yes | Any |
| `GET` | `/reports/{report_id}/download` | Download file | Yes | Any |
| `POST` | `/reports/generate` | Generate new report | Yes | Manager+ |
| `DELETE` | `/reports/{report_id}` | Delete report | Yes | Manager+ |

**POST /reports/generate Body:**
| Field | Type | Required |
|-------|------|----------|
| `report_type` | enum | Yes |
| `format` | PDF, EXCEL, CSV | Yes |
| `date_from` | date | No |
| `date_to` | date | No |
| `pond_id` | uuid | No |
| `batch_id` | uuid | No |

---

### 3.9 Notifications

| Method | Endpoint | Purpose | Auth | Role |
|--------|----------|---------|------|------|
| `GET` | `/notifications` | List notifications | Yes | Any |
| `GET` | `/notifications/unread-count` | Unread count | Yes | Any |
| `PATCH` | `/notifications/{id}/read` | Mark as read | Yes | Any |
| `PATCH` | `/notifications/read-all` | Mark all read | Yes | Any |
| `DELETE` | `/notifications/{id}` | Dismiss notification | Yes | Any |

---

### 3.10 Settings

| Method | Endpoint | Purpose | Auth | Role |
|--------|----------|---------|------|------|
| `GET` | `/settings/profile` | User profile | Yes | Any |
| `PATCH` | `/settings/profile` | Update profile | Yes | Any |
| `GET` | `/settings/farm` | Farm settings | Yes | Manager+ |
| `PATCH` | `/settings/farm` | Update farm settings | Yes | Admin |
| `GET` | `/settings/preferences` | User preferences | Yes | Any |
| `PATCH` | `/settings/preferences` | Update preferences | Yes | Any |
| `PATCH` | `/settings/password` | Change password | Yes | Any |
| `GET` | `/settings/team` | List farm members | Yes | Admin |
| `POST` | `/settings/team/invite` | Invite user to farm | Yes | Admin |
| `PATCH` | `/settings/team/{membership_id}` | Update member role | Yes | Admin |
| `DELETE` | `/settings/team/{membership_id}` | Remove member | Yes | Admin |
| `POST` | `/settings/export-data` | Export all farm data | Yes | Admin |
| `POST` | `/settings/reset-farm-data` | Reset operational data | Yes | Admin |

---

### 3.11 Search

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `GET` | `/search` | Global farm-scoped search | Yes |

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search term (min 2 chars) |
| `types` | string[] | ponds, batches, customers, vendors, feed_types |
| `limit` | int | Per-type result cap (default 10) |

---

### 3.12 Files

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `POST` | `/files/upload` | Upload file | Yes |
| `GET` | `/files/{file_id}` | Get file metadata / signed URL | Yes |
| `DELETE` | `/files/{file_id}` | Delete file | Yes |

---

## 4. CRUD Operations

### 4.1 Standard CRUD Pattern

Every resource module follows:

| Operation | Method | URL Pattern | Notes |
|-----------|--------|-------------|-------|
| **Create** | `POST` | `/resources` | Returns 201 + created object |
| **Read (list)** | `GET` | `/resources` | Paginated, filtered |
| **Read (one)** | `GET` | `/resources/{id}` | 404 if not found or wrong farm |
| **Update** | `PATCH` | `/resources/{id}` | Partial update only |
| **Delete** | `DELETE` | `/resources/{id}` | Soft-delete; returns 200 |
| **Restore** | `POST` | `/resources/{id}/restore` | Admin only where applicable |

### 4.2 Bulk Operations

| Endpoint | Purpose | Max Items |
|----------|---------|-----------|
| `POST /feedings/bulk` | Record multiple feedings in one transaction | 50 |
| `PATCH /notifications/read-all` | Bulk state change | N/A |
| `POST /water-records/import-sensor` | Batch sensor import | 1000 readings |

### 4.3 Soft Delete Behavior

| Action | HTTP | Response |
|--------|------|----------|
| Delete | `DELETE /{id}` | `{ "success": true, "message": "Pond deleted.", "data": { "id": "...", "deleted_at": "..." } }` |
| Restore | `POST /{id}/restore` | Restores `deleted_at = NULL` |
| List default | `GET /` | Excludes `deleted_at IS NOT NULL` |
| List with deleted | `GET /?include_deleted=true` | Admin only |

---

## 5. Business Endpoints

### 5.1 Record Feeding

**`POST /api/v1/feedings`**

| Aspect | Specification |
|--------|---------------|
| **Input** | `batch_id`, `feed_type_id`, `quantity_kg`, `fed_at`, `feeding_method`, `weather`, `notes` |
| **Validation** | `quantity_kg > 0`; batch status = ACTIVE; feed type exists; inventory sufficient |
| **Business Rules** | Deduct `feed_inventory` atomically; create `inventory_transaction`; attribute `recorded_by` |
| **Output** | Feeding record + updated inventory balance |
| **Errors** | `409` (insufficient stock), `422` (batch not active), `404` |

---

### 5.2 Record Water Test

**`POST /api/v1/water-records`**

| Aspect | Specification |
|--------|---------------|
| **Input** | `pond_id`, `tested_at`, parameters (temp, pH, DO, ammonia, etc.), `weather`, `notes`, optional `photo_file_id` |
| **Validation** | Pond belongs to farm; realistic parameter ranges; at least one parameter required |
| **Business Rules** | Compute `status` from thresholds; trigger notification if CRITICAL; no batch association |
| **Output** | Water record + computed health status + any triggered alerts |
| **Errors** | `404`, `422` |

---

### 5.3 Record Harvest

**`POST /api/v1/harvests`**

| Aspect | Specification |
|--------|---------------|
| **Input** | `batch_id`, `quantity`, `avg_weight_kg`, `harvest_type`, `customer_id`, `price_per_kg`, `harvested_at`, `notes` |
| **Validation** | `quantity > 0`; `quantity <= batch.current_quantity`; `harvested_at >= stocking_date` |
| **Business Rules** | Reduce `current_quantity`; if FULL and quantity = remaining → close batch, free pond; compute `total_weight_kg` |
| **Output** | Harvest record + updated batch state |
| **Errors** | `409` (exceeds count), `422` (batch closed), `404` |

---

### 5.4 Transfer Fish Batch

**`POST /api/v1/batches/{batch_id}/transfer`**

| Aspect | Specification |
|--------|---------------|
| **Input** | `to_pond_id`, `reason`, `transferred_at` |
| **Validation** | Batch ACTIVE; destination pond ACTIVE/EMPTY; destination capacity check; no active batch on destination (policy) |
| **Business Rules** | Update `fish_batches.pond_id`; create `batch_transfers` record; update pond statuses |
| **Output** | Transfer record + updated batch |
| **Errors** | `409` (capacity/policy conflict), `422`, `404` |

---

### 5.5 Record Mortality

**`POST /api/v1/batches/{batch_id}/mortality`** *(or `POST /api/v1/mortality`)*

| Aspect | Specification |
|--------|---------------|
| **Input** | `quantity`, `cause`, `recorded_at`, `notes` |
| **Validation** | `quantity > 0`; `quantity <= current_quantity`; batch ACTIVE |
| **Business Rules** | Reduce `current_quantity`; evaluate mortality spike threshold; trigger notification if exceeded |
| **Output** | Mortality record + updated batch count + survival rate |
| **Errors** | `409`, `422`, `404` |

---

### 5.6 Restock Feed

**`POST /api/v1/inventory/restock`**

| Aspect | Specification |
|--------|---------------|
| **Input** | `vendor_id`, `feed_type_id`, `quantity_kg`, `unit_price`, `purchase_date`, `invoice_ref` |
| **Validation** | All IDs valid; `quantity_kg > 0`; `unit_price >= 0` |
| **Business Rules** | Create `feed_purchases`; increase `feed_inventory`; append `inventory_transactions` |
| **Output** | Purchase record + updated inventory |
| **Errors** | `404`, `422` |

---

### 5.7 Stock Fish (Activate Batch)

**`POST /api/v1/batches/{batch_id}/stock`**

| Aspect | Specification |
|--------|---------------|
| **Input** | `stocking_date`, `initial_quantity`, `initial_avg_weight_kg`, `pond_id` (if changed) |
| **Validation** | Batch PLANNED; pond capacity; `initial_quantity > 0` |
| **Business Rules** | Set status = ACTIVE; set `current_quantity = initial_quantity`; update pond status = ACTIVE |
| **Output** | Activated batch |
| **Errors** | `409` (pond occupied), `422` |

---

### 5.8 Generate Report

**`POST /api/v1/reports/generate`**

| Aspect | Specification |
|--------|---------------|
| **Input** | `report_type`, `format`, `date_from`, `date_to`, optional scope filters |
| **Validation** | Valid date range; report type supported |
| **Business Rules** | Create report job (status = PENDING); enqueue background worker; aggregate data; store file; update status = READY |
| **Output** | Report metadata (202 Accepted for async) |
| **Errors** | `422`, `429` (rate limit) |

---

## 6. Request/Response Standards

### 6.1 Success Response Envelope

```json
{
  "success": true,
  "message": "Harvest recorded successfully.",
  "data": { }
}
```

**Paginated list:**
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

### 6.2 Error Response Envelope

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

### 6.3 HTTP Status Code Map

| Code | Usage |
|------|-------|
| `200` | Success (GET, PATCH, DELETE, actions) |
| `201` | Resource created (POST) |
| `202` | Accepted (async report generation) |
| `204` | No content (rare; prefer 200 with envelope) |
| `400` | Bad request / invalid token / malformed |
| `401` | Unauthenticated / expired token |
| `403` | Forbidden / insufficient permissions |
| `404` | Resource not found (or not in farm scope) |
| `409` | Business rule conflict |
| `422` | Validation error (Pydantic) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

### 6.4 Standard Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 422 | Pydantic field errors |
| `UNAUTHORIZED` | 401 | Missing/invalid token |
| `FORBIDDEN` | 403 | Insufficient role |
| `NOT_FOUND` | 404 | Resource not found |
| `FARM_NOT_FOUND` | 404 | Farm or membership invalid |
| `POND_NOT_FOUND` | 404 | |
| `BATCH_NOT_FOUND` | 404 | |
| `BATCH_NOT_ACTIVE` | 422 | Operation on inactive batch |
| `HARVEST_EXCEEDS_COUNT` | 409 | |
| `INSUFFICIENT_INVENTORY` | 409 | |
| `POND_CAPACITY_EXCEEDED` | 409 | |
| `POND_NAME_EXISTS` | 409 | Unique constraint |
| `POND_HAS_ACTIVE_BATCH` | 409 | Cannot delete |
| `EDIT_WINDOW_EXPIRED` | 403 | Past edit policy window |
| `EMAIL_EXISTS` | 409 | Registration |
| `RATE_LIMIT_EXCEEDED` | 429 | |
| `INTERNAL_ERROR` | 500 | |

---

## 7. Validation Rules

### 7.1 Global Rules

| Rule | Applies To |
|------|------------|
| UUIDs must be valid v4/v7 format | All `*_id` fields |
| Dates cannot be more than 1 day in future | Operational records |
| `farm_id` scope enforced on all reads/writes | All resources |
| Soft-deleted resources return 404 unless admin | All resources |

### 7.2 Entity-Specific Rules

| Entity | Rule |
|--------|------|
| **Pond** | Name unique per farm; `max_fish_count > 0` if set |
| **Fish Batch** | `initial_quantity > 0`; `current_quantity >= 0`; `expected_harvest_date >= stocking_date` |
| **Feeding** | `quantity_kg > 0`; batch must be ACTIVE |
| **Mortality** | `quantity > 0`; `quantity <= current_quantity` |
| **Harvest** | `quantity > 0`; `quantity <= current_quantity`; `harvested_at >= stocking_date` |
| **Water Record** | `temperature_c` between 0–45; `ph` between 0–14; at least one parameter |
| **Feed Purchase** | `quantity_kg > 0`; `unit_price >= 0` |
| **User** | Email valid + unique; password min 8 chars |
| **Report** | `date_to >= date_from`; range max 366 days |

### 7.3 Pydantic v2 Strategy

- **Request schemas:** `*Create`, `*Update`, `*Filter` per resource
- **Response schemas:** `*Response`, `*ListResponse`, `*DetailResponse`
- **Validators:** `@field_validator`, `@model_validator` for cross-field rules
- **Config:** `model_config = ConfigDict(from_attributes=True)` for ORM mode

---

## 8. Error Handling Strategy

### 8.1 Exception Hierarchy

```
AppException (base)
├── NotFoundException          → 404
├── ForbiddenException         → 403
├── UnauthorizedException      → 401
├── ConflictException          → 409
├── ValidationException        → 422
├── BusinessRuleException      → 409
└── RateLimitException         → 429
```

### 8.2 Global Exception Handler

- Catch all `AppException` → structured JSON envelope
- Catch `RequestValidationError` → 422 with field errors
- Catch unhandled → 500 with generic message (no stack trace in production)
- Log full traceback server-side with `request_id`

### 8.3 Idempotency (Future)

`POST` business operations accept optional `Idempotency-Key` header to prevent duplicate feedings/harvests on mobile retry.

---

## 9. Security Architecture

### 9.1 JWT

| Aspect | Specification |
|--------|---------------|
| Algorithm | RS256 (production) or HS256 (dev) |
| Access expiry | 15 minutes |
| Refresh expiry | 7 days |
| Rotation | Refresh token rotated on each use |
| Revocation | `refresh_tokens.revoked_at` in DB |

### 9.2 Password Hashing

bcrypt, cost 12. Never log or return password fields.

### 9.3 Rate Limiting

| Endpoint Group | Limit |
|----------------|-------|
| Auth (login, register) | 10 req/min per IP |
| Password reset | 3 req/hour per email |
| Report generation | 5 req/hour per user |
| General API | 100 req/min per user |
| File upload | 20 req/hour per user |

*Implementation: Redis (future) or in-memory for MVP.*

### 9.4 CORS

```
Allowed origins: https://app.aquacore.app, http://localhost:3000
Allowed methods: GET, POST, PATCH, DELETE, OPTIONS
Allowed headers: Authorization, Content-Type, X-Farm-Id, X-Request-Id
Credentials: true
```

### 9.5 Input Validation

- Pydantic v2 on all request bodies and query params
- SQLAlchemy parameterized queries only (no raw string interpolation)
- Max request body size: 1 MB JSON; 10 MB multipart

### 9.6 XSS & CSRF

| Threat | Mitigation |
|--------|------------|
| XSS | API returns JSON only; no HTML rendering; sanitize `notes` fields if displayed as HTML client-side |
| CSRF | JWT in `Authorization` header (not cookie) for API — CSRF not applicable; if cookie-based refresh, use `SameSite=Strict` |
| SQL Injection | SQLAlchemy ORM + parameterized queries |
| Mass assignment | Explicit Pydantic schemas; no `**kwargs` to ORM |

### 9.7 Secure Headers (via middleware)

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'none'
```

### 9.8 Row-Level Security

PostgreSQL RLS policy (future hardening):
```sql
-- Conceptual: farm_id must match session variable
farm_id = current_setting('app.current_farm_id')::uuid
```

---

## 10. RBAC Permissions

### 10.1 Role Hierarchy

```
ADMIN  →  full farm control + team + settings + destructive ops
MANAGER →  operational write + reports + inventory + no team delete
WORKER  →  field recording only (feed, water, mortality) + read
```

### 10.2 Permission Matrix

| Permission | Admin | Manager | Worker |
|------------|:-----:|:-------:|:------:|
| **Farms** read/update/delete | ✅ | read/update | read |
| **Ponds** CRUD | ✅ | ✅ | read |
| **Batches** CRUD + stock/transfer/close | ✅ | ✅ | read |
| **Feedings** record | ✅ | ✅ | ✅ |
| **Feedings** edit/void | ✅ | ✅ | ❌ |
| **Water Records** record | ✅ | ✅ | ✅ |
| **Water Records** edit/void | ✅ | ✅ | ❌ |
| **Mortality** record | ✅ | ✅ | ✅ |
| **Harvest** record | ✅ | ✅ | ❌ |
| **Harvest** void | ✅ | ❌ | ❌ |
| **Inventory** restock/adjust | ✅ | restock | read |
| **Vendors/Customers** CRUD | ✅ | ✅ | read |
| **Reports** generate | ✅ | ✅ | ❌ |
| **Reports** download | ✅ | ✅ | ✅ |
| **Notifications** read/dismiss | ✅ | ✅ | ✅ |
| **Settings** farm/team | ✅ | ❌ | ❌ |
| **Settings** profile/prefs | ✅ | ✅ | ✅ |
| **Users** invite/remove | ✅ | ❌ | ❌ |
| **Data export/reset** | ✅ | ❌ | ❌ |

### 10.3 Permission Codes (JWT + DB)

```
ponds:read, ponds:write, ponds:delete
batches:read, batches:write, batches:stock, batches:transfer
feedings:read, feedings:write, feedings:void
water:read, water:write, water:void
harvests:read, harvests:write, harvests:void
inventory:read, inventory:write, inventory:adjust
reports:read, reports:generate
settings:read, settings:write, settings:team, settings:admin
users:invite, users:remove
```

---

## 11. Performance Recommendations

### 11.1 Dashboard — Single Aggregated Endpoint

**`GET /api/v1/dashboard`**

Returns everything in one call:

```json
{
  "success": true,
  "data": {
    "kpis": {
      "total_ponds": 6,
      "active_batches": 4,
      "total_fish": 12400,
      "feedings_due_today": 4,
      "feedings_completed_today": 2,
      "upcoming_harvests": 2,
      "feed_inventory_days_remaining": 11,
      "critical_alerts": 1
    },
    "today_feedings": [ ],
    "upcoming_harvests": [ ],
    "inventory_summary": [ ],
    "recent_activities": [ ],
    "water_alerts": [ ],
    "notifications_unread": 3,
    "weather_summary": { }
  }
}
```

Avoids 8+ round trips from the frontend.

### 11.2 Caching (Redis — Future)

| Cache Key | TTL | Invalidation |
|-----------|-----|--------------|
| `farm:{id}:dashboard` | 60s | On feeding/harvest/mortality write |
| `farm:{id}:inventory` | 120s | On restock/feeding |
| `farm:{id}:ponds:status` | 300s | On water record / batch change |
| `user:{id}:permissions` | 600s | On role change |

### 11.3 Response Compression

Enable GZip middleware for responses > 1 KB.

### 11.4 Background Jobs

| Job | Trigger | Queue |
|-----|---------|-------|
| Report generation | `POST /reports/generate` | Celery / ARQ |
| Email (password reset, invites) | Auth events | Celery |
| Notification dispatch | Business events | Celery |
| Sensor data import processing | `POST /water-records/import-sensor` | Celery |

### 11.5 Async Endpoints

Use `async def` for I/O-bound handlers (DB via async SQLAlchemy, HTTP calls). CPU-bound report rendering in worker processes.

### 11.6 Database Optimization

- Connection pool: min 5, max 20 per worker
- Read replica for report generation queries
- Keyset pagination on fact tables (feedings, water records)
- `selectinload` for pond→batch, batch→species on detail endpoints

---

## 12. Testing Strategy

### 12.1 Test Pyramid

```
        ┌─────────┐
        │  E2E    │  10%  — Full API flows
        ├─────────┤
        │ Integr. │  30%  — API + DB
        ├─────────┤
        │  Unit   │  60%  — Services, validators
        └─────────┘
```

### 12.2 Unit Tests

- Service layer business rules (harvest exceeds count, inventory deduction)
- Pydantic validators
- Permission checker logic
- JWT encode/decode utilities

### 12.3 Integration Tests

- FastAPI `TestClient` + test PostgreSQL database
- Full CRUD per module
- Farm tenancy isolation (user A cannot read user B's ponds)
- Transaction rollback per test (pytest fixture)

### 12.4 API Tests

| Suite | Coverage |
|-------|----------|
| Auth flow | register → login → refresh → logout → me |
| RBAC | Worker denied harvest write; Manager allowed |
| Business ops | feeding deducts inventory; mortality reduces count |
| Pagination | Correct totals, next/previous |
| Error envelopes | 404, 409, 422 structure |
| Soft delete | Delete → 404 on GET → restore → 200 |

### 12.5 Performance Tests

- `locust` or `k6`: 100 concurrent users, dashboard endpoint < 200ms p95
- Feeding bulk POST: 50 records < 2s

### 12.6 Tools

| Tool | Purpose |
|------|---------|
| `pytest` | Test runner |
| `pytest-asyncio` | Async tests |
| `httpx` | Async test client |
| `factory_boy` | Test data factories |
| `faker` | Realistic data |

---

## 13. Documentation Strategy

### 13.1 OpenAPI (Auto-Generated)

FastAPI generates OpenAPI 3.1 spec at `/api/v1/openapi.json`.

### 13.2 Documentation UIs

| UI | URL | Audience |
|----|-----|----------|
| **Swagger UI** | `/api/v1/docs` | Developers (try-it-out) |
| **ReDoc** | `/api/v1/redoc` | Product / stakeholders (readable) |

### 13.3 Documentation Standards

Every endpoint must include:
- `summary` and `description`
- Tag grouping by module
- Request/response `example` in Pydantic schema
- Documented error responses (`responses={404: {...}, 409: {...}}`)
- Deprecation headers on sunset endpoints

### 13.4 Postman Collection

Auto-export OpenAPI → Postman collection in CI for QA team.

### 13.5 Changelog

`/api/v1/changelog` markdown document versioned with API releases.

---

## 14. API Design Rationale

### 14.1 Why REST over GraphQL

- Farm management clients have predictable data needs per screen
- Dashboard aggregation endpoint solves N+1 without GraphQL complexity
- REST aligns with mobile offline sync (resource-based)
- Simpler caching, RBAC per route, and audit logging

### 14.2 Why PATCH over PUT

Partial updates match field-level UI edits (settings, pond metadata). PUT reserved for full replacement if needed later.

### 14.3 Why Business Endpoints over Generic CRUD

Operations like **harvest**, **transfer**, and **restock** involve multi-table transactions and business rules. Dedicated action endpoints (`POST /batches/{id}/transfer`) are clearer than overloading `PATCH` with magic status fields.

### 14.4 Why Farm Header + JWT Claim

Multi-farm operators need explicit farm context. `X-Farm-Id` header with JWT `farm_id` claim provides defense-in-depth against cross-tenant data leaks.

### 14.5 Why Async Report Generation

Report PDF rendering is CPU/IO intensive. `202 Accepted` + background worker prevents request timeouts and allows retry.

### 14.6 Why Consistent Envelope

Mobile and web clients share one error-parsing path. `error_code` enables i18n and programmatic handling without parsing HTTP status alone.

### 14.7 Versioning Strategy

| Version | Policy |
|---------|--------|
| `/api/v1/` | Current; all new features here until breaking change |
| `/api/v2/` | Introduced when response shape or auth flow breaks |
| Deprecation | `Sunset` header + 6-month overlap; document in changelog |
| Non-breaking additions | New fields in response = OK in v1; new endpoints = OK |

### 14.8 File Upload Strategy

| Aspect | Specification |
|--------|---------------|
| **Endpoint** | `POST /files/upload` with `multipart/form-data` |
| **Fields** | `file` (binary), `purpose` (enum: PROFILE, FARM_LOGO, WATER_TEST, HARVEST) |
| **Formats** | JPEG, PNG, WebP; max 5 MB images |
| **Validation** | MIME type check + magic bytes; virus scan (future) |
| **Storage** | S3-compatible object storage; DB stores `file_id`, `url`, `purpose`, `farm_id`, `uploaded_by` |
| **Access** | Signed URLs with 1-hour expiry |

### 14.9 Pagination Standard

```
GET /api/v1/ponds?page=2&limit=20&sort=name&order=asc
```

| Field | Type | Description |
|-------|------|-------------|
| `page` | int | 1-indexed, default 1 |
| `limit` | int | Default 20, max 100 |
| `total` | int | Total matching records |
| `total_pages` | int | `ceil(total / limit)` |
| `has_next` | bool | `page < total_pages` |
| `has_previous` | bool | `page > 1` |

Fact tables (feedings, water records) also support **cursor pagination**:

```
GET /api/v1/feedings?cursor=<fed_at>|<id>&limit=50
```

### 14.10 Pre-Implementation Checklist

- [ ] OpenAPI tag structure approved
- [ ] Error code registry finalized
- [ ] RBAC permission matrix signed off by product
- [ ] JWT key management strategy (RS256 key rotation)
- [ ] Background job queue selected (ARQ vs Celery)
- [ ] Object storage bucket provisioned
- [ ] Rate limiting store decided (Redis vs in-memory MVP)
- [ ] CI pipeline: lint → unit tests → integration tests → OpenAPI diff check
- [ ] Postman collection generation in CI

---

**This specification is ready for FastAPI router implementation, Pydantic schema authoring, and SQLAlchemy service layer development — with full alignment to Phase 1 business domain and Phase 2 database architecture.**