# Database Schema Layers

> **Source:** [Database Architecture §1.4](../architecture/02-database-architecture.md#14-schema-layers)

## Layer Diagram

```mermaid
flowchart TB
    subgraph L1["Layer 1 — Identity & Tenancy"]
        users
        roles
        farm_memberships
        refresh_tokens
    end

    subgraph L2["Layer 2 — Configuration & Reference"]
        farms
        farm_settings
        user_preferences
        species
        feed_categories
        feed_types
        vendors
        customers
    end

    subgraph L3["Layer 3 — Production Master"]
        ponds
        fish_batches
        batch_transfers
    end

    subgraph L4["Layer 4 — Operational Facts"]
        feeding_records
        water_records
        mortality_records
        weight_samples
        harvest_records
        feed_purchases
    end

    subgraph L5["Layer 5 — Inventory & Ledger"]
        feed_inventory
        inventory_transactions
    end

    subgraph L6["Layer 6 — Insights & Comms"]
        reports
        notifications
        audit_log
    end

    L1 --> L2 --> L3 --> L4
    L4 --> L5
    L2 --> L6
    L4 --> L6
```

## Tenancy Boundary

All operational data (Layers 3–6) is scoped by `farm_id`. See [ADR-013](../adr/ADR-013-farm_id-tenant-scoping-at-repository-level.md).

## Related Documents

- [Database Architecture](../architecture/02-database-architecture.md)
- [Complete ERD](./database-erd.md)
- [Database Index](../database/README.md)
