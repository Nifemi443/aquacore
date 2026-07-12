# Performance Optimization & Scalability Architecture

> **Phase:** 17 — Performance Engineering & Scale Path  
> **Status:** Approved — Pre-Implementation  
> **Project:** PondDesk Fish Farm Management Platform  
> **Stack:** FastAPI · Async SQLAlchemy 2.0 · PostgreSQL 15+ · Redis · Celery · Nginx · Next.js · Docker · Prometheus/Grafana · OpenTelemetry · Python 3.13+  
> **Depends on:** Phase 2 §12 · Phase 3 pagination · Phase 4 §23 · Phase 8 repos · Phase 12 workers · Phase 14 §16 · Phase 15 deploy · Phase 16 SLOs

Designs how PondDesk grows from a single-farm MVP to thousands of commercial farms without rewriting the Clean Architecture core. No application code, load-test scripts, or infra manifests are implemented in this phase.

## Related Documents

- [Database Architecture §12 Performance](./02-database-architecture.md#12-performance-recommendations)
- [API Contract §14.9 Pagination](./03-api-contract.md#149-pagination-standard)
- [Backend Architecture §23 Scalability](./04-backend-architecture.md#23-scalability-roadmap)
- [Repository Layer](./08-repository-layer.md) — Query composition, N+1 controls
- [Background Processing](./12-background-processing.md) — Queues, workers, Beat
- [Infrastructure §16 Scale-out](./14-infrastructure-architecture.md#16-scalability-roadmap)
- [CI/CD](./15-cicd-deployment-architecture.md) — Zero-downtime & soak
- [Observability §4/§10](./16-observability-architecture.md) — SLIs, capacity signals
- [ADR-002 Monolith First](../adr/ADR-002-monolith-first.md) · [ADR-009 Async SQLAlchemy](../adr/ADR-009-async-sqlalchemy.md) · [ADR-013 Tenant Scoping](../adr/ADR-013-farm_id-tenant-scoping-at-repository-level.md)

---

## Table of Contents

- [1. Scalability Overview](#1-scalability-overview)
- [2. Application Scaling](#2-application-scaling)
- [3. Database Scaling](#3-database-scaling)
- [4. Caching Strategy](#4-caching-strategy)
- [5. API Optimization](#5-api-optimization)
- [6. Background Worker Optimization](#6-background-worker-optimization)
- [7. File Storage Strategy](#7-file-storage-strategy)
- [8. Query Optimization](#8-query-optimization)
- [9. Load Balancing](#9-load-balancing)
- [10. Resource Optimization](#10-resource-optimization)
- [11. Performance Targets](#11-performance-targets)
- [12. Multi-Tenancy Roadmap](#12-multi-tenancy-roadmap)
- [13. Disaster Scalability](#13-disaster-scalability)
- [14. Performance Testing Strategy](#14-performance-testing-strategy)
- [15. Optimization Roadmap](#15-optimization-roadmap)
- [16. Best Practices](#16-best-practices)
- [17. Architecture Decision Rationale](#17-architecture-decision-rationale)

---

## 1. Scalability Overview

### 1.1 Goals

| Goal | Approach |
|------|----------|
| **Grow without rewrite** | Monolith-first (ADR-002); scale out stateless tiers first |
| **Farm-safe latency** | Field workers need sub-second writes for feeding/harvest |
| **Heavy work off the request path** | Reports, exports, AI → Celery (Phase 12) |
| **Measure before scaling** | Phase 16 metrics gate every optimization |
| **Tenant isolation preserved** | `farm_id` scoping at repository (ADR-013) at every scale tier |

### 1.2 Design Envelope (Target Capacity)

| Entity / load | Near-term (MVP→A) | Mid (B–C) | Far (D–E) |
|---------------|-------------------|-----------|-----------|
| **Farms** | 1–100 | 1,000 | 10,000–100,000 |
| **Ponds** | 10²–10⁴ | 10⁵ | 10⁶ |
| **Fish batches** | 10³–10⁵ | 10⁶ | 10⁷ |
| **Feeding records** | 10⁶ | 10⁷–10⁸ | 10⁹+ (partitioned) |
| **Water records** | 10⁶ | 10⁷–10⁸ | 10⁹+ (partitioned) |
| **Harvest records** | 10⁵–10⁶ | 10⁶–10⁷ | 10⁸ |
| **Concurrent users** | 10² | 10³ | 10⁴ |

### 1.3 Scaling Assumptions

1. **Access pattern:** Mostly farm-scoped reads/writes; cross-farm queries are admin/report only.  
2. **Write hot path:** Feeding, inventory consume, harvest — must stay OLTP-friendly.  
3. **Read hot path:** Dashboard KPIs, today’s feedings, active batches — cacheable.  
4. **Skew:** A few large farms dominate volume; indexes and caches must work under skew.  
5. **Sessions:** JWT access tokens are **stateless**; refresh tokens live in Postgres (Phase 10) — API replicas need no sticky sessions.  
6. **Beat remains singleton** at every scale until a leader-election redesign.  
7. **Water records remain pond-scoped** (not batch-scoped) — query plans must not join incorrectly.

### 1.4 Scale Philosophy

```
Cache & query tune  →  Horizontal API/workers  →  DB pool/replicas
        →  Partition/archive facts  →  Optional service extract  →  Multi-region
```

**Never** jump to microservices or sharding before caching, indexing, and worker scale are exhausted.

### 1.5 Non-Goals (This Phase)

- No Kubernetes manifests or auto-scaler YAML  
- No immediate farm-id database sharding  
- No IoT time-series product (Phase C trigger only)  
- No implementation of cache layers or load-test suites  

---

## 2. Application Scaling

### 2.1 Horizontal Scaling (Preferred)

| Tier | How | When |
|------|-----|------|
| **API (FastAPI)** | Multiple identical containers behind Nginx/LB | CPU >70% sustained or p95 SLO burn |
| **Frontend (Next.js)** | Multiple instances + CDN for static | Same |
| **Celery workers** | Scale by **queue** (reports, default, high_priority, ai) | Queue depth / time-in-queue SLO |
| **Beat** | **Exactly one** leader | Never horizontally scale Beat blindly |

API and frontend are **stateless**: no local session store; JWT + DB-backed refresh.

### 2.2 Vertical Scaling

| Use | When |
|-----|------|
| Larger Postgres instance | Before read replicas; connection & buffer pressure |
| More RAM for Redis | Cache + broker headroom |
| Larger worker boxes | PDF/report memory spikes |

Prefer vertical for **Postgres** early; prefer horizontal for **API/workers**.

### 2.3 Multiple API Instances

Requirements for safe multi-instance:

- Shared Postgres + Redis  
- No in-process-only locks for correctness (use DB/Redis locks if needed)  
- Idempotent domain event handlers  
- Migrate as **oneshot** before rolling API (Phase 14/15)  
- Expand/contract schema so old and new replicas coexist during roll  

### 2.4 Session Strategy

| Concern | Strategy |
|---------|----------|
| Access JWT | Stateless; any API instance validates |
| Refresh tokens | Postgres; rotation + reuse detection (Phase 10) |
| Optional jti denylist | Redis TTL = remaining access life |
| Sticky sessions | **Not required** for API |

### 2.5 Worker & Scheduler Scaling

| Component | Scale rule |
|-----------|------------|
| Workers | `replicas ∝ max(queue_depth, task_latency)` per queue |
| Reports workers | Separate pool; isolate memory hogs |
| AI workers | Separate pool / hardware later (Phase D) |
| Scheduler (Beat) | Single replica; alert on missed ticks (Phase 16) |

### 2.6 Load Balancing

See §9 — Nginx (MVP) → cloud LB at multi-host.

---

## 3. Database Scaling

### 3.1 Introduction Triggers

| Technique | Introduce when |
|-----------|----------------|
| **Index strategy** | Day one (Phase 2); revisit on slow-query alerts |
| **Query optimization** | Continuous; gate with `pg_stat_statements` |
| **Connection pooling** | Day one SQLAlchemy pool; **PgBouncer** at ~200 farms / many API replicas |
| **Read replicas** | Heavy reports slow primary; ≥200 farms or report SLO miss |
| **Partitioning** | Fact tables > ~5M rows (Phase 2 §12.1) |
| **Archiving** | Hot data > ~24 months of facts; disk/backup pressure |
| **Vacuum / maintenance** | Continuous autovacuum; tune at large table growth |
| **Sharding by farm** | Only at 10k–100k farms / multi-region extreme |

### 3.2 Index Strategy

| Pattern | Guidance |
|---------|----------|
| Tenant filter | Leading `farm_id` on operational indexes |
| Time facts | `(farm_id, date_col DESC)` / `(pond_id, tested_at DESC)` |
| Status lists | Partial indexes for `deleted_at IS NULL`, active batches |
| Covering | `INCLUDE` columns for dashboard projections |
| Uniqueness | Farm-scoped unique (pond name, etc.) |

Avoid unused indexes — write amplification on feeding/harvest paths.

### 3.3 Query Optimization

- Prefer **set-based** SQLAlchemy `select()`; ban legacy `Query` API  
- Cap list endpoints with pagination always  
- Dashboard aggregations → cache or materialized view (§4, §8)  
- Reports → replica + async job  

### 3.4 Read Replicas

| Traffic | Routing |
|---------|---------|
| OLTP writes / auth / inventory ledger | **Primary only** |
| Report aggregations, export scans | Replica (session/read-only engine) |
| Dashboard (optional) | Replica if lag < threshold; else primary + cache |

Lag alerts from Phase 16; fail over reports to primary if lag exceeds SLA.

### 3.5 Connection Pooling

| Layer | Role |
|-------|------|
| SQLAlchemy async pool | Per-process `pool_size` + `max_overflow`; separate budgets for API vs workers |
| **PgBouncer** (transaction mode) | Multiplex when replica count × pool would exhaust Postgres |
| Statement timeouts | Short for HTTP; longer for report workers |

Formula: `(api_replicas × api_pool) + (worker_concurrency × worker_pool) < max_connections − headroom`.

### 3.6 Partitioning

| Table | Strategy | Threshold |
|-------|----------|-----------|
| `feeding_records` | RANGE monthly on feeding date | > 5M rows |
| `water_records` | RANGE monthly on test date | > 5M rows |
| `audit_log` | RANGE monthly | > 10M rows |
| Future `sensor_readings` | RANGE daily | IoT |

Use detach/drop for archive; keep masters (`fish_batches`, `ponds`) unpartitioned.

### 3.7 Archiving

```
Hot (primary): last 12–24 months facts
Warm/archive schema or DB: older partitions
Object storage: report PDFs / exports
Summaries: monthly_farm_stats before detach
```

### 3.8 Vacuum & Maintenance

| Practice | Cadence |
|----------|---------|
| Autovacuum | Always on; tune scale_factor on large facts |
| `ANALYZE` | After bulk imports / partition attach |
| `REINDEX` | Rare; after bloat incidents |
| `pg_stat_statements` | Always in staging/prod |
| Backup window | Avoid heavy reports during full backup if I/O contended |

---

## 4. Caching Strategy

Redis serves **broker + cache** initially (Phase 14); **split instances** when eviction fights the queue.

### 4.1 What to Cache

| Data | Key sketch | TTL | Invalidate |
|------|------------|-----|------------|
| **Dashboard metrics** | `farm:{id}:dashboard:v1` | 30–120s | On feeding/harvest/inventory events |
| **Farm statistics** | `farm:{id}:stats:daily:{date}` | Until midnight+ / 1h | Nightly refresh + event |
| **Frequent reports** | `report:meta:{id}` (status only) | Short | On status change |
| **Auth denylist jti** | `auth:deny:{jti}` | Access TTL | On logout |
| **Configuration / settings** | `farm:{id}:settings` | 5–15m | On settings update |
| **Permission sets** | `user:{id}:farm:{id}:perms` | 5–15m | On role/membership change |
| **Reference data** | `ref:species`, `ref:feed_types` | Hours–day | On admin publish |

Do **not** cache mutable inventory balances without version keys — prefer read-through with short TTL or skip.

### 4.2 TTL Strategy

| Class | TTL guidance |
|-------|--------------|
| Ultra-hot UI | 30–60s |
| Semi-static settings/perms | 5–15m |
| Reference | 1–24h |
| Security denylist | Exact remaining token life |

### 4.3 Invalidation

1. **Event-driven** (preferred): after commit, handlers delete/bump cache keys  
2. **TTL expiry** (safety net)  
3. **Version suffix** (`:v2`) for schema changes  

Never serve cross-farm data from a key missing `farm_id`.

### 4.4 Cache Before Scale

At 50–200 farms, Redis dashboard cache often delays the need for read replicas.

---

## 5. API Optimization

### 5.1 Pagination

| Resource | Method |
|----------|--------|
| Masters (ponds, batches) | Offset OK while pages small; prefer stable `order_by` |
| Facts (feedings, water, harvests, audit) | **Cursor / keyset** on `(timestamp, id)` (Phase 2/3) |
| Default `page_size` | 20; max 100 (enforce in schema) |

### 5.2 Filtering & Sorting

- Whitelist sort columns in Pydantic; reject arbitrary SQL identifiers  
- Always combine filters with `farm_id`  
- Prefer indexed columns in filter sets  

### 5.3 Response Size

- Use **Summary** schemas for lists; **Response** for detail (Phase 7)  
- Omit heavy nested collections by default; offer `?include=` sparingly  
- Images: return signed URLs, not bytes  

### 5.4 Compression

- Nginx `gzip`/`brotli` for JSON and static assets  
- Do not compress already-compressed images  

### 5.5 Streaming & Exports

| Use | Approach |
|-----|----------|
| Large CSV/PDF | Async job → object storage → signed URL |
| Modest streams | Optional `StreamingResponse` for admin exports only |
| Imports | Upload → validate → worker batch apply |

### 5.6 Lazy Loading

- Frontend: route-level code split; defer heavy charts  
- Backend: `selectinload` / explicit load options — no implicit lazy IO in async (ADR-009)  

### 5.7 Cursor Pagination Contract

```
GET /api/v1/feedings?cursor=<opaque>&limit=50
→ items + next_cursor | null
```

Opaque cursor encodes `(fed_at, id)`; never expose raw offsets for deep pages.

---

## 6. Background Worker Optimization

### 6.1 Worker Scaling

| Queue | Priority | Scale signal |
|-------|----------|--------------|
| `high_priority` | Notifications, critical | Depth & wait time |
| `default` | General | Depth |
| `reports` | CPU/memory heavy | Separate pool; concurrency low |
| `ai` | Optional | Isolated; never starve feeding reminders |

### 6.2 Throughput Levers

- Prefetch tuned per queue (low for heavy reports)  
- Idempotent tasks + dedupe keys  
- Batch DB writes inside import tasks  
- Avoid thundering herd on Beat fan-out (stagger per-farm enqueue)  

### 6.3 Retry Performance

- Exponential backoff; jitter  
- Fast-fail non-retryable errors  
- DLQ for poison messages (Phase 12/16)  

### 6.4 Queue Monitoring

Track: depth, time-in-queue, success/fail rate, runtime p95, DLQ depth (Phase 16). Autoscale workers on depth with cooldown.

---

## 7. File Storage Strategy

| Workload | Sync path? | Performance design |
|----------|------------|--------------------|
| **Image uploads** | Light validate sync; store via storage protocol | Size limits; async thumbnail worker |
| **PDF reports** | Never sync render | Worker + object storage |
| **CSV exports** | Async | Stream write to storage; signed download |
| **Large imports** | Async | Chunked parse; batched transactions; progress events |
| **Bulk processing** | Worker fan-out | Per-farm concurrency caps |
| **Cloud migration** | ADR-012 | Local/MinIO → S3 without service rewrites; CDN for public-ish assets |

CDN for Next static and optionally signed cookie/CDN for media at Phase B+.

---

## 8. Query Optimization

### 8.1 Best Practices

| Practice | Detail |
|----------|--------|
| **Indexes** | Match real `WHERE`/`ORDER BY`; review quarterly |
| **Composite indexes** | Leftmost prefix matches filters |
| **Query profiling** | `EXPLAIN (ANALYZE, BUFFERS)`; OTel SQL spans |
| **Avoid N+1** | `selectinload` / joined load plans in repositories |
| **Batch queries** | `WHERE id = ANY(:ids)` for fan-in |
| **Projection queries** | Select only needed columns for lists |
| **Materialized views** | `mv_farm_daily_stats` nightly + on-demand refresh (Phase 2) |

### 8.2 Repository Rules (Scale-Critical)

- Every query filtered by `farm_id` (ADR-013)  
- Soft-delete predicates consistent  
- No unbounded `.all()` on facts  
- Services never issue ad-hoc SQL bypassing repos  

### 8.3 Anti-Patterns

- OFFSET deep pagination on million-row tables  
- `SELECT *` for list endpoints  
- Per-row chatty loops to Redis/DB  
- Synchronous report aggregation in HTTP handlers  

---

## 9. Load Balancing

### 9.1 MVP (Single Host)

Nginx terminates TLS and routes:

| Path | Upstream |
|------|----------|
| `/api/` | FastAPI upstream pool |
| `/` | Next.js |
| `/_next/static` | Cacheable |

### 9.2 Algorithms

| Mode | Use |
|------|-----|
| **Round robin** | Default for stateless API |
| Least connections | Optional under uneven request cost |
| **Sticky sessions** | Not needed for API JWT; optional for Next if using local server session (avoid) |

### 9.3 Health Checks

- Active: `/health/ready` for API upstream  
- Unhealthy instance removed from pool during deploys (Phase 15)  

### 9.4 SSL Termination & Rate Limiting

- TLS at Nginx or cloud LB  
- Edge rate limits + app limits on `/auth/login` (Phase 10)  
- Connection limits to protect Postgres from stampede  

### 9.5 Multi-Host

Cloud LB → N app VMs/containers; shared managed Postgres/Redis; same health contract.

---

## 10. Resource Optimization

| Resource | Watch (Phase 16) | Optimization lever |
|----------|------------------|--------------------|
| **CPU** | API/worker saturation | Scale replicas; profile hot endpoints |
| **Memory** | RSS, OOMKills | Lower report concurrency; fix leaks |
| **Disk** | DB + log volumes | Partition, archive, log TTL |
| **Network** | Bandwidth / errors | Compression; CDN; region locality |
| **DB connections** | `pg_stat_activity` | PgBouncer; pool budgets |
| **Redis** | Memory, evictions | Split broker/cache; TTLs |
| **Workers** | Queue depth | Scale per queue |
| **Storage** | Object bucket growth | Lifecycle rules on reports/images |

**Capacity reviews** monthly (Phase 16 §12).

---

## 11. Performance Targets

Aligned with Phase 16 SLOs; tighten as product matures.

| Metric | Target (initial production) |
|--------|-----------------------------|
| **API read p95** | < 300 ms |
| **API write p95** (feeding/harvest) | < 500 ms |
| **API p99** (non-report) | < 1 s |
| **Auth login p95** | < 400 ms (Argon2-bound) |
| **DB simple query p95** | < 50 ms |
| **DB dashboard aggregate** (uncached) | < 200 ms; prefer cache hit |
| **Cache hit rate** (dashboard keys) | > 80% once warm |
| **Queue wait `high_priority` p95** | < 30 s |
| **Report READY p95** | < 5 min (standard range) |
| **Worker task p95** (email/notify) | < 10 s |
| **Availability** | 99.5% monthly MVP |

Error budgets gate aggressive releases (Phase 15/16).

---

## 12. Multi-Tenancy Roadmap

### 12.1 Current Model (Ship This)

| Aspect | Design |
|--------|--------|
| **Isolation** | Row-level `farm_id` on operational data |
| **Enforcement** | Repository always filters `farm_id` (ADR-013) |
| **AuthZ** | Membership + RBAC permissions (Phase 10) |
| **Context** | JWT claims + `X-Farm-Id` / membership check in services |
| **Security** | No cross-farm IDs in URLs without membership verify |

### 12.2 Future SaaS Expansion

| Stage | Enhancement |
|-------|-------------|
| **A** | Stronger admin tooling; per-farm rate limits |
| **B** | Optional Postgres RLS as defense-in-depth |
| **C** | Schema-per-tenant or shard-by-farm_id hash for mega-scale |
| **D** | Regional tenancy (data residency) |

### 12.3 Data Security at Scale

- Audit exports; signed URLs farm-scoped  
- Metrics without high-cardinality farm labels (Phase 16)  
- Backup restores tested for tenant leak absence  

---

## 13. Disaster Scalability

Failover is part of scale resilience (pairs with Phase 14/15 DR).

| Component | Strategy |
|-----------|----------|
| **Database** | Managed multi-AZ primary; PITR; promote replica on failure |
| **Redis** | Managed failover / Redis Sentinel; accept broker task loss with idempotent retry; split cache vs broker at scale |
| **Workers** | Stateless; orchestrator restarts; scale out on other hosts |
| **Beat** | Restart single leader; alert missed schedules; optional lock-based leader later |
| **Load balancer** | Cloud LB multi-AZ; or secondary Nginx + DNS failover |
| **Storage** | S3 multi-AZ + versioning; cross-region replication at Phase E |

RPO/RTO remain Phase 14/15 targets until multi-region.

---

## 14. Performance Testing Strategy

| Test type | Purpose | Environment |
|-----------|---------|-------------|
| **Load** | Expected peak RPS (login, list, feeding write) | Staging |
| **Stress** | Find breaking point | Staging |
| **Spike** | Sudden harvest-season traffic | Staging |
| **Endurance** | Memory leaks / pool exhaustion over hours | Staging overnight |
| **Capacity** | Farms×ponds synthetic dataset sizing | Staging/perf DB |
| **Benchmark** | Micros: repo queries, Argon2, serializer | CI optional / nightly |

### 14.1 Tooling

- k6 or Locust against staging API  
- Dataset generators respecting `farm_id` skew  
- Compare p95 to §11; gate release if regression > agreed %  
- Trace slow transactions with OTel during tests  

### 14.2 Critical Scenarios

1. Concurrent feeding writes same farm  
2. Dashboard read storm  
3. Report generation while OLTP continues  
4. Login brute / rate-limit behavior under load  
5. Worker backlog drain after outage  

---

## 15. Optimization Roadmap

Maps farm count to concrete work. Aligns Phase 4 A–E / Phase 14 A–E with finer triggers.

| Stage | Scale | Necessary optimizations |
|-------|-------|-------------------------|
| **Current MVP** | 1–10 farms | Correct indexes; async API; oneshot migrate; basic health; no premature cache |
| **100 Farms** | ~10² | Redis dashboard cache; scale API to 2+; more workers; Nginx tuning; `pg_stat_statements` |
| **1,000 Farms** | ~10³ | PgBouncer; read replica for reports; CDN; keyset everywhere on facts; matviews; split Redis if needed |
| **10,000 Farms** | ~10⁴ | Partition hot facts; archive; autoscaling workers; optional report service extract; stronger multi-AZ DB |
| **100,000 Farms** | ~10⁵ | Shard/regionalize; Kafka for events; dedicated IoT/TSDB; service decomposition; multi-region active-passive |

### 15.1 Trigger Discipline

Introduce each row when **metrics** show pain (p95, queue depth, disk, connections) — not calendar dates.

```
MVP ──► 100 farms ──► 1k ──► 10k ──► 100k
 indexes   cache+HA    pool+replica  partition   shard/region
           workers     CDN/matview   archive     extract svcs
```

---

## 16. Best Practices

1. **Async first** — FastAPI + Async SQLAlchemy for I/O; do not block event loop on CPU-heavy PDF (use workers).  
2. **Efficient queries** — farm-scoped, indexed, projected, paginated.  
3. **Minimal network calls** — batch; avoid chatty per-item remote I/O.  
4. **Connection reuse** — pools everywhere; PgBouncer when multiplex needed.  
5. **Resource pooling** — HTTP clients, Redis, DB, workers.  
6. **Caching before scaling** — fix hot keys before buying bigger DB.  
7. **Measure before optimizing** — Phase 16 dashboards + EXPLAIN.  
8. **Keep API stateless** — scale horizontally without session affinity.  
9. **Isolate heavy work** — reports/AI never on the feeding request path.  
10. **Preserve tenancy** — every scale feature re-validates `farm_id`.  
11. **Expand/contract schema** — zero-downtime requires compatible deploys.  
12. **One Beat** — duplicate schedulers cause duplicate farm jobs.  

---

## 17. Architecture Decision Rationale

| # | Decision | Alternatives | Rationale |
|---|----------|--------------|-----------|
| PERF-001 | Scale monolith horizontally first | Microservices at MVP | ADR-002; extraction ready via layers |
| PERF-002 | Cache dashboard before read replicas | Replica-first | Cheaper; hits common read path |
| PERF-003 | Keyset pagination on facts | OFFSET forever | Phase 2/3; stable at millions of rows |
| PERF-004 | PgBouncer when multi-API | Huge `max_connections` | Protects Postgres under replica sprawl |
| PERF-005 | Reports on replica + async | Sync on primary | Protects OLTP latency |
| PERF-006 | Partition at ~5M fact rows | Partition day one | Avoid ops cost until needed |
| PERF-007 | JWT stateless API | Server sessions | Free horizontal scale |
| PERF-008 | Single Beat + scaled workers | Multi-beat | Correctness of schedules |
| PERF-009 | Split Redis at eviction conflict | One Redis forever | Broker durability vs cache TTL |
| PERF-010 | RLS optional later | RLS day one | ADR-013 sufficient initially |
| PERF-011 | Performance tests in staging | Prod-only soak | Safe capacity discovery |
| PERF-012 | Design-only this phase | Premature optimizers in code | Matches phases 5–16 discipline |

### 17.1 Alignment Map

| Phase | Contribution |
|-------|--------------|
| Phase 2 | Indexes, partition/archive, keyset |
| Phase 3 | Pagination & list contracts |
| Phase 4 | Scalability phases A–E |
| Phase 8 | Query composition / N+1 |
| Phase 10 | Stateless auth enablers |
| Phase 12 | Queue isolation & worker scale |
| Phase 14 | Infra scale-out triggers |
| Phase 15 | Zero-downtime while scaling |
| Phase 16 | SLOs & capacity signals |
| Phase 17 | This specification — performance engineering program |

### 17.2 Implementation Readiness Checklist

- [ ] Confirm baseline indexes from Phase 2 in initial migrations  
- [ ] Enforce max page size + cursor on fact list endpoints  
- [ ] Add Redis cache façade for dashboard (feature-flagged)  
- [ ] Separate SQLAlchemy pool settings for API vs workers  
- [ ] Document PgBouncer runbook for Phase B  
- [ ] Wire report queries to optional read replica DSN  
- [ ] k6 smoke pack for feeding write + dashboard read  
- [ ] Partition plan rehearsal on staging with synthetic 5M+ rows  
- [ ] Grafana panels for pool saturation & cache hit rate  
- [ ] Review Beat singularity in deploy Compose  

---

**Document Status:** Ready to guide implementation priorities and capacity planning.  
**Next Phase:** [Phase 18 — Production Readiness & Governance](./18-production-readiness-governance.md). Implementation scaffold follows after governance blueprint.
