# Alembic Migration & Database Versioning Strategy

> **Phase:** 6 — Migration Architecture  
> **Status:** Approved — Pre-Implementation  
> **Project:** PondDesk Fish Farm Management Platform  
> **Stack:** PostgreSQL 15+ · SQLAlchemy 2.0 · Alembic · FastAPI  
> **Depends on:** Phase 2 (schema) · Phase 4 (Alembic at project root) · Phase 5 (ORM models)

Engineering handbook for long-term schema evolution without risking production farm data. No migration files or SQL are generated in this phase.

## Related Documents

- [Database Architecture](./02-database-architecture.md) — Canonical table/enum/index specs
- [ORM Model Design](./05-orm-models.md) — SQLAlchemy models Alembic will autogenerate from
- [Backend Architecture](./04-backend-architecture.md) — `migrations/` at project root (ADR-010)
- [Deployment Guide](../deployment/README.md) — Runtime startup order
- [Testing Guide](../testing/README.md) — CI database strategy

---

## Table of Contents

- [1. Migration Strategy Overview](#1-migration-strategy-overview)
- [2. Alembic Project Structure](#2-alembic-project-structure)
- [3. Revision Workflow](#3-revision-workflow)
- [4. Initial Schema Creation Plan](#4-initial-schema-creation-plan)
- [5. Schema Evolution Strategy](#5-schema-evolution-strategy)
- [6. Data Migration Strategy](#6-data-migration-strategy)
- [7. Rollback Strategy](#7-rollback-strategy)
- [8. Team Collaboration Guidelines](#8-team-collaboration-guidelines)
- [9. Deployment Workflow](#9-deployment-workflow)
- [10. Migration Best Practices](#10-migration-best-practices)
- [11. Architecture Decision Rationale](#11-architecture-decision-rationale)

---

## 1. Migration Strategy Overview

### 1.1 Goals

| Goal | Approach |
|------|----------|
| **Zero silent data loss** | Every destructive change is multi-step, reviewed, and reversible where possible |
| **Predictable deploys** | Migrations run as an explicit deploy step, never “on app boot” in production |
| **Team-safe** | Linear revision history; conflict resolution via merge revisions |
| **Alembic as source of truth** | Schema changes only through versioned revisions — never manual prod DDL |
| **Align with ORM** | Autogenerate from Phase 5 models; always human-review before commit |
| **Farm-data integrity** | Soft-delete and append-only ledgers respected; no hard-delete of facts via migration |

### 1.2 Non-Goals

- Generating the initial migration file in this document
- Writing raw SQL scripts outside Alembic for routine changes
- Using `Base.metadata.create_all()` in production
- Auto-running migrations inside the FastAPI lifespan in production

### 1.3 Core Principles

1. **Expand → Migrate → Contract** for breaking changes (never drop in the same release that removes code).
2. **Autogenerate is a draft**, not a finished migration.
3. **One logical change per revision** when possible (easier review and rollback).
4. **Schema migrations and data migrations are separate revisions** when either is non-trivial.
5. **Production migrations must be tested** against a restored snapshot before apply.
6. **Downtime is a last resort** — prefer concurrent indexes, batched backfills, dual-write windows.

### 1.4 Environments

| Environment | Database | Migration policy |
|-------------|----------|------------------|
| **Local** | Docker Postgres | Developers run `alembic upgrade head` after pull |
| **CI** | Ephemeral Postgres | Fresh migrate + optional downgrade smoke |
| **Staging** | Persistent, prod-like | Same migration path as production |
| **Production** | Managed Postgres | Apply during deploy window; monitored |

---

## 2. Alembic Project Structure

### 2.1 Folder Layout (ADR-010)

Alembic lives at the **backend project root**, not inside `app/`:

```
backend/
├── alembic.ini
├── migrations/
│   ├── env.py                 # Async engine, target_metadata, env hooks
│   ├── script.py.mako         # Revision template
│   ├── README.md              # Team quick rules (optional)
│   └── versions/
│       ├── 20260710_0001_initial_schema.py
│       ├── 20260710_0002_seed_roles.py
│       └── ...
├── app/
│   ├── models/                # Phase 5 ORM — imported by env.py
│   ├── database/
│   │   ├── base.py            # DeclarativeBase
│   │   └── session.py
│   └── config/
│       └── settings.py        # DATABASE_URL
├── scripts/
│   ├── migrate.sh             # Wrapper: upgrade / downgrade / current
│   └── check_migration_heads.sh
└── pyproject.toml
```

### 2.2 Configuration Responsibilities

| File | Responsibility |
|------|----------------|
| `alembic.ini` | Script location, logging, file template; **no secrets** |
| `migrations/env.py` | Load settings, import all models, set `target_metadata`, configure async connection |
| `migrations/versions/*` | Immutable history once merged to `main` |
| `app/config/settings.py` | `DATABASE_URL` per environment |

### 2.3 Environment Configuration

| Setting | Source | Notes |
|---------|--------|-------|
| `DATABASE_URL` | Env / secrets manager | Async URL for app; Alembic may use sync or async per `env.py` design |
| `ALEMBIC_CONFIG` | Optional override | Path to `alembic.ini` in CI |
| `SQLALCHEMY_ECHO` | Dev only | Never enable DDL echo in prod migrate jobs |

**Rules:**

- Never commit real credentials in `alembic.ini`
- Staging and production use distinct databases and credentials
- Migration jobs use a DB role with DDL privileges; the app runtime role should be DML-only where feasible

### 2.4 Naming Convention

**Revision files:**

```
YYYYMMDD_NNN_short_snake_description.py
```

Examples:

| File | Meaning |
|------|---------|
| `20260710_0001_initial_schema.py` | Bootstrap entire Phase 2 schema |
| `20260712_0002_add_ponds_has_sensors.py` | Additive column |
| `20260715_0003_backfill_batch_current_quantity.py` | Data-only |
| `20260720_0004_create_idx_feeding_farm_date_concurrent.py` | Index (possibly concurrent) |

**Revision IDs:**

- Prefer Alembic’s generated hex `revision` id for graph integrity
- Put human meaning in the **filename** and `message=` / docstring
- `down_revision` must always point to a real parent (or `None` for initial)

**Message style:**

```
add water_records photo_url
backfill farm_settings for existing farms
drop unused ponds.legacy_code (contract phase)
```

### 2.5 Revision Strategy

| Strategy | PondDesk choice |
|----------|-----------------|
| Branching | Allowed on feature branches; **must merge to single head before merge to main** |
| Multiple heads | Forbidden on `main` — CI fails if `alembic heads` ≠ 1 |
| Merge revisions | Use `alembic merge` when two branches both added revisions |
| Squashing | Only for unreleased local history; never squash merged production revisions |
| Edit after merge | **Forbidden** — always add a new revision |

---

## 3. Revision Workflow

### 3.1 Autogenerate Workflow

```
1. Update SQLAlchemy models (Phase 5 layout)
2. Ensure all models imported in app/models/__init__.py
3. alembic revision --autogenerate -m "description"
4. Open the generated file — treat as DRAFT
5. Manual review checklist (§3.2)
6. Add data migration steps if needed (separate revision preferred)
7. Run against local empty DB: upgrade → downgrade → upgrade
8. Commit models + migration together in one PR when possible
```

### 3.2 Manual Review Process (Mandatory)

Autogenerate **misses or mishandles**:

| Item | Review action |
|------|---------------|
| PostgreSQL enums | Verify `CREATE TYPE` / `ALTER TYPE`; often needs manual ops |
| Partial unique indexes | Confirm `postgresql_where=` matches Phase 2 |
| CHECK constraints | Confirm names and expressions |
| Server defaults | `gen_random_uuid()`, `now()`, JSONB `'[]'` |
| Soft-delete partial uniques | `(farm_id, name) WHERE deleted_at IS NULL` |
| Renames | Autogenerate often emits drop+create — rewrite as rename |
| Dropped tables | Confirm intentional; never drop ledgers |
| FK `ondelete` | Match Phase 2 RESTRICT / SET NULL |
| Concurrent indexes | Autogenerate won’t use `CONCURRENTLY` — rewrite for prod |
| Data backfills | Never rely on autogenerate |

**Review checklist (PR):**

- [ ] Upgrade path is clear and idempotent where possible
- [ ] Downgrade exists or is explicitly marked irreversible with justification
- [ ] No destructive drop without expand/contract plan
- [ ] Indexes on all new FK columns
- [ ] `farm_id` present on new operational tables
- [ ] Enum values only added (not renamed/removed) without a plan
- [ ] Tested: fresh upgrade, downgrade, re-upgrade

### 3.3 When to Write Manual Revisions

Use hand-written revisions for:

- Data backfills and transforms
- Concurrent index creation
- Enum value additions with existing rows
- Multi-step expand/contract renames
- Seeding reference data (`roles`, global `species`)
- Partitioning / extension enablement (`pgcrypto` / `uuid` if needed)

### 3.4 Commands (Conceptual)

| Intent | Command |
|--------|---------|
| Create draft from models | `alembic revision --autogenerate -m "..."` |
| Empty revision (data/manual) | `alembic revision -m "..."` |
| Apply all | `alembic upgrade head` |
| One step | `alembic upgrade +1` |
| Rollback one | `alembic downgrade -1` |
| Show heads | `alembic heads` |
| Show current | `alembic current` |
| History | `alembic history --verbose` |
| Merge heads | `alembic merge -m "merge ..." revA revB` |

---

## 4. Initial Schema Creation Plan

### 4.1 Bootstrap Approach

**Single initial revision** creates the full Phase 2 schema from empty database.

Do **not** use `create_all()` in production. Optional: local-only `create_all` for throwaway sandboxes is discouraged — prefer migrations everywhere for parity.

### 4.2 Prerequisite Extensions

Before tables (in initial migration `upgrade()`):

1. Ensure UUID generation available (`pgcrypto` or PG 13+ `gen_random_uuid()` as designed in Phase 2)
2. Create all PostgreSQL enum types (Phase 2 §8 / Phase 5 §5)

### 4.3 Creation Order

Order respects FK dependencies (parents before children):

```
Layer 0 — Extensions & Enums
  └── CREATE TYPE ... (all Phase 2 enums)

Layer 1 — Identity
  ├── roles
  ├── users
  └── refresh_tokens

Layer 2 — Tenancy
  ├── farms
  ├── farm_settings          (FK → farms)
  ├── user_preferences       (FK → users)
  └── farm_memberships       (FK → farms, users, roles)

Layer 3 — Reference Catalog
  ├── species
  ├── feed_categories
  ├── feed_types
  ├── vendors
  └── customers

Layer 4 — Production Masters
  ├── ponds
  ├── fish_batches
  └── batch_transfers

Layer 5 — Operational Facts
  ├── feeding_records
  ├── mortality_records
  ├── weight_samples
  ├── water_records          (FK → ponds ONLY)
  ├── harvest_records
  └── feed_purchases

Layer 6 — Inventory & Ledger
  ├── feed_inventory
  └── inventory_transactions

Layer 7 — Insights
  ├── reports
  ├── notifications
  └── audit_log
```

### 4.4 Within Each Table

For each table, create in this order:

1. **Table + columns** (including server defaults)
2. **Primary key**
3. **CHECK constraints**
4. **UNIQUE / partial UNIQUE constraints**
5. **Foreign keys** (after referenced tables exist)
6. **Indexes** (non-constraint indexes; FK indexes if not implied)

### 4.5 Post-Schema Seed (Separate Revision Recommended)

| Seed | Content | Why separate |
|------|---------|--------------|
| Roles | ADMIN, MANAGER, WORKER + permission JSON | Data, not structure |
| Global species | Catfish, Tilapia baselines | Optional catalog |
| System settings defaults | Via app on farm create | Prefer app logic |

**Revision split:**

1. `0001_initial_schema` — DDL only  
2. `0002_seed_roles` — insert roles (idempotent)

### 4.6 Verification After Initial Migrate

- `alembic current` == head
- Row counts: roles ≥ 3
- Spot-check: `\d fish_batches`, water_records FK → ponds only
- Partial unique: one active batch per pond exists
- App health: `/health/ready` connects successfully

---

## 5. Schema Evolution Strategy

### 5.1 Expand → Migrate → Contract

```
Release N:     ADD new column/table (nullable or defaulted) — expand
Release N:     Deploy code that dual-writes / reads new shape
Release N+1:   Backfill data migration
Release N+2:   Switch reads fully to new shape
Release N+3:   DROP old column/table — contract
```

Never expand and contract in the same production deploy for hot columns.

### 5.2 Add Columns

| Scenario | Safe approach |
|----------|---------------|
| Nullable column | Add in one revision; deploy |
| NOT NULL with constant default | Add with `server_default`, then optionally remove default later |
| NOT NULL needing backfill | Add nullable → backfill → set NOT NULL (3 steps / 2–3 revisions) |
| JSONB config | Add with `server_default='{}'` |

### 5.3 Remove Columns

1. Stop writing in application code  
2. Stop reading (feature flag / release)  
3. Deploy idle period  
4. Migration drops column  
5. Remove from ORM models in same or following PR  

**Never** drop `farm_id`, ledger columns, or audit columns without an ADR.

### 5.4 Rename Columns

Autogenerate will often **drop + add** — rewrite:

1. Add new column  
2. Backfill `UPDATE ... SET new = old`  
3. Dual-write in app  
4. Switch reads  
5. Drop old column  

Or use PostgreSQL rename in a maintenance window if table is small and downtime acceptable — document explicitly.

### 5.5 Rename Tables

Same expand/contract pattern, or `ALTER TABLE ... RENAME` only when:

- Table is small / low traffic  
- Downtime approved  
- ORM and all FKs updated in same release carefully  

Prefer view alias during transition for zero-downtime on hot tables.

### 5.6 Modify Constraints

| Change | Strategy |
|--------|----------|
| Add CHECK | Validate existing rows first; fix violators; then add |
| Drop CHECK | Safe if app no longer relies on it |
| Add UNIQUE | Deduplicate first; use partial unique matching soft-delete rules |
| Add FK | Ensure orphans cleaned; add NOT VALID then VALIDATE for large tables (PG) |
| Tighten NULL → NOT NULL | Backfill then alter |

### 5.7 Modify Enums

| Change | Risk | Strategy |
|--------|------|----------|
| **Add value** | Low | `ALTER TYPE ... ADD VALUE` — note: often **not transactional**; may need separate commit; downgrade hard |
| **Rename value** | High | Add new value → migrate rows → stop using old → cannot easily remove old value in PG |
| **Remove value** | Very high | Migrate all rows away first; removing enum values in PostgreSQL is painful — avoid |

**PondDesk rule:** Enums are append-only in production. Deprecate values in application code; do not remove PG enum labels without a dedicated project.

### 5.8 Split Tables

1. Create new table  
2. Backfill from old  
3. Dual-write  
4. Switch reads  
5. Stop writing old columns / drop later  

Example future: split `farm_settings.alert_thresholds` JSON into typed columns — use expand/contract.

### 5.9 Merge Tables

1. Ensure surviving table has all columns  
2. Backfill  
3. Update FKs / app  
4. Drop obsolete table only after contract window  

### 5.10 PondDesk-Specific Guardrails

| Do | Don't |
|----|-------|
| Add columns to `water_records` freely (pond-scoped) | Add `fish_batch_id` to water records |
| Soft-delete masters via `deleted_at` | Hard-delete `inventory_transactions` / `audit_log` |
| Add indexes concurrently on large fact tables | `CREATE INDEX` blocking writes on hot feeding tables in peak hours |
| Version permission strings in app | Change role JSON without a data migration if format breaks |

---

## 6. Data Migration Strategy

### 6.1 When Data Migrations Are Required

- Backfilling new NOT NULL columns  
- Transforming JSON shapes  
- Seeding roles/species  
- Recomputing denormalized fields (`current_quantity` repair)  
- Moving values during rename/split  

### 6.2 Preferred Patterns

| Pattern | Use |
|---------|-----|
| **Separate revision** after schema expand | Clear review; easier rollback of data vs DDL |
| **Idempotent updates** | `WHERE new_col IS NULL` so re-runs are safe |
| **Batched updates** | `LIMIT` loops for large tables |
| **Temporary columns** | Hold dual state during expand/contract |
| **Application backfill job** | Multi-hour transforms better as Celery/worker than blocking migrate |

### 6.3 Default Values

| Approach | When |
|----------|------|
| `server_default` on ADD COLUMN | Instant constant for all rows |
| Python/SQL backfill | Computed per-row values |
| App on read (lazy default) | Rare; avoid for integrity fields |

### 6.4 Temporary Columns

Naming: `*_new`, `*_old`, or explicit `legacy_*`.

Lifecycle: create → backfill → cutover → drop in later revision. Track temporary columns in the PR description and a short-lived checklist issue.

### 6.5 Large Datasets

For tables expected to grow large (`feeding_records`, `water_records`, `audit_log`):

1. Estimate row count before migrate  
2. Batch updates (e.g., 1k–10k rows per transaction)  
3. Sleep/throttle between batches to reduce replication lag  
4. Prefer online jobs for multi-million-row transforms  
5. Avoid wrapping huge backfills in one long transaction (bloat, locks)

### 6.6 Backfill Examples (Conceptual)

| Task | Strategy |
|------|----------|
| Create `farm_settings` for farms missing them | Insert defaults keyed by `farm_id` where not exists |
| Normalize emails to lowercase | Batched `UPDATE users SET email = lower(email)` |
| Repair `current_quantity` | Recompute from stocking − mortality − harvest in controlled script; lock batches |

### 6.7 What Never Belongs in Migrations

- Calling external APIs / sending emails  
- Business workflow side effects (notifications fan-out)  
- Non-deterministic “cleanup” of production facts without audit trail  

---

## 7. Rollback Strategy

### 7.1 Downgrade Requirements

Every revision must implement `downgrade()` **or** explicitly document why it cannot:

```
# Irreversible: PostgreSQL enum value addition cannot be removed safely.
# Downgrade: raise NotImplementedError with operator instructions.
```

### 7.2 Reversibility Matrix

| Migration type | Reversible? | Notes |
|----------------|-------------|-------|
| Add nullable column | Yes | Drop column in downgrade |
| Add column with default | Yes | Drop column |
| Create table | Yes | Drop table (only if empty / unused) |
| Add index | Yes | Drop index |
| Add FK / CHECK | Yes | Drop constraint |
| Backfill data | Partially | Store pre-image or accept one-way |
| Enum ADD VALUE | **No** (practical) | Leave value; stop using in app |
| Drop column | **No** without backup | Restore from backup / expand again |
| Drop table with data | **No** | Restore from PITR |
| Concurrent index | Yes | Drop index |
| Destructive delete of rows | **No** | Never in migrate without backup |

### 7.3 Safe Rollback Practice

1. Prefer **forward fix** migrations over downgrading production  
2. If downgrade required: take snapshot / ensure PITR first  
3. Downgrade one revision at a time; verify app compatibility  
4. App version and schema version must move together — don’t run old app against new schema or vice versa without compatibility window  

### 7.4 Expand/Contract Rollback Advantage

During expand phase, rollback = deploy previous app version (new column ignored).  
During contract phase, rollback is hard — only contract after confidence.

---

## 8. Team Collaboration Guidelines

### 8.1 Developer Workflow

```
git pull
alembic upgrade head
# edit models
alembic revision --autogenerate -m "..."
# review + test upgrade/downgrade
git commit (models + migration)
open PR
```

### 8.2 Naming & Ownership

- Filename date = authoring date (UTC)  
- One author primary per revision; co-authors via PR  
- Describe *why* in PR body, not only *what*

### 8.3 Conflict Resolution

| Symptom | Fix |
|---------|-----|
| Two heads after merge | `alembic merge -m "merge heads"`; review combined order |
| Same column added twice | Delete duplicate revision before merge to main; or merge + no-op |
| Autogenerate noise | Regenerate from updated `main` models |

**CI gate:** `alembic heads | wc -l` must equal `1` on `main`.

### 8.4 Merge Strategy

1. Rebase/merge `main` into feature branch frequently  
2. If both sides added migrations, create merge revision as last step  
3. Never reorder or edit revisions already on `main`  
4. Prefer small PRs: one schema concern per PR

### 8.5 Review Process

**Required reviewers:** backend engineer familiar with Phase 2 schema.

**Reviewers check:**

- Alignment with Phase 2 / Phase 5  
- Locking / downtime risk  
- Downgrade story  
- Data migration batching  
- No water→batch FK regressions  
- No hard-delete of ledgers  

### 8.6 Communication

- Announce long-running migrations in team channel before prod apply  
- Tag migrations that need maintenance windows  
- Document operator runbooks for irreversible steps  

---

## 9. Deployment Workflow

### 9.1 Pipeline

```
Developer
    ↓
Git branch + PR
    ↓
Code Review (models + migration)
    ↓
CI
  • lint / typecheck
  • alembic upgrade head (fresh DB)
  • alembic downgrade base / -1 (smoke)
  • alembic upgrade head (re-apply)
  • single-head check
  • pytest against migrated schema
    ↓
Merge to main
    ↓
Staging deploy
  • migrate staging
  • smoke tests / QA
    ↓
Production deploy window
  • backup / confirm PITR
  • migration validation (dry-run on snapshot if high risk)
  • deploy migration job: alembic upgrade head
  • deploy application
  • health checks
    ↓
Monitor (locks, error rate, lag)
```

### 9.2 Ordering: Migrate Then App (Default)

For **additive** (expand) changes:

1. Run migrations  
2. Deploy app that uses new schema  

For **contract** changes (drop column):

1. Deploy app that no longer uses column  
2. Run migration that drops column  

### 9.3 Minimizing Downtime

| Technique | Use |
|-----------|-----|
| Additive migrations only in peak hours | Low risk |
| `CREATE INDEX CONCURRENTLY` | Large tables (note: cannot run inside a transaction — configure Alembic accordingly) |
| Batched backfills off the migrate critical path | Hours-long data work |
| Dual-write windows | Renames / splits |
| Feature flags | Gate reads of new columns |
| Blue/green or rolling app deploys | After schema expand is compatible with both app versions |
| Avoid `ALTER TYPE` / heavy rewrites during feeding peak | Ops schedule |

### 9.4 Migration Execution Role

- Dedicated CI/CD job or init container **with completion before traffic switch**  
- Fail deploy if migration fails  
- Do not start Uvicorn pool until `alembic current` == expected head (readiness gate)

### 9.5 Hotfix Tables (PondDesk)

Extra caution for: `feeding_records`, `water_records`, `fish_batches`, `inventory_transactions`, `audit_log`.

- Prefer concurrent indexes  
- Avoid full-table rewrites  
- Schedule exclusive locks for off-peak  

---

## 10. Migration Best Practices

### 10.1 Testing Strategy

| Test | Purpose |
|------|---------|
| **Fresh database** | `upgrade head` from empty — primary CI path |
| **Existing database** | Apply only new revisions on DB already at previous head |
| **Rollback testing** | `downgrade -1` then `upgrade head` in CI for reversible revisions |
| **Production snapshot testing** | Restore anonymized prod snapshot to staging; run migration; measure time/locks |
| **App compatibility** | Run API tests against migrated schema |
| **Idempotent seed** | Re-run seed revision logic safely |

### 10.2 Performance Practices

| Concern | Practice |
|---------|----------|
| Large tables | Batch DML; concurrent indexes; analyze after big changes |
| Indexes | Create concurrently in prod; plain create OK for empty/new tables |
| Long-running migrations | Move to online job; keep DDL migration short |
| Lock timeouts | Set `lock_timeout` / `statement_timeout` appropriately for migrate role |
| Autovacuum | Expect bloat after mass updates; `ANALYZE` critical tables |
| Replication | Watch replica lag during backfills |

### 10.3 Operational Checklist (Production)

Before:

- [ ] Backup / PITR confirmed  
- [ ] Staging migrated successfully  
- [ ] Estimated duration communicated  
- [ ] Rollback / forward-fix plan written  
- [ ] App compatibility version pinned  

During:

- [ ] Watch locks and active queries  
- [ ] Watch error rates  

After:

- [ ] `alembic current` matches release  
- [ ] `/health/ready` green  
- [ ] Spot-check critical queries (dashboard, feedings list)  

### 10.4 Anti-Patterns

| Anti-pattern | Why forbidden |
|--------------|---------------|
| Editing merged migrations | Breaks checksums / other environments |
| Multiple heads on main | Ambiguous deploy target |
| `create_all` in prod | Unversioned drift |
| Migrate on app startup (prod) | Race conditions with multiple replicas |
| Dropping audit/ledger tables | Compliance / finance risk |
| Autogenerate commit without review | Silent data loss / wrong renames |
| Single TX million-row update | Outage risk |

---

## 11. Architecture Decision Rationale

| # | Decision | Alternatives | Rationale |
|---|----------|--------------|-----------|
| MIG-001 | Alembic at project root | Inside `app/` | ADR-010; clear separation from runtime package |
| MIG-002 | Autogenerate + mandatory review | Hand-write all DDL | Speed with safety; catches model drift |
| MIG-003 | No prod `create_all` | Metadata create on boot | Reproducible, reviewable history |
| MIG-004 | Expand/migrate/contract | Big-bang ALTER | Zero/low downtime; safe rollback window |
| MIG-005 | Separate data vs schema revisions | Combined always | Independent rollback; clearer review |
| MIG-006 | Single head on main | Long-lived migration branches | Predictable deploys |
| MIG-007 | Forward-fix preferred over prod downgrade | Always downgrade | Downgrades often unsafe with data |
| MIG-008 | Enum values append-only | Freely rename/remove | PostgreSQL enum limitations |
| MIG-009 | Concurrent indexes for hot facts | Blocking CREATE INDEX | Protects daily feeding/water write path |
| MIG-010 | Migrate before app for expands | App first | Prevents app querying missing columns |
| MIG-011 | CI upgrade + downgrade smoke | Upgrade-only CI | Catches irreversible mistakes early |
| MIG-012 | Snapshot test high-risk migrations | Test only on empty DB | Empty DB hides lock/time issues |

### 11.1 Alignment Summary

| Phase | Contribution to migrations |
|-------|----------------------------|
| Phase 2 | What to create (tables, enums, indexes, CHECKs) |
| Phase 4 | Where Alembic lives; deploy/runtime separation |
| Phase 5 | What autogenerate diffs against |
| Phase 6 | How to change it safely forever |

### 11.2 Implementation Readiness Checklist

- [ ] Add `alembic.ini` + `migrations/env.py` importing all Phase 5 models  
- [ ] Wire `DATABASE_URL` from settings  
- [ ] Create `0001_initial_schema` (DDL) + `0002_seed_roles` (data)  
- [ ] Add CI jobs: upgrade, downgrade smoke, single-head check  
- [ ] Add `scripts/migrate.sh` for operators  
- [ ] Document prod runbook in `docs/deployment/`  
- [ ] Forbid startup-time migrate in production settings  

---

**Document Status:** Ready for Alembic scaffolding and initial revision authoring.  
**Next Phase:** Phase 7 — Implement ORM models + initial Alembic migrations (still no business services/routes until schema applies cleanly in CI).
