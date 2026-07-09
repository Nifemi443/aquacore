# Complete Entity Relationship Diagram

> **Source:** [Database Architecture §14](../architecture/02-database-architecture.md#14-complete-entity-relationship-diagram)

## Core Production Spine

```mermaid
erDiagram
    farms ||--o{ ponds : has
    farms ||--o{ fish_batches : has
    farms ||--o{ farm_settings : has
    farms ||--o{ vendors : has
    farms ||--o{ customers : has

    users ||--o{ farm_memberships : has
    farms ||--o{ farm_memberships : has
    roles ||--o{ farm_memberships : defines

    ponds ||--o{ water_records : measures
    ponds ||--o{ fish_batches : hosts

    species ||--o{ fish_batches : classifies
    vendors ||--o{ fish_batches : sources
    vendors ||--o{ feed_purchases : supplies

    fish_batches ||--o{ feeding_records : receives
    fish_batches ||--o{ mortality_records : loses
    fish_batches ||--o{ weight_samples : measured
    fish_batches ||--o{ batch_transfers : moves
    fish_batches ||--o{ harvest_records : yields

    feed_types ||--o{ feed_inventory : stocks
    feed_types ||--o{ feeding_records : consumed
    feed_inventory ||--o{ inventory_transactions : ledger

    customers ||--o{ harvest_records : buys

    farms ||--o{ reports : generates
    farms ||--o{ notifications : receives
```

## Critical Rule

**`water_records` → `ponds` only** (not `fish_batches`). Water is a pond environmental property.

## Future Extension (No Core Redesign)

```mermaid
flowchart LR
    subgraph Future
        SD[sensor_devices]
        SR[sensor_readings]
        AI[ai_recommendations]
        EX[expenses / sales]
        SY[sync_events]
    end

    ponds -.-> SD
    SD -.-> SR
    fish_batches -.-> AI
```

## Related Documents

- [Database Architecture §14](../architecture/02-database-architecture.md#14-complete-entity-relationship-diagram)
- [Schema Layers](./database-schema-layers.md)
- [Domain Model](../architecture/01-domain-model.md)
