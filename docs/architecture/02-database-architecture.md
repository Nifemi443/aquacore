# Database Architecture & ERD

> **Phase:** 2 — Database Architecture  
> **Status:** Approved — Pre-Implementation  
> **Project:** PondDesk Fish Farm Management Platform

Production-ready PostgreSQL relational architecture. Normalized, multi-tenant, audit-ready.

## Related Documents

- [Domain Model](./01-domain-model.md) — Phase 1 business entities
- [API Contract](./03-api-contract.md) — Phase 3 endpoints mapped to tables
- [Backend Architecture](./04-backend-architecture.md) — Phase 4 repository layer
- [Database Guide](../database/README.md) — Quick reference index
- [ERD Diagram](../diagrams/database-schema-layers.md) — Schema layer diagram

---

## Table of Contents

  - [1. Database Design Overview](#1-database-design-overview)
    - [1.1 Purpose](#11-purpose)
    - [1.2 Architectural Goals](#12-architectural-goals)
    - [1.3 Module-to-Data Mapping](#13-module-to-data-mapping)
    - [1.4 Schema Layers](#14-schema-layers)
    - [1.5 Critical Domain Correction](#15-critical-domain-correction)
  - [2. Entity List](#2-entity-list)
  - [3. Table Specifications](#3-table-specifications)
    - [3.1 Identity & Authentication](#31-identity-authentication)
    - [3.2 Tenancy & Configuration](#32-tenancy-configuration)
    - [3.3 Reference Catalog](#33-reference-catalog)
    - [3.4 Production](#34-production)
    - [3.5 Inventory](#35-inventory)
    - [3.6 Insights](#36-insights)
  - [4. Primary Keys](#4-primary-keys)
    - [UUID vs BIGINT](#uuid-vs-bigint)
    - [Final Recommendation](#final-recommendation)
  - [5. Foreign Keys](#5-foreign-keys)
    - [Complete FK Map](#complete-fk-map)
  - [6. Relationships](#6-relationships)
    - [One-to-One](#one-to-one)
    - [One-to-Many](#one-to-many)
    - [Many-to-Many](#many-to-many)
  - [7. Constraints](#7-constraints)
    - [CHECK Constraints](#check-constraints)
    - [UNIQUE Constraints](#unique-constraints)
    - [Partial Unique (Business Policy)](#partial-unique-business-policy)
    - [Application-Layer Constraints (Transactional)](#application-layer-constraints-transactional)
  - [8. Enums](#8-enums)
  - [9. Index Strategy](#9-index-strategy)
    - [Tier 1 — Tenancy (Every List Query)](#tier-1-tenancy-every-list-query)
    - [Tier 2 — Entity History](#tier-2-entity-history)
    - [Tier 3 — Reporting & Dashboard](#tier-3-reporting-dashboard)
    - [Tier 4 — Auth & Membership](#tier-4-auth-membership)
    - [Tier 5 — Partial Indexes](#tier-5-partial-indexes)
  - [10. Audit Strategy](#10-audit-strategy)
    - [Standard Column Matrix](#standard-column-matrix)
    - [Rationale](#rationale)
    - [`updated_at` Maintenance](#updated-at-maintenance)
  - [11. Soft Delete Strategy](#11-soft-delete-strategy)
    - [Soft Delete (`deleted_at`) — YES](#soft-delete-deleted-at-yes)
    - [Never Delete — YES](#never-delete-yes)
    - [Application Contract](#application-contract)
  - [12. Performance Recommendations](#12-performance-recommendations)
    - [12.1 Partitioning Strategy](#121-partitioning-strategy)
    - [12.2 Archiving Strategy](#122-archiving-strategy)
    - [12.3 Query Optimization](#123-query-optimization)
    - [12.4 Large Table Handling](#124-large-table-handling)
    - [12.5 Pagination Strategy](#125-pagination-strategy)
  - [13. Future Scalability](#13-future-scalability)
  - [14. Complete Entity Relationship Diagram](#14-complete-entity-relationship-diagram)
  - [15. Architecture Rationale](#15-architecture-rationale)
    - [15.1 Why This Design Works](#151-why-this-design-works)
    - [15.2 Reporting Support Matrix](#152-reporting-support-matrix)
    - [15.3 Cascade Rules Summary](#153-cascade-rules-summary)
    - [15.4 Pre-Implementation Checklist](#154-pre-implementation-checklist)

---


## 1. Database Design Overview

### 1.1 Purpose

This document translates the Phase 1 business domain into a **production-ready PostgreSQL schema** that supports all current system modules while remaining extensible for future commercial, IoT, and AI capabilities.

### 1.2 Architectural Goals

| Goal | Approach |
|------|----------|
| **3NF normalization** | Separate reference, master, and transactional data; no duplicated facts |
| **Multi-tenancy** | `farm_id` as tenancy boundary on all operational data |
| **Referential integrity** | Explicit FK constraints; RESTRICT on facts, soft-delete on masters |
| **Query performance** | Denormalized `farm_id` on high-volume fact tables; composite indexes aligned to module screens |
| **Auditability** | Immutable ledgers, `recorded_by`, append-only `audit_log` |
| **Cloud scale** | UUID PKs, time-based partitioning path, RLS-ready tenancy |

### 1.3 Module-to-Data Mapping

| Module | Primary Tables |
|--------|----------------|
| **Authentication** | `users`, `roles`, `farm_memberships`, `refresh_tokens` |
| **Dashboard** | Read aggregates from `fish_batches`, `feeding_records`, `water_records`, `feed_inventory`, `notifications` |
| **Farms** | `farms`, `farm_settings` |
| **Ponds** | `ponds` |
| **Fish Batches** | `fish_batches`, `batch_transfers`, `weight_samples`, `mortality_records` |
| **Daily Feedings** | `feeding_records`, `feed_types`, `feed_inventory` |
| **Feed Inventory** | `feed_inventory`, `feed_purchases`, `inventory_transactions`, `vendors` |
| **Water Records** | `water_records` (pond-scoped) |
| **Harvest** | `harvest_records`, `customers` |
| **Reports** | `reports` |
| **Notifications** | `notifications`, `notification_preferences` |
| **Settings** | `farm_settings`, `user_preferences` |

### 1.4 Schema Layers

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 1 — Identity & Tenancy                           │
│  users, roles, farm_memberships, refresh_tokens         │
├─────────────────────────────────────────────────────────┤
│  LAYER 2 — Configuration & Reference                    │
│  farms, farm_settings, user_preferences, species,         │
│  feed_types, feed_categories, vendors, customers          │
├─────────────────────────────────────────────────────────┤
│  LAYER 3 — Production Master Data                       │
│  ponds, fish_batches, batch_transfers                     │
├─────────────────────────────────────────────────────────┤
│  LAYER 4 — Operational Facts (high volume)              │
│  feeding_records, water_records, mortality_records,     │
│  weight_samples, harvest_records, feed_purchases        │
├─────────────────────────────────────────────────────────┤
│  LAYER 5 — Inventory & Ledger                           │
│  feed_inventory, inventory_transactions                   │
├─────────────────────────────────────────────────────────┤
│  LAYER 6 — Insights & Comms                             │
│  reports, notifications, audit_log                        │
└─────────────────────────────────────────────────────────┘
```

### 1.5 Critical Domain Correction

**Water Records belong to Ponds, not Fish Batches.**

Water is a shared environmental property of a physical enclosure. Multiple batches may share a pond (polyculture, future). Modeling water under batches would duplicate readings and break environmental monitoring semantics.

---

## 2. Entity List

| # | Entity | Business Responsibility | Key Relationships |
|---|--------|----------------------|---------------------|
| 1 | `users` | Authenticated operators | → `farm_memberships` |
| 2 | `roles` | Permission bundles | ← `farm_memberships` |
| 3 | `farm_memberships` | User↔Farm access with role | `users` + `farms` + `roles` |
| 4 | `refresh_tokens` | Session persistence | → `users` |
| 5 | `farms` | Tenant root | Parent of nearly all entities |
| 6 | `farm_settings` | Farm policies & thresholds | 1:1 `farms` |
| 7 | `user_preferences` | Per-user UI/notification prefs | 1:1 `users` |
| 8 | `species` | Biological catalog | ← `fish_batches` |
| 9 | `feed_categories` | Feed classification | ← `feed_types` |
| 10 | `feed_types` | Feed product catalog | ← `feed_inventory`, `feeding_records` |
| 11 | `vendors` | Suppliers | ← `feed_purchases`, `fish_batches` |
| 12 | `customers` | Fish buyers | ← `harvest_records` |
| 13 | `ponds` | Physical production units | ← `fish_batches`, `water_records` |
| 14 | `fish_batches` | Grow-out cohort | ← feedings, mortality, harvest |
| 15 | `batch_transfers` | Pond move history | → `fish_batches`, `ponds` |
| 16 | `feeding_records` | Daily feed events | → `fish_batches` |
| 17 | `mortality_records` | Death loss events | → `fish_batches` |
| 18 | `weight_samples` | Growth measurements | → `fish_batches` |
| 19 | `water_records` | Pond water quality | → `ponds` |
| 20 | `feed_inventory` | Current stock balance | → `feed_types` |
| 21 | `feed_purchases` | Feed acquisition | → `vendors`, `feed_types` |
| 22 | `inventory_transactions` | Immutable stock ledger | → `feed_inventory` |
| 23 | `harvest_records` | Fish removal events | → `fish_batches` |
| 24 | `reports` | Generated document metadata | → `farms` |
| 25 | `notifications` | Alerts & reminders | → `farms`, `users` |
| 26 | `audit_log` | Compliance trail | Polymorphic reference |

**Future entities (reserved, not Phase 2 tables):** `sensor_devices`, `sensor_readings`, `sales`, `expenses`, `ai_recommendations`, `sync_events`, `employees`

---

## 3. Table Specifications

---

### 3.1 Identity & Authentication

#### `users`
**Description:** Platform identity for all human operators.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Global identity |
| `email` | `varchar(255)` | NO | YES | — | Login credential |
| `password_hash` | `varchar(255)` | NO | — | — | Secure auth |
| `full_name` | `varchar(200)` | NO | — | — | Display & audit |
| `phone` | `varchar(30)` | YES | — | — | Field contact |
| `is_active` | `boolean` | NO | — | `true` | Account control |
| `email_verified_at` | `timestamptz` | YES | — | — | Onboarding |
| `last_login_at` | `timestamptz` | YES | — | — | Security monitoring |
| `created_at` | `timestamptz` | NO | — | `now()` | Audit |
| `updated_at` | `timestamptz` | NO | — | `now()` | Audit |
| `deleted_at` | `timestamptz` | YES | — | — | Soft delete |

**PK:** `id`

---

#### `roles`
**Description:** System-wide role catalog with JSON permission sets.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Role identity |
| `name` | `varchar(50)` | NO | YES | — | ADMIN, MANAGER, WORKER |
| `description` | `text` | YES | — | — | Documentation |
| `permissions` | `jsonb` | NO | — | `'[]'` | Fine-grained ACL |
| `created_at` | `timestamptz` | NO | — | `now()` | Audit |

**PK:** `id`

---

#### `farm_memberships`
**Description:** Junction assigning users to farms with roles. Enables multi-farm operators.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Membership ID |
| `farm_id` | `uuid` | NO | FK | — | Tenancy scope |
| `user_id` | `uuid` | NO | FK | — | Operator |
| `role_id` | `uuid` | NO | FK | — | Permissions |
| `is_active` | `boolean` | NO | — | `true` | Revoke without delete |
| `joined_at` | `timestamptz` | NO | — | `now()` | Onboarding audit |
| `created_at` | `timestamptz` | NO | — | `now()` | Audit |
| `deleted_at` | `timestamptz` | YES | — | — | Soft revoke |

**PK:** `id`  
**FK:** `farm_id` → `farms.id`, `user_id` → `users.id`, `role_id` → `roles.id`  
**Unique:** `(farm_id, user_id)` WHERE `deleted_at IS NULL`

---

#### `refresh_tokens`
**Description:** Persistent auth sessions for JWT refresh flow.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Token ID |
| `user_id` | `uuid` | NO | FK | — | Owner |
| `token_hash` | `varchar(255)` | NO | YES | — | Stored hashed |
| `expires_at` | `timestamptz` | NO | — | — | Expiry enforcement |
| `revoked_at` | `timestamptz` | YES | — | — | Logout/revoke |
| `created_at` | `timestamptz` | NO | — | `now()` | Audit |

**PK:** `id`  
**FK:** `user_id` → `users.id`

---

### 3.2 Tenancy & Configuration

#### `farms`
**Description:** Root tenant — a commercial fish farming operation.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Tenant ID |
| `name` | `varchar(200)` | NO | — | — | Operating name |
| `slug` | `varchar(100)` | NO | YES | — | URL routing |
| `location` | `varchar(500)` | YES | — | — | Geographic context |
| `timezone` | `varchar(64)` | NO | — | `'Africa/Lagos'` | Local scheduling |
| `measurement_unit` | `measurement_unit_enum` | NO | — | `'METRIC'` | Unit preference |
| `pond_count` | `smallint` | YES | — | — | Cached stat (optional; derivable) |
| `farm_size_hectares` | `numeric(8,2)` | YES | — | — | Farm profile |
| `license_number` | `varchar(100)` | YES | — | — | Regulatory |
| `is_active` | `boolean` | NO | — | `true` | Operational flag |
| `created_at` | `timestamptz` | NO | — | `now()` | Audit |
| `updated_at` | `timestamptz` | NO | — | `now()` | Audit |
| `deleted_at` | `timestamptz` | YES | — | — | Soft delete |

**PK:** `id`

---

#### `farm_settings`
**Description:** 1:1 farm operational policies and alert configuration.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Settings ID |
| `farm_id` | `uuid` | NO | FK, UNIQUE | — | 1:1 with farm |
| `max_batches_per_pond` | `smallint` | NO | — | `1` | Stocking policy |
| `feeding_edit_window_hours` | `smallint` | NO | — | `24` | Data integrity |
| `mortality_alert_threshold_pct` | `numeric(5,2)` | NO | — | `5.00` | Alert trigger |
| `water_test_frequency_hours` | `smallint` | NO | — | `24` | Compliance cadence |
| `alert_thresholds` | `jsonb` | NO | — | `'{}'` | pH, DO, NH₃ limits |
| `notification_defaults` | `jsonb` | NO | — | `'{}'` | Farm-wide toggles |
| `updated_at` | `timestamptz` | NO | — | `now()` | Sync tracking |

**PK:** `id`  
**FK:** `farm_id` → `farms.id`

---

#### `user_preferences`
**Description:** 1:1 per-user display and notification preferences.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Pref ID |
| `user_id` | `uuid` | NO | FK, UNIQUE | — | 1:1 with user |
| `theme` | `theme_enum` | NO | — | `'LIGHT'` | UI preference |
| `language` | `varchar(10)` | NO | — | `'en'` | Locale |
| `date_format` | `varchar(20)` | NO | — | `'DD/MM/YYYY'` | Display |
| `timezone_override` | `varchar(64)` | YES | — | — | User TZ override |
| `notification_prefs` | `jsonb` | NO | — | `'{}'` | Per-user toggles |
| `updated_at` | `timestamptz` | NO | — | `now()` | Sync |

**PK:** `id`  
**FK:** `user_id` → `users.id`

---

### 3.3 Reference Catalog

#### `species`
**Description:** Fish species catalog (global system entries + farm-custom).

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Species ID |
| `farm_id` | `uuid` | YES | FK | — | NULL = system-wide |
| `name` | `varchar(100)` | NO | — | — | Common name |
| `scientific_name` | `varchar(150)` | YES | — | — | Precision |
| `optimal_temp_min` | `numeric(4,1)` | YES | — | — | Threshold eval |
| `optimal_temp_max` | `numeric(4,1)` | YES | — | — | Threshold eval |
| `optimal_ph_min` | `numeric(3,1)` | YES | — | — | Threshold eval |
| `optimal_ph_max` | `numeric(3,1)` | YES | — | — | Threshold eval |
| `is_active` | `boolean` | NO | — | `true` | Soft deactivation |
| `created_at` | `timestamptz` | NO | — | `now()` | Audit |

**PK:** `id`  
**FK:** `farm_id` → `farms.id` (nullable)

---

#### `feed_categories`
**Description:** Classification layer above feed types (starter, grower, finisher).

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Category ID |
| `farm_id` | `uuid` | NO | FK | — | Tenant scope |
| `name` | `varchar(100)` | NO | — | — | Category label |
| `description` | `text` | YES | — | — | Guidance |
| `is_active` | `boolean` | NO | — | `true` | Lifecycle |
| `created_at` | `timestamptz` | NO | — | `now()` | Audit |

**PK:** `id`  
**Unique:** `(farm_id, name)` WHERE `is_active = true`

---

#### `feed_types`
**Description:** Specific feed products used in feeding and inventory.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Feed type ID |
| `farm_id` | `uuid` | NO | FK | — | Tenant |
| `feed_category_id` | `uuid` | YES | FK | — | Classification |
| `name` | `varchar(150)` | NO | — | — | Product name |
| `brand` | `varchar(100)` | YES | — | — | Manufacturer |
| `pellet_size_mm` | `numeric(4,1)` | YES | — | — | Size selection |
| `protein_pct` | `numeric(4,1)` | YES | — | — | Nutrition |
| `unit` | `varchar(20)` | NO | — | `'kg'` | Measurement |
| `is_active` | `boolean` | NO | — | `true` | Catalog control |
| `created_at` | `timestamptz` | NO | — | `now()` | Audit |

**PK:** `id`  
**FK:** `farm_id` → `farms.id`, `feed_category_id` → `feed_categories.id`

---

#### `vendors`
**Description:** External suppliers (fingerlings, feed, chemicals, equipment).

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Vendor ID |
| `farm_id` | `uuid` | NO | FK | — | Tenant |
| `name` | `varchar(200)` | NO | — | — | Supplier name |
| `category` | `vendor_category_enum` | NO | — | — | Supplier type |
| `contact_name` | `varchar(150)` | YES | — | — | Relationship |
| `phone` | `varchar(30)` | YES | — | — | Contact |
| `email` | `varchar(255)` | YES | — | — | Contact |
| `payment_terms` | `varchar(100)` | YES | — | — | Commercial |
| `notes` | `text` | YES | — | — | History |
| `is_active` | `boolean` | NO | — | `true` | Lifecycle |
| `created_at` | `timestamptz` | NO | — | `now()` | Audit |
| `deleted_at` | `timestamptz` | YES | — | — | Soft delete |

**PK:** `id`

---

#### `customers`
**Description:** Buyers of harvested fish.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Customer ID |
| `farm_id` | `uuid` | NO | FK | — | Tenant |
| `name` | `varchar(200)` | NO | — | — | Buyer identity |
| `contact_name` | `varchar(150)` | YES | — | — | Relationship |
| `phone` | `varchar(30)` | YES | — | — | Contact |
| `email` | `varchar(255)` | YES | — | — | Contact |
| `location` | `varchar(300)` | YES | — | — | Logistics |
| `payment_terms` | `varchar(100)` | YES | — | — | Commercial |
| `notes` | `text` | YES | — | — | History |
| `is_active` | `boolean` | NO | — | `true` | Lifecycle |
| `created_at` | `timestamptz` | NO | — | `now()` | Audit |
| `deleted_at` | `timestamptz` | YES | — | — | Soft delete |

**PK:** `id`

---

### 3.4 Production

#### `ponds`
**Description:** Physical enclosure where fish are cultivated.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Pond ID |
| `farm_id` | `uuid` | NO | FK | — | Tenant |
| `name` | `varchar(100)` | NO | — | — | Human identifier |
| `pond_type` | `pond_type_enum` | NO | — | `'EARTHEN'` | Infrastructure class |
| `status` | `pond_status_enum` | NO | — | `'EMPTY'` | Operational state |
| `water_source` | `varchar(100)` | YES | — | — | Borehole, river, etc. |
| `volume_m3` | `numeric(10,2)` | YES | — | — | Capacity planning |
| `surface_area_m2` | `numeric(10,2)` | YES | — | — | Density calc |
| `max_depth_m` | `numeric(4,2)` | YES | — | — | Profile |
| `max_fish_count` | `integer` | YES | — | — | Stocking limit |
| `max_biomass_kg` | `numeric(10,2)` | YES | — | — | Biomass limit |
| `has_aeration` | `boolean` | NO | — | `false` | Equipment flag |
| `has_sensors` | `boolean` | NO | — | `false` | IoT readiness |
| `notes` | `text` | YES | — | — | Operations |
| `created_at` | `timestamptz` | NO | — | `now()` | Audit |
| `updated_at` | `timestamptz` | NO | — | `now()` | Audit |
| `created_by` | `uuid` | YES | FK | — | Attribution |
| `deleted_at` | `timestamptz` | YES | — | — | Soft delete |

**PK:** `id`  
**FK:** `farm_id` → `farms.id`, `created_by` → `users.id`  
**Unique:** `(farm_id, name)` WHERE `deleted_at IS NULL`

---

#### `fish_batches`
**Description:** Central production entity — a cohort from stocking to closure.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Batch ID |
| `farm_id` | `uuid` | NO | FK | — | Denorm for fast tenancy queries |
| `pond_id` | `uuid` | NO | FK | — | Current location |
| `species_id` | `uuid` | NO | FK | — | Biological type |
| `vendor_id` | `uuid` | YES | FK | — | Fingerling source |
| `batch_code` | `varchar(50)` | NO | — | — | Human-readable ID |
| `status` | `batch_status_enum` | NO | — | `'PLANNED'` | Lifecycle state |
| `stocking_date` | `date` | YES | — | — | Cycle start |
| `expected_harvest_date` | `date` | YES | — | — | Planning |
| `actual_harvest_date` | `date` | YES | — | — | Closure tracking |
| `initial_quantity` | `integer` | NO | — | — | Baseline population |
| `current_quantity` | `integer` | NO | — | — | Live count (transactional) |
| `initial_avg_weight_kg` | `numeric(8,4)` | YES | — | — | Stocking size |
| `current_avg_weight_kg` | `numeric(8,4)` | YES | — | — | Latest estimate |
| `stocking_cost` | `numeric(12,2)` | YES | — | — | Unit economics |
| `notes` | `text` | YES | — | — | Operations |
| `created_at` | `timestamptz` | NO | — | `now()` | Audit |
| `updated_at` | `timestamptz` | NO | — | `now()` | Audit |
| `created_by` | `uuid` | YES | FK | — | Attribution |
| `deleted_at` | `timestamptz` | YES | — | — | Soft delete |

**PK:** `id`  
**FK:** `farm_id`, `pond_id`, `species_id`, `vendor_id`, `created_by`  
**Unique:** `(farm_id, batch_code)` WHERE `deleted_at IS NULL`

**Why `current_quantity` is stored:** High-frequency read/write operational state updated atomically by mortality and harvest transactions — not a report aggregate.

---

#### `batch_transfers`
**Description:** Immutable record of batch movement between ponds.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Transfer ID |
| `fish_batch_id` | `uuid` | NO | FK | — | Batch moved |
| `from_pond_id` | `uuid` | NO | FK | — | Origin |
| `to_pond_id` | `uuid` | NO | FK | — | Destination |
| `transferred_at` | `timestamptz` | NO | — | `now()` | When |
| `quantity_at_transfer` | `integer` | NO | — | — | Population snapshot |
| `reason` | `text` | YES | — | — | Context |
| `recorded_by` | `uuid` | NO | FK | — | Attribution |

**PK:** `id` — **Never soft-deleted** (immutable history)

---

#### `feeding_records`
**Description:** Single feeding event for a batch.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Record ID |
| `farm_id` | `uuid` | NO | FK | — | Tenancy denorm |
| `fish_batch_id` | `uuid` | NO | FK | — | Fed cohort |
| `pond_id` | `uuid` | NO | FK | — | Location denorm |
| `feed_type_id` | `uuid` | NO | FK | — | Product used |
| `feeding_date` | `date` | NO | — | — | Daily grouping |
| `fed_at` | `timestamptz` | NO | — | — | Exact time |
| `quantity_kg` | `numeric(10,3)` | NO | — | — | Amount fed |
| `status` | `feeding_status_enum` | NO | — | `'COMPLETED'` | Completed/scheduled/missed |
| `feeding_method` | `feeding_method_enum` | NO | — | `'MANUAL'` | Manual/auto |
| `weather` | `varchar(50)` | YES | — | — | Context |
| `notes` | `text` | YES | — | — | Field notes |
| `recorded_by` | `uuid` | NO | FK | — | Attribution |
| `created_at` | `timestamptz` | NO | — | `now()` | Audit |
| `updated_at` | `timestamptz` | NO | — | `now()` | Edit tracking |
| `deleted_at` | `timestamptz` | YES | — | — | Void |

**PK:** `id`

---

#### `mortality_records`
**Description:** Fish death loss for a batch.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Record ID |
| `farm_id` | `uuid` | NO | FK | — | Tenancy |
| `fish_batch_id` | `uuid` | NO | FK | — | Affected batch |
| `pond_id` | `uuid` | NO | FK | — | Location |
| `recorded_at` | `timestamptz` | NO | — | — | When observed |
| `quantity` | `integer` | NO | — | — | Fish lost |
| `cause` | `mortality_cause_enum` | NO | — | `'UNKNOWN'` | Root cause |
| `notes` | `text` | YES | — | — | Investigation |
| `recorded_by` | `uuid` | NO | FK | — | Attribution |
| `created_at` | `timestamptz` | NO | — | `now()` | Audit |
| `deleted_at` | `timestamptz` | YES | — | — | Void |

**PK:** `id`

---

#### `weight_samples`
**Description:** Periodic biomass sampling for growth curves.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Sample ID |
| `fish_batch_id` | `uuid` | NO | FK | — | Batch measured |
| `sampled_at` | `timestamptz` | NO | — | — | When |
| `sample_size` | `integer` | YES | — | — | Fish weighed |
| `avg_weight_kg` | `numeric(8,4)` | NO | — | — | Growth metric |
| `min_weight_kg` | `numeric(8,4)` | YES | — | — | Distribution |
| `max_weight_kg` | `numeric(8,4)` | YES | — | — | Distribution |
| `recorded_by` | `uuid` | NO | FK | — | Attribution |
| `created_at` | `timestamptz` | NO | — | `now()` | Audit |

**PK:** `id`

---

#### `water_records`
**Description:** Pond water quality test — environmental, not batch-specific.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Record ID |
| `farm_id` | `uuid` | NO | FK | — | Tenancy |
| `pond_id` | `uuid` | NO | FK | — | **Pond only** |
| `water_test_date` | `date` | NO | — | — | Daily reports |
| `tested_at` | `timestamptz` | NO | — | — | Exact time |
| `temperature_c` | `numeric(4,1)` | YES | — | — | Core param |
| `ph` | `numeric(3,2)` | YES | — | — | Core param |
| `dissolved_oxygen_mgl` | `numeric(4,2)` | YES | — | — | Critical param |
| `ammonia_ppm` | `numeric(6,4)` | YES | — | — | Toxicity |
| `nitrite_ppm` | `numeric(6,4)` | YES | — | — | Toxicity |
| `nitrate_ppm` | `numeric(6,4)` | YES | — | — | Completeness |
| `turbidity_ntu` | `numeric(6,2)` | YES | — | — | Clarity |
| `water_level_pct` | `smallint` | YES | — | — | Volume indicator |
| `water_depth_m` | `numeric(4,2)` | YES | — | — | Physical |
| `water_color` | `varchar(50)` | YES | — | — | Visual |
| `weather` | `varchar(50)` | YES | — | — | Context |
| `status` | `water_status_enum` | NO | — | `'HEALTHY'` | Interpreted health |
| `source` | `record_source_enum` | NO | — | `'MANUAL'` | Manual/IoT |
| `notes` | `text` | YES | — | — | Observations |
| `photo_url` | `varchar(500)` | YES | — | — | Evidence |
| `recorded_by` | `uuid` | YES | FK | — | NULL for sensors |
| `created_at` | `timestamptz` | NO | — | `now()` | Audit |
| `updated_at` | `timestamptz` | NO | — | `now()` | Edit |
| `deleted_at` | `timestamptz` | YES | — | — | Void |

**PK:** `id`

---

#### `harvest_records`
**Description:** Fish removal from a batch (partial or full).

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Harvest ID |
| `farm_id` | `uuid` | NO | FK | — | Tenancy |
| `fish_batch_id` | `uuid` | NO | FK | — | Source batch |
| `pond_id` | `uuid` | NO | FK | — | Location |
| `customer_id` | `uuid` | YES | FK | — | Buyer |
| `harvest_date` | `date` | NO | — | — | Reporting |
| `harvested_at` | `timestamptz` | NO | — | — | Exact time |
| `harvest_type` | `harvest_type_enum` | NO | — | — | Partial/full |
| `status` | `harvest_status_enum` | NO | — | `'COMPLETED'` | Workflow |
| `quantity` | `integer` | NO | — | — | Fish removed |
| `avg_weight_kg` | `numeric(8,4)` | NO | — | — | Size |
| `total_weight_kg` | `numeric(12,3)` | NO | — | — | Yield |
| `price_per_kg` | `numeric(12,2)` | YES | — | — | Revenue |
| `notes` | `text` | YES | — | — | Context |
| `recorded_by` | `uuid` | NO | FK | — | Attribution |
| `created_at` | `timestamptz` | NO | — | `now()` | Audit |
| `deleted_at` | `timestamptz` | YES | — | — | Void |

**PK:** `id`

---

### 3.5 Inventory

#### `feed_inventory`
**Description:** One row per feed type per farm — current stock balance.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Inventory ID |
| `farm_id` | `uuid` | NO | FK | — | Tenant |
| `feed_type_id` | `uuid` | NO | FK | — | Product |
| `quantity_on_hand` | `numeric(12,3)` | NO | — | `0` | Current balance |
| `reorder_level` | `numeric(10,3)` | YES | — | — | Alert threshold |
| `storage_location` | `varchar(100)` | YES | — | — | Physical |
| `last_restocked_at` | `timestamptz` | YES | — | — | Replenishment |
| `updated_at` | `timestamptz` | NO | — | `now()` | Sync |

**PK:** `id`  
**Unique:** `(farm_id, feed_type_id)`

---

#### `feed_purchases`
**Description:** Feed acquisition event.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Purchase ID |
| `farm_id` | `uuid` | NO | FK | — | Tenant |
| `vendor_id` | `uuid` | NO | FK | — | Supplier |
| `feed_type_id` | `uuid` | NO | FK | — | Product |
| `purchase_date` | `date` | NO | — | — | Reporting |
| `quantity_kg` | `numeric(12,3)` | NO | — | — | Volume |
| `unit_price` | `numeric(12,2)` | NO | — | — | Cost |
| `total_cost` | `numeric(12,2)` | NO | — | — | Total |
| `invoice_ref` | `varchar(100)` | YES | — | — | Reconciliation |
| `payment_status` | `payment_status_enum` | NO | — | `'PENDING'` | Finance |
| `recorded_by` | `uuid` | NO | FK | — | Attribution |
| `created_at` | `timestamptz` | NO | — | `now()` | Audit |

**PK:** `id`

---

#### `inventory_transactions`
**Description:** Immutable ledger of all stock movements.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Tx ID |
| `feed_inventory_id` | `uuid` | NO | FK | — | Stock line |
| `transaction_type` | `inventory_tx_enum` | NO | — | — | PURCHASE/FEEDING/etc. |
| `quantity_delta` | `numeric(12,3)` | NO | — | — | +/- movement |
| `reference_type` | `varchar(50)` | YES | — | — | Source table |
| `reference_id` | `uuid` | YES | — | — | Source record |
| `balance_after` | `numeric(12,3)` | NO | — | — | Reconciliation |
| `recorded_by` | `uuid` | NO | FK | — | Attribution |
| `created_at` | `timestamptz` | NO | — | `now()` | Immutable timestamp |

**PK:** `id` — **Append-only, never deleted**

---

### 3.6 Insights

#### `reports`
**Description:** Generated report job and file metadata.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Report ID |
| `farm_id` | `uuid` | NO | FK | — | Tenant |
| `report_type` | `report_type_enum` | NO | — | — | Report kind |
| `title` | `varchar(300)` | NO | — | — | Display |
| `date_from` | `date` | YES | — | — | Scope |
| `date_to` | `date` | YES | — | — | Scope |
| `format` | `report_format_enum` | NO | — | — | PDF/Excel/CSV |
| `status` | `report_status_enum` | NO | — | `'PENDING'` | Job state |
| `file_url` | `varchar(500)` | YES | — | — | Object storage |
| `parameters` | `jsonb` | YES | — | — | Filters |
| `generated_by` | `uuid` | NO | FK | — | User |
| `generated_at` | `timestamptz` | YES | — | — | Completion |
| `created_at` | `timestamptz` | NO | — | `now()` | Audit |

**PK:** `id`

---

#### `notifications`
**Description:** User/farm alerts and reminders.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Notification ID |
| `farm_id` | `uuid` | NO | FK | — | Tenant |
| `user_id` | `uuid` | YES | FK | — | Target user (NULL = broadcast) |
| `type` | `notification_type_enum` | NO | — | — | Category |
| `severity` | `notification_severity_enum` | NO | — | — | INFO/WARNING/CRITICAL |
| `title` | `varchar(200)` | NO | — | — | Headline |
| `message` | `text` | NO | — | — | Body |
| `entity_type` | `varchar(50)` | YES | — | — | Linked object |
| `entity_id` | `uuid` | YES | — | — | Linked ID |
| `is_read` | `boolean` | NO | — | `false` | Inbox state |
| `read_at` | `timestamptz` | YES | — | — | When read |
| `created_at` | `timestamptz` | NO | — | `now()` | Delivery time |

**PK:** `id`

---

#### `audit_log`
**Description:** Append-only compliance trail for sensitive mutations.

| Column | PG Type | Nullable | Unique | Default | Why It Exists |
|--------|---------|----------|--------|---------|---------------|
| `id` | `uuid` | NO | PK | `gen_random_uuid()` | Log ID |
| `farm_id` | `uuid` | YES | FK | — | Tenant |
| `user_id` | `uuid` | YES | FK | — | Actor |
| `action` | `varchar(50)` | NO | — | — | CREATE/UPDATE/DELETE/VOID |
| `entity_type` | `varchar(50)` | NO | — | — | Table |
| `entity_id` | `uuid` | NO | — | — | Record |
| `old_values` | `jsonb` | YES | — | — | Before state |
| `new_values` | `jsonb` | YES | — | — | After state |
| `ip_address` | `inet` | YES | — | — | Security |
| `created_at` | `timestamptz` | NO | — | `now()` | Immutable |

**PK:** `id` — **Never updated, never deleted**

---

## 4. Primary Keys

### UUID vs BIGINT

| Criterion | UUID (v7 recommended) | BIGINT (BIGSERIAL) |
|-----------|----------------------|-------------------|
| **Global uniqueness** | Yes, across shards and mobile clients | No, per-database only |
| **Offline/mobile sync** | Client can pre-generate IDs | Requires server assignment |
| **Index size** | 16 bytes | 8 bytes |
| **Insert locality** | v7: good; v4: random scatter | Excellent sequential |
| **Security** | Non-enumerable in APIs | Predictable sequences |
| **Human debugging** | Harder to read | Easy sequential |
| **Merge/replication** | No collision risk | Risk on multi-region |

### Final Recommendation

**UUID v7 for all primary keys.**

Justification for PondDesk:
- Mobile field workers record feedings and water tests offline
- Multi-tenant SaaS may shard by `farm_id` in future
- API exposes record IDs — non-sequential IDs reduce enumeration risk
- PostgreSQL 15+ handles UUID indexes efficiently when combined with `(farm_id, created_at)` clustering

---

## 5. Foreign Keys

### Complete FK Map

```
farms (root)
  ├── ponds.farm_id                    RESTRICT
  ├── fish_batches.farm_id             RESTRICT
  ├── feed_types.farm_id               RESTRICT
  ├── feed_categories.farm_id          RESTRICT
  ├── feed_inventory.farm_id           RESTRICT
  ├── vendors.farm_id                  RESTRICT
  ├── customers.farm_id                RESTRICT
  ├── feeding_records.farm_id          RESTRICT
  ├── water_records.farm_id            RESTRICT
  ├── mortality_records.farm_id        RESTRICT
  ├── harvest_records.farm_id          RESTRICT
  ├── reports.farm_id                  RESTRICT
  ├── notifications.farm_id            RESTRICT
  ├── farm_settings.farm_id            RESTRICT, UNIQUE
  └── farm_memberships.farm_id         RESTRICT

ponds
  ├── fish_batches.pond_id             RESTRICT
  ├── water_records.pond_id            RESTRICT
  ├── feeding_records.pond_id         RESTRICT (denorm)
  ├── mortality_records.pond_id        RESTRICT (denorm)
  ├── harvest_records.pond_id          RESTRICT (denorm)
  └── batch_transfers.from/to_pond_id  RESTRICT

fish_batches
  ├── feeding_records.fish_batch_id   RESTRICT
  ├── mortality_records.fish_batch_id  RESTRICT
  ├── harvest_records.fish_batch_id    RESTRICT
  ├── weight_samples.fish_batch_id    RESTRICT
  └── batch_transfers.fish_batch_id   RESTRICT

species
  └── fish_batches.species_id          RESTRICT

feed_types
  ├── feed_inventory.feed_type_id      RESTRICT
  └── feeding_records.feed_type_id     RESTRICT

vendors
  ├── feed_purchases.vendor_id         RESTRICT
  └── fish_batches.vendor_id           SET NULL

customers
  └── harvest_records.customer_id      SET NULL

users
  ├── farm_memberships.user_id         RESTRICT
  ├── *.recorded_by                    RESTRICT (facts)
  ├── *.created_by                     SET NULL (masters)
  └── audit_log.user_id                SET NULL
```

**Rule:** Every FK column gets a dedicated B-tree index.

---

## 6. Relationships

### One-to-One

| Parent | Child | Notes |
|--------|-------|-------|
| `farms` | `farm_settings` | Each farm has exactly one settings row |
| `users` | `user_preferences` | Each user has one preference profile |

### One-to-Many

| Parent | Children | Cardinality |
|--------|----------|---------------|
| `farms` | `ponds` | 1:N |
| `farms` | `fish_batches` | 1:N |
| `farms` | `vendors`, `customers` | 1:N |
| `ponds` | `fish_batches` (over lifetime) | 1:N sequential |
| `ponds` | `water_records` | 1:N |
| `fish_batches` | `feeding_records` | 1:N |
| `fish_batches` | `mortality_records` | 1:N |
| `fish_batches` | `harvest_records` | 1:N |
| `fish_batches` | `weight_samples` | 1:N |
| `fish_batches` | `batch_transfers` | 1:N |
| `feed_types` | `feed_inventory` | 1:1 per farm (via unique) |
| `vendors` | `feed_purchases` | 1:N |
| `users` | `farm_memberships` | 1:N (multi-farm) |

### Many-to-Many

| Entity A | Entity B | Junction Table | Why |
|----------|----------|----------------|-----|
| `users` | `farms` | `farm_memberships` | Operators work across farms with per-farm roles |
| `sales` *(future)* | `harvest_records` | `sale_harvests` | One invoice may cover multiple harvest events |

**No M:N between batches and ponds** — resolved via `batch_transfers` history with single current `pond_id` on batch.

---

## 7. Constraints

### CHECK Constraints

| Table | Constraint | Rule |
|-------|------------|------|
| `fish_batches` | `chk_qty_nonnegative` | `current_quantity >= 0` |
| `fish_batches` | `chk_initial_positive` | `initial_quantity > 0` |
| `fish_batches` | `chk_harvest_after_stock` | `expected_harvest_date IS NULL OR stocking_date IS NULL OR expected_harvest_date >= stocking_date` |
| `feeding_records` | `chk_feed_positive` | `quantity_kg > 0` WHEN `status = 'COMPLETED'` |
| `mortality_records` | `chk_mortality_positive` | `quantity > 0` |
| `harvest_records` | `chk_harvest_positive` | `quantity > 0 AND total_weight_kg > 0` |
| `feed_inventory` | `chk_stock_nonnegative` | `quantity_on_hand >= 0` |
| `water_records` | `chk_temp_range` | `temperature_c IS NULL OR temperature_c BETWEEN 0 AND 45` |
| `water_records` | `chk_ph_range` | `ph IS NULL OR ph BETWEEN 0 AND 14` |
| `water_records` | `chk_level_range` | `water_level_pct IS NULL OR water_level_pct BETWEEN 0 AND 100` |
| `ponds` | `chk_capacity` | `max_fish_count IS NULL OR max_fish_count > 0` |

### UNIQUE Constraints

| Table | Constraint |
|-------|------------|
| `ponds` | `(farm_id, name)` WHERE `deleted_at IS NULL` |
| `fish_batches` | `(farm_id, batch_code)` WHERE `deleted_at IS NULL` |
| `feed_inventory` | `(farm_id, feed_type_id)` |
| `farm_memberships` | `(farm_id, user_id)` WHERE `deleted_at IS NULL` |
| `users` | `email` |
| `farms` | `slug` |

### Partial Unique (Business Policy)

```
UNIQUE (pond_id) ON fish_batches
  WHERE status IN ('ACTIVE', 'HARVEST_READY')
  AND deleted_at IS NULL
```
Enforces one active batch per pond at database level.

### Application-Layer Constraints (Transactional)

| Rule | Enforced By |
|------|-------------|
| Harvest quantity ≤ `current_quantity` | Service transaction |
| Mortality reduces `current_quantity` atomically | Service transaction |
| Feeding deducts inventory atomically | Service transaction |
| Full harvest closes batch (`status = CLOSED`) | Service transaction |
| No operations on `CLOSED` batches | Service validation |
| Stocking within pond capacity | Service validation |

---

## 8. Enums

| Enum | Values | Used In |
|------|--------|---------|
| `user_role_name` *(in `roles.name`)* | ADMIN, MANAGER, WORKER | `roles` — stored as data, not PG enum, for extensibility |
| `batch_status_enum` | PLANNED, ACTIVE, HARVEST_READY, HARVESTED, CLOSED, WRITTEN_OFF | `fish_batches` |
| `pond_status_enum` | EMPTY, ACTIVE, MAINTENANCE, DRAINED | `ponds` |
| `pond_type_enum` | EARTHEN, CONCRETE, CAGE, RACEWAY | `ponds` |
| `feeding_status_enum` | SCHEDULED, COMPLETED, MISSED, SKIPPED | `feeding_records` |
| `feeding_method_enum` | MANUAL, AUTOMATIC | `feeding_records` |
| `water_status_enum` | HEALTHY, WARNING, CRITICAL | `water_records` |
| `record_source_enum` | MANUAL, SENSOR | `water_records` |
| `harvest_status_enum` | SCHEDULED, COMPLETED, CANCELLED | `harvest_records` |
| `harvest_type_enum` | PARTIAL, FULL | `harvest_records` |
| `mortality_cause_enum` | DISEASE, WATER_STRESS, PREDATION, HANDLING, TREATMENT, UNKNOWN | `mortality_records` |
| `vendor_category_enum` | FINGERLING, FEED, CHEMICAL, EQUIPMENT, OTHER | `vendors` |
| `payment_status_enum` | PENDING, PAID, PARTIAL, OVERDUE, CANCELLED | `feed_purchases` |
| `report_type_enum` | DAILY_FEEDING, WATER_QUALITY, HARVEST, INVENTORY, BATCH, POND_SUMMARY, FARM_STATS | `reports` |
| `report_format_enum` | PDF, EXCEL, CSV | `reports` |
| `report_status_enum` | PENDING, GENERATING, READY, FAILED | `reports` |
| `notification_type_enum` | FEEDING_DUE, LOW_INVENTORY, WATER_ALERT, MORTALITY_SPIKE, HARVEST_DUE, WEATHER, SYSTEM | `notifications` |
| `notification_severity_enum` | INFO, WARNING, CRITICAL | `notifications` |
| `inventory_tx_enum` | PURCHASE, FEEDING, ADJUSTMENT, SPOILAGE, CORRECTION | `inventory_transactions` |
| `measurement_unit_enum` | METRIC, IMPERIAL | `farms` |
| `theme_enum` | LIGHT, DARK | `user_preferences` |

**Design note:** Roles use a `roles` table rather than PG enum — custom roles can be added without schema migration.

---

## 9. Index Strategy

### Tier 1 — Tenancy (Every List Query)

| Index | Columns | Module |
|-------|---------|--------|
| `idx_ponds_farm` | `(farm_id)` | Ponds |
| `idx_batches_farm_status` | `(farm_id, status)` | Dashboard, Batches |
| `idx_batches_pond` | `(pond_id)` | Pond detail |
| `idx_feeding_farm_date` | `(farm_id, feeding_date DESC)` | Daily Feedings |
| `idx_water_farm_date` | `(farm_id, water_test_date DESC)` | Water Records |
| `idx_harvest_farm_date` | `(farm_id, harvest_date DESC)` | Harvest |
| `idx_notifications_farm_unread` | `(farm_id, is_read, created_at DESC)` | Notifications |

### Tier 2 — Entity History

| Index | Columns | Module |
|-------|---------|--------|
| `idx_feeding_batch_date` | `(fish_batch_id, fed_at DESC)` | Batch feed history |
| `idx_water_pond_date` | `(pond_id, tested_at DESC)` | Pond water trends |
| `idx_mortality_batch` | `(fish_batch_id, recorded_at DESC)` | Survival analysis |
| `idx_harvest_batch` | `(fish_batch_id, harvested_at DESC)` | Batch yield |
| `idx_inventory_farm` | `(farm_id, feed_type_id)` | Feed Inventory |

### Tier 3 — Reporting & Dashboard

| Index | Columns | Purpose |
|-------|---------|---------|
| `idx_batches_stocking` | `(farm_id, stocking_date)` | Cycle reports |
| `idx_batches_harvest_target` | `(farm_id, expected_harvest_date)` WHERE `status IN ('ACTIVE','HARVEST_READY')` | Harvest countdown KPI |
| `idx_feeding_status` | `(farm_id, status, feeding_date)` | Missed feeding alerts |
| `idx_water_status` | `(farm_id, status, tested_at DESC)` | Critical water dashboard |
| `idx_reports_farm_created` | `(farm_id, created_at DESC)` | Recent reports |

### Tier 4 — Auth & Membership

| Index | Columns | Purpose |
|-------|---------|---------|
| `idx_membership_user` | `(user_id, farm_id)` | Login farm resolution |
| `idx_users_email` | `(email)` | Authentication lookup |
| `idx_refresh_token_hash` | `(token_hash)` | Token validation |

### Tier 5 — Partial Indexes

| Index | Definition | Purpose |
|-------|------------|---------|
| `idx_active_batch_per_pond` | `UNIQUE (pond_id) WHERE status IN ('ACTIVE','HARVEST_READY') AND deleted_at IS NULL` | Business policy |
| `idx_low_inventory` | `(farm_id) WHERE quantity_on_hand < reorder_level` | Alert queries |

---

## 10. Audit Strategy

### Standard Column Matrix

| Column | Master Data | Operational Facts | Ledger | Config |
|--------|-------------|-------------------|--------|--------|
| `created_at` | ✅ | ✅ | ✅ | ✅ |
| `updated_at` | ✅ | ✅ | ❌ | ✅ |
| `created_by` | ✅ | ❌ | ❌ | ❌ |
| `recorded_by` | ❌ | ✅ | ✅ | ❌ |
| `updated_by` | Optional | ❌ | ❌ | Optional |
| `deleted_at` | ✅ | ✅ (void) | ❌ | ❌ |

### Rationale

- **`created_at`** — Universal. Every record needs birth timestamp.
- **`updated_at`** — Mutable entities only. Facts use void + new record, not in-place edit (policy-dependent).
- **`created_by`** — Master data attribution (who created this pond/batch).
- **`recorded_by`** — Field operations attribution (who fed fish at 6 AM). Non-nullable on facts.
- **`updated_at` on facts** — Supports correction within edit window; original preserved in `audit_log`.
- **`audit_log`** — Captures before/after JSON for compliance on harvest voids, quantity corrections, role changes.

### `updated_at` Maintenance

Single PostgreSQL trigger function `set_updated_at()` applied to all tables with `updated_at` column — consistent across Alembic migrations.

---

## 11. Soft Delete Strategy

### Soft Delete (`deleted_at`) — YES

| Table | Reason |
|-------|--------|
| `farms` | Regulatory retention; prevent accidental data loss |
| `users` | Re-hire; preserve `recorded_by` integrity |
| `ponds` | Historical batch/water context |
| `fish_batches` | Closed batches are permanent history |
| `vendors`, `customers` | Referenced by historical purchases/harvests |
| `feeding_records`, `mortality_records`, `harvest_records`, `water_records` | Void without destroying audit trail |
| `farm_memberships` | Revoke access vs hard delete |

### Never Delete — YES

| Table | Reason |
|-------|--------|
| `audit_log` | Append-only compliance |
| `inventory_transactions` | Financial ledger — use reversal entries |
| `batch_transfers` | Immutable movement history |
| `weight_samples` | Scientific growth record |
| `feed_purchases` | Financial audit — void flag instead |
| `refresh_tokens` | Revoke via `revoked_at`, retain for security audit |

### Application Contract

All standard queries: `WHERE deleted_at IS NULL`  
Admin/audit endpoints: explicit opt-in to include deleted records  
Row-Level Security policies also filter `deleted_at IS NULL`

---

## 12. Performance Recommendations

### 12.1 Partitioning Strategy

| Table | Strategy | When |
|-------|----------|------|
| `feeding_records` | RANGE by `feeding_date` (monthly) | > 5M rows |
| `water_records` | RANGE by `water_test_date` (monthly) | > 5M rows |
| `audit_log` | RANGE by `created_at` (monthly) | > 10M rows |
| `sensor_readings` *(future)* | RANGE by `read_at` (daily) | IoT scale |

Partition key includes `farm_id` as sub-partition strategy if single-farm query dominance is confirmed.

### 12.2 Archiving Strategy

```
Active DB (hot)     → Last 24 months of facts
Archive DB (cold)   → Older facts, compressed
Object storage      → Generated report files (reports.file_url)
```

Archive process:
1. Move partitions older than retention window to archive schema
2. Maintain summary tables (`batch_summary`, `monthly_farm_stats`) before archive
3. Keep `fish_batches` master rows indefinitely

### 12.3 Query Optimization

| Pattern | Recommendation |
|---------|----------------|
| Dashboard KPIs | Materialized view `mv_farm_daily_stats` refreshed nightly + on-demand |
| Today's feedings | `WHERE farm_id = ? AND feeding_date = CURRENT_DATE` — uses `idx_feeding_farm_date` |
| Water trends | Limit to 90-day window; use `idx_water_pond_date` |
| Report generation | Read replica for heavy aggregation queries |
| N+1 prevention | SQLAlchemy `selectinload` for pond→batch, batch→species |

### 12.4 Large Table Handling

- **Keyset pagination** (cursor-based) on `(created_at, id)` — not OFFSET for fact tables
- **Covering indexes** for dashboard: `(farm_id, status) INCLUDE (current_quantity, expected_harvest_date)`
- **Connection pooling** via PgBouncer in transaction mode
- **Read replicas** for Reports module

### 12.5 Pagination Strategy

| Screen | Method |
|--------|--------|
| Feeding history | Keyset: `WHERE (fed_at, id) < (cursor_fed_at, cursor_id) ORDER BY fed_at DESC LIMIT 50` |
| Water records | Keyset on `(tested_at, id)` |
| Notifications | Keyset on `(created_at, id) WHERE is_read = false` |
| Pond/batch lists | Offset acceptable (low cardinality per farm) |

---

## 13. Future Scalability

| Future Module | Extension Point | Core Impact |
|---------------|-----------------|-------------|
| **AI Assistant** | `ai_recommendations` table referencing `entity_type/id` | None on core |
| **IoT Sensors** | `sensor_devices` → `sensor_readings`; `water_records.source = SENSOR` | Pond gains `has_sensors` (exists) |
| **Financial Accounting** | `expenses`, `sales`, `sale_harvests`; ledger already exists | Add tables only |
| **Sales / Customers** | `customers` exists; add `sales` + junction | Harvest unchanged |
| **Vendors** | `vendors` + `feed_purchases` exist | Ready |
| **Employee Management** | `employees` table + `timesheets` with `farm_id` | Parallel to `users` |
| **Marketplace** | `marketplace_listings` references `harvest_records` | Add tables only |
| **Mobile App** | UUID PKs + `updated_at` on all mutable rows | Already designed |
| **Offline Sync** | `sync_events` outbox per `device_id` + `user_id` | Client-generated UUIDs |
| **Cloud Sync** | Delta sync on `updated_at > last_sync_at` | Already designed |
| **Multi-Farm** | `farm_memberships` junction | Already designed |

**Design principle:** New modules attach via `farm_id` + optional `entity_type/id` polymorphic reference. Core production spine (`fish_batches` → `feeding_records` → `harvest_records`) never changes.

---

## 14. Complete Entity Relationship Diagram

```
                                    ┌──────────────┐
                                    │    roles     │
                                    └──────┬───────┘
                                           │
┌──────────────┐         ┌─────────────────┴──────────────────┐         ┌──────────────┐
│    users     │─────────│        farm_memberships              │─────────│    farms     │
└──────┬───────┘         └────────────────────────────────────┘         └──────┬───────┘
       │                                                                        │
       ├────────────────┐                              ┌───────────────────────┤
       │                │                              │                       │
┌──────┴───────┐  ┌─────┴──────────┐          ┌───────┴────────┐    ┌────────┴────────┐
│user_preferences│  │ refresh_tokens │          │ farm_settings  │    │    species      │
└───────────────┘  └────────────────┘          └────────────────┘    │ (farm_id NULL   │
                                                                      │  = global)      │
                                                                      └────────┬────────┘
                                                                               │
       ┌───────────────────────────────────────────────────────────────────────┤
       │                   │                    │                │               │
┌──────┴──────┐   ┌────────┴────────┐  ┌───────┴──────┐  ┌─────┴──────┐  ┌────┴───────┐
│feed_categories│  │   feed_types    │  │   vendors    │  │ customers  │  │   ponds    │
└──────┬───────┘   └────────┬────────┘  └──────┬───────┘  └─────┬──────┘  └─────┬──────┘
       │                    │                   │                │               │
       └──────────┬─────────┘                   │                │         ┌─────┴──────┐
                  │                             │                │         │water_records│
           ┌──────┴───────┐                     │                │         │ (POND ONLY) │
           │feed_inventory│                     │                │         └────────────┘
           └──────┬───────┘                     │                │
                  │                             │                │
           ┌──────┴───────┐                     │                │
           │feed_purchases│                     │                │
           └──────┬───────┘                     │                │
                  │                             │                │
           ┌──────┴────────────┐                │                │
           │inventory_         │                │                │
           │transactions       │                │                │
           └───────────────────┘                │                │
                                                │                │
                                         ┌──────┴─────────────────┴──────┐
                                         │        fish_batches           │
                                         └──────────────┬────────────────┘
                                                        │
              ┌─────────────┬──────────────┬────────────┼────────────┬──────────────┐
              │             │              │            │            │              │
       ┌──────┴──────┐ ┌────┴─────┐ ┌──────┴─────┐ ┌──┴───────┐ ┌──┴────────┐ ┌───┴──────────┐
       │feeding_     │ │mortality_│ │weight_     │ │batch_    │ │harvest_   │ │  (future)    │
       │records      │ │records   │ │samples     │ │transfers │ │records    │ │  sales       │
       └─────────────┘ └──────────┘ └────────────┘ └──────────┘ └────────────┘ └──────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   reports    │    │notifications │    │  audit_log   │
└──────────────┘    └──────────────┘    └──────────────┘

═══════════════════════════════════════════════════════
FUTURE EXTENSION (no core redesign required)
═══════════════════════════════════════════════════════

┌──────────────┐     ┌──────────────┐     ┌───────────────────┐
│sensor_devices│────▶│sensor_       │     │ai_recommendations │
│  (→ ponds)   │     │readings      │     │ (entity_type/id)  │
└──────────────┘     └──────────────┘     └───────────────────┘

┌──────────────┐     ┌──────────────┐     ┌───────────────────┐
│  employees   │     │  expenses    │     │  sync_events      │
│  timesheets  │     │  sales       │     │  (mobile offline) │
└──────────────┘     └──────────────┘     └───────────────────┘
```

---

## 15. Architecture Rationale

### 15.1 Why This Design Works

1. **Farm-scoped tenancy** with denormalized `farm_id` on facts eliminates expensive joins on every dashboard query across thousands of farms.

2. **Fish Batch as production spine** — all grow-out events (feed, mortality, harvest, weight) attach to batch; water attaches to pond. This correctly models aquaculture physics.

3. **Transactional `current_quantity`** on `fish_batches` is the one justified denormalization — updated atomically by mortality/harvest service transactions, not computed on read.

4. **Inventory ledger** (`inventory_transactions`) separates event history from current balance — essential for financial modules and dispute resolution without schema change.

5. **UUID v7 primary keys** future-proof mobile offline sync, API security, and horizontal scaling.

6. **RESTRICT on all fact FKs** — farms are never hard-deleted; operational history is legally and commercially immutable.

7. **Partial unique index** on active batch per pond enforces business policy at the database layer, not solely in application code.

### 15.2 Reporting Support Matrix

| Report Type | Primary Tables | Key Indexes |
|-------------|----------------|-------------|
| **Dashboard KPIs** | `fish_batches`, `feeding_records`, `feed_inventory`, `water_records` | `idx_batches_farm_status`, `idx_feeding_farm_date` |
| **Daily Feeding** | `feeding_records` + `fish_batches` + `ponds` | `idx_feeding_farm_date` |
| **Harvest Report** | `harvest_records` + `fish_batches` | `idx_harvest_farm_date` |
| **Water Report** | `water_records` + `ponds` | `idx_water_farm_date`, `idx_water_pond_date` |
| **Inventory Report** | `feed_inventory` + `inventory_transactions` + `feed_purchases` | `idx_inventory_farm` |
| **Farm Statistics** | All facts aggregated by `farm_id` + date range | Materialized view recommended |
| **Historical Trends** | `water_records`, `weight_samples`, `feeding_records` | Time-series indexes + 90-day window |

### 15.3 Cascade Rules Summary

| Action | Behavior |
|--------|----------|
| Delete Farm | **PROHIBITED** — soft-delete `farms.deleted_at` only |
| Delete Pond | **RESTRICT** if batches or water records exist |
| Delete Batch | **RESTRICT** if feeding/mortality/harvest records exist |
| Delete User | **RESTRICT** if `recorded_by` references exist; else soft-delete |
| Delete Vendor/Customer | **Soft-delete** — historical FKs use SET NULL or retain ID |
| Void Feeding/Harvest | **Soft-delete** fact + `audit_log` entry + reversal transaction |

### 15.4 Pre-Implementation Checklist

- [ ] Seed `roles` (ADMIN, MANAGER, WORKER) in Alembic migration 001
- [ ] Seed global `species` (Catfish, Tilapia) in migration 001
- [ ] Implement `set_updated_at()` trigger function
- [ ] Define Row-Level Security: `farm_id = current_setting('app.farm_id')`
- [ ] Define transactional service boundaries: `FeedingService`, `MortalityService`, `HarvestService`
- [ ] Configure object storage bucket for `reports.file_url` and `water_records.photo_url`
- [ ] Document data retention policy (recommended: 7 years for operational facts)

---

**This schema is ready for Alembic migration authoring, SQLAlchemy 2.0 model mapping, and Pydantic v2 schema generation — with full support for all Phase 2 modules and a clear, zero-redesign path to AI, IoT, financial, and marketplace capabilities.**