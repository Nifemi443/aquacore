# Database Documentation Index

Quick reference for the AquaCore PostgreSQL schema. The canonical specification is in the architecture docs.

## Canonical Document

**[Database Architecture & ERD (Phase 2)](../architecture/02-database-architecture.md)** — Full table specs, constraints, indexes, and ERD.

## Related Documents

- [Domain Model](../architecture/01-domain-model.md) — Business entities (Phase 1)
- [API Contract](../architecture/03-api-contract.md) — Endpoints mapped to tables
- [Backend Architecture](../architecture/04-backend-architecture.md) — Repository & session lifecycle
- [ERD Diagram](../diagrams/database-schema-layers.md) — Visual schema layers

## Stack

- PostgreSQL 15+
- SQLAlchemy 2.0 (async)
- Alembic migrations (project root)
- UUID primary keys
- Multi-tenant via `farm_id`

## Schema Layers

| Layer | Tables |
|-------|--------|
| **Identity & Tenancy** | `users`, `roles`, `farm_memberships`, `refresh_tokens` |
| **Configuration & Reference** | `farms`, `farm_settings`, `user_preferences`, `species`, `feed_categories`, `feed_types`, `vendors`, `customers` |
| **Production Master** | `ponds`, `fish_batches`, `batch_transfers` |
| **Operational Facts** | `feeding_records`, `water_records`, `mortality_records`, `weight_samples`, `harvest_records`, `feed_purchases` |
| **Inventory & Ledger** | `feed_inventory`, `inventory_transactions` |
| **Insights & Comms** | `reports`, `notifications`, `audit_log` |

## Critical Domain Rule

> **Water Records belong to Ponds, not Fish Batches.**

Water is a shared environmental property of a physical enclosure. See [§1.5](../architecture/02-database-architecture.md#15-critical-domain-correction).

## Entity Quick Reference

| Entity | Business Responsibility |
|--------|------------------------|
| `farms` | Tenant root |
| `ponds` | Physical production units |
| `fish_batches` | Grow-out cohort |
| `feeding_records` | Daily feed events |
| `water_records` | Pond water quality |
| `harvest_records` | Fish removal events |
| `feed_inventory` | Current stock balance |
| `inventory_transactions` | Immutable stock ledger |
| `audit_log` | Compliance trail |

Full entity list: [§2 Entity List](../architecture/02-database-architecture.md#2-entity-list)

## Conventions

| Convention | Rule |
|------------|------|
| Primary keys | UUID (`gen_random_uuid()`) |
| Timestamps | `created_at`, `updated_at` (timestamptz) |
| Soft delete | `deleted_at` on master entities |
| Tenancy | `farm_id` on all operational data |
| Audit | `recorded_by` on facts; append-only `audit_log` |
| Ledgers | `inventory_transactions` is immutable |

## Future Entities (Reserved)

`sensor_devices`, `sensor_readings`, `sales`, `expenses`, `ai_recommendations`, `sync_events`, `employees` — see [§13 Future Scalability](../architecture/02-database-architecture.md#13-future-scalability)
