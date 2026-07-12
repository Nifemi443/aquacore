# Monitoring, Logging & Observability Architecture

> **Phase:** 16 — Observability Platform  
> **Status:** Approved — Pre-Implementation  
> **Project:** PondDesk Fish Farm Management Platform  
> **Stack:** Prometheus · Grafana · Loki · Tempo/Jaeger · OpenTelemetry · Sentry · FastAPI · Celery · PostgreSQL · Redis · Docker · Nginx · Python 3.13+  
> **Depends on:** Phase 4 §16/§22 · Phase 10 §12 (audit) · Phase 11 §9 (health) · Phase 12 §12 (worker metrics) · Phase 14 §11/§15 · Phase 15 (deploy gates & soak)

Designs enterprise observability: structured logging, metrics, tracing, dashboards, alerting, audit correlation, health probes, incident response, capacity planning, retention, and security monitoring. No PromQL, Grafana JSON, or collector YAML is implemented in this phase.

## Related Documents

- [Backend Architecture §16 Logging](./04-backend-architecture.md#16-logging-strategy) · [§22 Observability](./04-backend-architecture.md#22-observability)
- [Security Architecture §12 Audit](./10-security-architecture.md#12-audit-logging)
- [API Presentation §9 Health](./11-api-presentation-layer.md#9-health-endpoints)
- [Background Processing §12 Monitoring](./12-background-processing.md#12-monitoring-strategy)
- [Infrastructure §11 Logging](./14-infrastructure-architecture.md#11-logging-architecture) · [§15 Health](./14-infrastructure-architecture.md#15-health-monitoring)
- [CI/CD §11 Deploy Monitoring](./15-cicd-deployment-architecture.md#11-monitoring-during-deployment)
- [ADR-011 Structured JSON Logging](../adr/ADR-011-structured-json-logging.md)
- [Deployment Index](../deployment/README.md)

---

## Table of Contents

- [1. Observability Overview](#1-observability-overview)
- [2. Folder Structure](#2-folder-structure)
- [3. Logging Architecture](#3-logging-architecture)
- [4. Metrics Strategy](#4-metrics-strategy)
- [5. Dashboard Design](#5-dashboard-design)
- [6. Alerting Strategy](#6-alerting-strategy)
- [7. Distributed Tracing](#7-distributed-tracing)
- [8. Audit Logging](#8-audit-logging)
- [9. Health Monitoring](#9-health-monitoring)
- [10. Performance Monitoring](#10-performance-monitoring)
- [11. Incident Response](#11-incident-response)
- [12. Capacity Planning](#12-capacity-planning)
- [13. Log Retention](#13-log-retention)
- [14. Security Monitoring](#14-security-monitoring)
- [15. Operational Runbooks](#15-operational-runbooks)
- [16. Best Practices](#16-best-practices)
- [17. Architecture Decision Rationale](#17-architecture-decision-rationale)

---

## 1. Observability Overview

### 1.1 Goals

| Goal | Approach |
|------|----------|
| **Know before customers** | Proactive alerts on SLOs, not only ticket-driven discovery |
| **Investigate in minutes** | Correlate `request_id` / `trace_id` across logs, metrics, traces, audit |
| **Protect farm data integrity** | Audit trail + security signals separate from ephemeral app logs |
| **Operate async reliably** | Queue depth, worker liveness, task failure rate (Phase 12) |
| **Plan capacity** | Growth trends for DB, storage, queues, API traffic |
| **Safe deploys** | Soak metrics during Phase 15 cutovers |

### 1.2 Pillars

```
┌─────────────────────────────────────────────────────────────┐
│                     Observability Plane                     │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│   Logs      │   Metrics   │   Traces    │   Audit (durable) │
│   Loki      │ Prometheus  │ Tempo/Jaeger│   PostgreSQL      │
│             │             │             │   audit_log       │
└──────┬──────┴──────┬──────┴──────┬──────┴─────────┬─────────┘
       │             │             │                │
       └─────────────┴──────┬──────┴────────────────┘
                            ▼
              Grafana  ·  Alertmanager  ·  Sentry
                            │
                            ▼
              On-call · Runbooks · Postmortems
```

### 1.3 Three Signals + One Compliance Store

| Signal | Primary store | Use |
|--------|---------------|-----|
| **Logs** | Loki (from stdout JSON) | Debug, security investigation, deploy soak |
| **Metrics** | Prometheus | SLOs, alerts, capacity |
| **Traces** | Tempo or Jaeger | Latency breakdown, N+1 queries, task chains |
| **Audit** | Postgres `audit_log` | Who did what (compliance; never “log-only”) |
| **Errors** | Sentry | Exception grouping, release regression |

### 1.4 Non-Goals (This Phase)

- No full APM vendor lock-in required (OTel-first; Sentry optional for errors)
- No multi-region observability mesh
- No implementing dashboards/alert YAML in-repo yet
- No replacing Phase 10 audit table with log aggregator

### 1.5 Environment Topology

| Env | Stack depth |
|-----|-------------|
| **Development** | stdout JSON; optional local Grafana/Loki Compose profile |
| **Testing / CI** | Minimal logging; no long-lived Prometheus |
| **Staging** | Full stack (Prometheus, Grafana, Loki, Tempo, Alertmanager) — prod-like |
| **Production** | Full stack + external uptime; tighter retention & access control |

---

## 2. Folder Structure

Extends Phase 14/15 monorepo with a first-class observability tree:

```
ponddesk/
├── observability/
│   ├── logging/
│   │   ├── README.md              # Log field contract & levels
│   │   └── examples/              # Sample JSON log lines (docs only)
│   ├── monitoring/
│   │   ├── prometheus/
│   │   │   ├── prometheus.yml     # Scrape configs (impl later)
│   │   │   └── recording-rules.yml
│   │   └── exporters/             # Notes for node, postgres, redis, celery
│   ├── tracing/
│   │   └── otel-collector.yaml    # Receiver/processor/exporter (impl later)
│   ├── dashboards/
│   │   ├── application.json
│   │   ├── infrastructure.json
│   │   ├── database.json
│   │   ├── worker.json
│   │   ├── business.json
│   │   └── security.json
│   ├── alerts/
│   │   ├── application.yml
│   │   ├── infrastructure.yml
│   │   ├── database.yml
│   │   ├── worker.yml
│   │   └── security.yml
│   └── runbooks/                  # Or symlink → docs/deployment/runbooks
│       ├── database-down.md
│       ├── redis-down.md
│       ├── high-cpu.md
│       ├── high-memory.md
│       ├── worker-failure.md
│       ├── deployment-failure.md
│       ├── authentication-failure.md
│       └── queue-overflow.md
│
├── docker/                        # Optional compose profile: observability
├── docs/
│   ├── architecture/16-…          # This document (canonical)
│   └── deployment/                # Incident + operator indexes
└── backend/app/
    ├── logging/                   # App log config (Phase 4 layout)
    └── … middleware request_id …
```

### 2.1 Directory Purposes

| Directory | Purpose |
|-----------|---------|
| `observability/logging/` | Canonical log schema docs & redaction rules |
| `observability/monitoring/` | Prometheus scrape/recording rules & exporter notes |
| `observability/tracing/` | OTel collector / sampling configuration |
| `observability/dashboards/` | Versioned Grafana dashboard definitions |
| `observability/alerts/` | Alertmanager / Prometheus rule groups |
| `observability/runbooks/` | Step-by-step recovery linked from alert annotations |
| `docs/architecture/16-…` | Design authority — do not fork decisions into dashboards alone |
| `backend/app/logging/` | Runtime formatters emitting ADR-011 JSON |

---

## 3. Logging Architecture

### 3.1 Principles

- **JSON to stdout** (ADR-011); ship via Docker logging driver → Loki  
- Every request gets a **`request_id`** (middleware); workers use **`correlation_id`** / **`task_id`**  
- **Never** log passwords, JWT/refresh tokens, full Authorization headers, or raw secrets  
- Prefer **events** (`event=`) over free-form narrative for high-volume paths  
- Application logs ≠ audit logs (Phase 10 §12.4)

### 3.2 Standard Log Format

```json
{
  "timestamp": "2026-07-12T09:15:22.123Z",
  "level": "INFO",
  "logger": "app.services.harvest_service",
  "message": "Harvest recorded",
  "event": "harvest.completed",
  "service": "api",
  "env": "production",
  "version": "1.4.2",
  "request_id": "a1b2c3d4-…",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "span_id": "00f067aa0ba902b7",
  "user_id": "…",
  "farm_id": "…",
  "path": "/api/v1/harvests",
  "method": "POST",
  "status_code": 201,
  "duration_ms": 84,
  "error_code": null,
  "extra": {}
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `timestamp` | Yes | ISO-8601 UTC |
| `level` | Yes | See §3.4 |
| `logger` | Yes | Module path |
| `message` | Yes | Human-readable short text |
| `event` | Recommended | Dot-namespaced machine key |
| `service` | Yes | `api` \| `worker` \| `beat` \| `frontend` \| `nginx` |
| `env` | Yes | `development` \| `staging` \| `production` \| `test` |
| `version` | Prod | SemVer / git SHA |
| `request_id` | HTTP | Propagated to workers as correlation |
| `trace_id` / `span_id` | When OTel on | W3C Trace Context |
| `user_id` / `farm_id` | When known | UUID strings |
| `path` / `method` / `status_code` / `duration_ms` | HTTP access | Access-style lines |
| `task_id` / `task_name` / `queue` | Workers | Celery context |
| `error_code` | Errors | Align with API envelope codes |

### 3.3 Log Categories

| Category | Producer | Typical events / content |
|----------|----------|--------------------------|
| **Application** | Services, domain | Workflow steps, business rule violations (non-secret) |
| **Request** | Middleware | Method, path, start (optional) |
| **Response** | Middleware | Status, duration_ms, bytes (optional) |
| **Authentication** | AuthService | Login success/fail (no password), lockout, refresh |
| **Authorization** | Permission gate | `FORBIDDEN`, missing permission string |
| **Audit** | Audit writer → **DB** | See §8 — may emit a thin log pointer `audit.written` |
| **Business Event** | Event bus handlers | `HarvestCompleted`, `FeedingRecorded` (after commit) |
| **Worker** | Celery worker | Task received/started/succeeded/failed/retry |
| **Scheduler** | Celery Beat | Tick, schedule fire, missed beat |
| **Background Task** | Task body | Progress markers for long reports |
| **Database** | Engine/pool (sampled) | Slow query warnings; pool checkout timeouts |
| **Error** | Exception handlers | `exc_type`, stack (prod: truncated), `request_id` |
| **Security** | AuthZ, rate limit, WAF/Nginx | Failures, 429s, suspicious patterns |

### 3.4 Log Levels

| Level | When to use |
|-------|-------------|
| **DEBUG** | Local/staging diagnostics; SQL echo only in dev; never default in prod |
| **INFO** | Normal operations: request completed, harvest recorded, task succeeded |
| **WARNING** | Recoverable anomalies: retry, slow query, degraded dependency, rate limit hit |
| **ERROR** | Failed operation needing attention: unhandled path, task final failure, 5xx |
| **CRITICAL** | System-threatening: cannot connect to DB on boot, data corruption suspected, security breach indicators |

### 3.5 Shipping Path

```
App/Worker/Beat/Nginx → stdout/stderr (JSON or access log)
        → Docker logging driver
        → Promtail / OTel Collector
        → Loki
        → Grafana Explore (LogQL)
```

Nginx may emit JSON access logs with `request_id` when proxied from API (`X-Request-Id`).

---

## 4. Metrics Strategy

### 4.1 Collection Model

| Source | Mechanism |
|--------|-----------|
| FastAPI | `prometheus-fastapi-instrumentator` or OTel metrics → Prometheus remote/scrape `/metrics` |
| Celery | Celery exporter / Flower metrics / custom task instrumentation |
| PostgreSQL | `postgres_exporter` |
| Redis | `redis_exporter` |
| Host | `node_exporter` |
| Nginx | `nginx-prometheus-exporter` or stub_status |
| Business | Custom counters in services (careful cardinality) |

Scrape **internal network only**; never expose `/metrics` publicly without auth or network policy.

### 4.2 Metric Catalog

#### API & HTTP

| Metric | Type | Labels (bounded) | Purpose |
|--------|------|------------------|---------|
| `http_requests_total` | Counter | `method`, `route`, `status` | Traffic & error rate |
| `http_request_duration_seconds` | Histogram | `method`, `route` | Latency SLO |
| `http_requests_in_progress` | Gauge | `method` | Saturation |

Use **route templates** (`/api/v1/ponds/{id}`), never raw IDs (cardinality).

#### Database

| Metric | Type | Purpose |
|--------|------|---------|
| `db_pool_checked_out` | Gauge | Pool pressure |
| `db_pool_size` | Gauge | Config visibility |
| `db_query_duration_seconds` | Histogram | ORM/repo latency (coarse op label) |
| `pg_*` (exporter) | Various | Connections, deadlocks, replication lag |

#### Workers & Queues

| Metric | Type | Purpose |
|--------|------|---------|
| `celery_tasks_total` | Counter | `task_name`, `status` (success/failure/retry) |
| `celery_task_duration_seconds` | Histogram | Task runtime |
| `celery_queue_length` | Gauge | `queue` — backlog |
| `celery_workers_up` | Gauge | Liveness |
| `celery_dlq_depth` | Gauge | Ops attention |

#### Authentication & Security

| Metric | Type | Purpose |
|--------|------|---------|
| `auth_login_success_total` | Counter | Baseline |
| `auth_login_failure_total` | Counter | Brute-force signal |
| `auth_token_reuse_total` | Counter | Critical security |
| `authz_forbidden_total` | Counter | Permission issues / probing |
| `rate_limit_exceeded_total` | Counter | Abuse |

#### Business (PondDesk-specific)

| Metric | Type | Labels | Purpose |
|--------|------|--------|---------|
| `harvest_events_total` | Counter | Prefer `result`; avoid high-card `farm_id` | Harvest volume |
| `feeding_events_total` | Counter | `result` | Feeding activity |
| `inventory_transactions_total` | Counter | `type` | Stock movement |
| `water_records_total` | Counter | — | Pond water tests (pond-scoped) |
| `batch_lifecycle_total` | Counter | `action` | Created/closed |
| `active_farms` / `active_users` | Gauge | — | Adoption (careful PII) |

Prefer **aggregate business metrics** without high-cardinality `farm_id` on Prometheus; use logs/audit for per-farm drill-down.

#### System

| Metric | Source | Purpose |
|--------|--------|---------|
| CPU, memory, disk, network | node_exporter | Host capacity |
| Container CPU/mem | cAdvisor / Docker | Service saturation |
| Certificate expiry | Blackbox / cert exporter | TLS risk |

### 4.3 SLIs / SLOs (Initial)

| SLI | SLO (starting point) |
|-----|----------------------|
| API availability (`ready` + non-5xx) | 99.5% monthly (MVP) |
| API latency p95 (read endpoints) | < 300 ms staging target; tune prod |
| API latency p95 (write endpoints) | < 500 ms |
| Login success (excluding bad password) | Infrastructure path healthy |
| Async report READY p95 | < 5 min for standard ranges |
| Queue time for `high_priority` | < 30 s p95 |

---

## 5. Dashboard Design

Grafana is the single pane; six core dashboards versioned under `observability/dashboards/`.

### 5.1 Application Dashboard

| Panel | Content |
|-------|---------|
| Request rate | RPS by route class |
| Error rate | 5xx / total; 4xx split |
| Latency | p50 / p95 / p99 histograms |
| Top slow routes | Table |
| In-flight requests | Gauge |
| Release marker | Annotations from deploy SHA |
| Sentry error spike | Optional plugin/link |

### 5.2 Infrastructure Dashboard

| Panel | Content |
|-------|---------|
| Host CPU / memory / disk | node_exporter |
| Container resource usage | api, worker, beat, frontend, nginx |
| Network throughput | Host + container |
| Nginx request rate / 5xx | Edge health |
| TLS cert days remaining | |

### 5.3 Database Dashboard

| Panel | Content |
|-------|---------|
| Connections used / max | Saturation |
| Transactions / commits / rollbacks | |
| Query latency / slow queries | |
| Deadlocks / locks | |
| Database size & growth | Capacity |
| Replication lag | If replica exists |
| Migration window markers | Deploy annotations |

### 5.4 Worker Dashboard

| Panel | Content |
|-------|---------|
| Workers up | By queue pool |
| Queue depth | `high_priority`, `default`, `reports`, `ai`, … |
| Task throughput | Success vs failure |
| Task duration p95 | By task name |
| Retry rate / DLQ depth | |
| Beat last tick age | Missed schedule |

### 5.5 Business Dashboard

| Panel | Content |
|-------|---------|
| Harvests / day | Platform-wide |
| Feedings recorded / day | |
| Active batches | Gauge from periodic job or metric |
| Inventory adjustments | |
| Water records / day | |
| Reports generated | READY count |
| Optional: farms active (7d) | Product pulse |

**Privacy:** no farm names or PII on shared Grafana; restrict folder ACLs.

### 5.6 Security Dashboard

| Panel | Content |
|-------|---------|
| Login failures / min | Spike detection |
| Account lockouts | |
| Token reuse detections | Critical |
| 401 / 403 rates | |
| Rate-limit 429s | |
| Permission denials by endpoint | |
| Suspicious path probes | From Nginx/logs |

---

## 6. Alerting Strategy

### 6.1 Principles

- Alert on **symptoms** (user pain) and **causes** (dependency down)  
- Every alert links a **runbook** URL in annotations  
- Page only for **severity** / **critical**; warn via Slack otherwise  
- Inhibit child alerts when parent (e.g. host down) fires  
- Tune after staging soak; avoid alert fatigue

### 6.2 Severity

| Severity | Response | Examples |
|----------|----------|----------|
| **Critical** | Page on-call | DB down, API ready fail, token reuse spike |
| **High** | Immediate Slack + ack SLA | Error rate SLO burn, Redis down, worker offline |
| **Warning** | Ticket / business hours | Disk > 80%, queue elevated, latency rising |
| **Info** | Dashboard only | Deploy completed |

### 6.3 Alert Catalog

| Alert | Condition (illustrative) | Severity |
|-------|--------------------------|----------|
| **High Error Rate** | 5xx ratio > 2% for 5m (or SLO burn) | High/Critical |
| **Database Down** | `/health/ready` DB fail or `pg_up == 0` for 1–2m | Critical |
| **Redis Down** | `redis_up == 0` for 2m | High (Critical if enqueue required) |
| **Worker Offline** | `celery_workers_up == 0` for 3m | High |
| **Scheduler Offline** | Beat heartbeat missing > 2 schedule intervals | High |
| **Slow API** | p95 latency > SLO for 10m | Warning → High |
| **Failed Background Tasks** | Failure rate > threshold or DLQ > 0 for 10m | High |
| **Disk Usage** | Filesystem > 85% (warn), > 92% (crit) | Warn/Crit |
| **CPU Usage** | Sustained > 90% 15m | Warning |
| **Memory Usage** | > 90% or OOMKill events | High |
| **Queue Backlog** | Depth > N per queue for 10m (Phase 12) | High |
| **Repeated Login Failures** | Failures/min > threshold from single IP or global | High (security) |
| **Token Reuse Detected** | `auth_token_reuse_total` increase | Critical |
| **Certificate Expiry** | < 14 days | Warning |

### 6.4 Routing

| Destination | Use |
|-------------|-----|
| PagerDuty / Opsgenie / equivalent | Critical |
| Slack `#ponddesk-alerts` | High/Warning |
| Email | Optional digests |
| GitHub issue | Non-urgent capacity warnings (optional bot) |

---

## 7. Distributed Tracing

### 7.1 Strategy

- **OpenTelemetry** SDK in API, workers, and (optional) Next.js server  
- Auto-instrument: FastAPI/Starlette, HTTPX, SQLAlchemy, Celery, Redis  
- Export OTLP → **OpenTelemetry Collector** → **Tempo** (preferred with Grafana stack) or Jaeger  
- Sampling: head-based **100% staging**; production **tail-based** or 5–20% baseline + always-on errors

### 7.2 Span Map

| Operation | Span kind | Notes |
|-----------|-----------|-------|
| **HTTP request** | SERVER | Root for API; name = route template |
| **Service method** | INTERNAL | Optional explicit spans for harvest/feeding |
| **Repository / DB query** | CLIENT | SQLAlchemy; scrub params |
| **Background job** | CONSUMER | Celery task; link to producer |
| **Enqueue task** | PRODUCER | From API/handler after commit |
| **External API** | CLIENT | SMTP, S3, AI provider |
| **Worker sub-steps** | INTERNAL | Report render, email send |

### 7.3 Request Correlation

```
Client
  → Nginx (+ X-Request-Id if generated)
  → FastAPI middleware
       assigns request_id
       creates/continues trace (W3C traceparent)
  → Service → Repository (child spans)
  → commit → EventBus → enqueue (propagate correlation_id = request_id)
  → Celery worker span linked via trace context / baggage
```

| ID | Role |
|----|------|
| `request_id` | Stable support key in API responses & logs (Phase 3/11) |
| `trace_id` | Distributed trace join key |
| `correlation_id` | Alias of request_id across async boundary |
| `task_id` | Celery unit of work |
| `event_id` | Domain event identity |

Sentry events should attach `request_id` + `trace_id` for one-click pivot.

---

## 8. Audit Logging

Durable, append-only **`audit_log`** in PostgreSQL (Phase 2 / Phase 10). Not a substitute for Loki.

### 8.1 Audit Record Shape

| Field | Description |
|-------|-------------|
| `id` | UUID |
| `occurred_at` | timestamptz |
| `actor_id` | User UUID (nullable for system) |
| `farm_id` | Tenant scope |
| `action` | Enum/string e.g. `HARVEST_RECORDED` |
| `resource_type` / `resource_id` | Target entity |
| `outcome` | `success` \| `failure` |
| `changes` | JSON before/after (redacted) |
| `ip_address` / `user_agent` | When from HTTP |
| `request_id` | Correlation |

### 8.2 Required Events

| Event | Trigger |
|-------|---------|
| **User Login** | `LOGIN_SUCCESS` |
| **Failed Login** | `LOGIN_FAILED` |
| **Password Change** | `PASSWORD_CHANGED` / reset completed |
| **Role Change** | `ROLE_CHANGED` / `PERMISSION_CHANGED` |
| **Fish Batch Created** | `BATCH_CREATED` |
| **Harvest Completed** | `HARVEST_RECORDED` |
| **Inventory Updated** | Restock / adjust / feed consume |
| **Water Test Recorded** | `WATER_RECORD_CREATED` (pond-scoped) |
| **Settings Changed** | `SETTINGS_UPDATED` |
| **User Deleted** | Soft-delete / membership remove |

Also retain Phase 10 security events: refresh reuse, lockout, logout-all, export requested.

### 8.3 Rules

- Written in the **same transaction** as the business mutation when feasible, or immediately after commit with reliability guarantees  
- **Never** delete rows; retention via archival tier if legally required  
- Admins query via secured API (`audit:read`); exporters are audited themselves  

---

## 9. Health Monitoring

Aligns with Phase 11 / 14; used by Docker, Nginx upstream, and Phase 15 deploy gates.

### 9.1 Endpoints

| Endpoint | Type | Checks |
|----------|------|--------|
| `GET /health` | Liveness (simple) | Process up |
| `GET /health/live` | Liveness | No dependency I/O |
| `GET /health/ready` | Readiness | DB `SELECT 1`; Redis if required for enqueue |
| `GET /health/version` | Build | SemVer / git SHA |
| `GET /health/deps` | Deep (internal) | DB, Redis, storage head/bucket ping |

### 9.2 Dependency Matrix

| Component | Liveness | Readiness / health signal |
|-----------|----------|---------------------------|
| **Application (API)** | `/health/live` | `/health/ready` |
| **Database** | `pg_isready` / exporter | Ready check + connections |
| **Redis** | `PING` | Ready if broker required |
| **Worker** | Process + Celery ping | Can connect broker + DB |
| **Scheduler** | Process up | Last tick age metric |
| **Storage** | — | Optional head object / MinIO health |
| **Frontend** | HTTP 200 `/` | Same |
| **Nginx** | Local stub | Upstreams resolving |

### 9.3 External Synthetic

Uptime monitor hits production/staging `/health/ready` and a login smoke on a schedule (Phase 14 §15.3). Failures → Critical alert.

---

## 10. Performance Monitoring

| Area | What to watch | Tooling |
|------|---------------|---------|
| **API latency** | p50/p95/p99 by route | Prometheus histograms + Grafana |
| **Database latency** | Query histogram; slow query log | Exporter + Postgres |
| **Query time** | Repo op labels; EXPLAIN in staging | Traces + DB dashboard |
| **Cache hit rate** | Redis hits/misses when cache enabled | redis_exporter |
| **Worker throughput** | Tasks/sec success | Celery metrics |
| **Task duration** | p95 by task | Histograms |
| **Memory usage** | Host + container RSS; Python worker leaks | node/cAdvisor |
| **CPU usage** | Sustained saturation | node/cAdvisor |
| **Network usage** | Bandwidth / errors | node_exporter |

### 10.1 Performance Budgets (Guidance)

| Class | p95 budget (initial) |
|-------|----------------------|
| Auth login | < 400 ms (Argon2 dominates) |
| List ponds/batches | < 300 ms |
| Record feeding/harvest | < 500 ms |
| Dashboard aggregate | < 800 ms (cache later) |
| Report generation | Async; READY < 5 min typical |

Regressions detected via deploy annotations + compare-to-previous in Grafana.

---

## 11. Incident Response

### 11.1 Workflow

```
Detection → Alert → Triage → Investigation → Mitigation → Recovery → Postmortem
```

| Stage | Actions |
|-------|---------|
| **Detection** | Alert, synthetic check, customer report, deploy soak fail |
| **Alert** | Page/Slack; auto-create incident channel; freeze risky deploys if Critical |
| **Investigation** | Grafana red panels → Loki by `request_id` → Tempo trace → audit if security |
| **Mitigation** | Rollback (Phase 15), scale workers, enable maintenance, block abusive IP |
| **Recovery** | Confirm SLOs recovering; clear DLQ; restore traffic |
| **Postmortem** | Blameless write-up within 5 business days for Sev-1/2; actions tracked |

### 11.2 Severity Model

| Sev | Definition | Example |
|-----|------------|---------|
| **SEV-1** | Platform down / data risk | DB down, mass auth failure |
| **SEV-2** | Major feature impaired | Workers down, harvest API 5xx |
| **SEV-3** | Degraded / workaround exists | Slow reports, single queue backlog |
| **SEV-4** | Minor | Cosmetic monitoring gap |

### 11.3 Investigation Cheatsheet

1. Is `/health/ready` green?  
2. Error rate vs deploy annotation?  
3. DB / Redis / disk alerts?  
4. Queue depth & worker up?  
5. Pick failing `request_id` → logs → trace → SQL span  
6. Security? Check login failures & audit `TOKEN_REUSE_*`  

---

## 12. Capacity Planning

| Signal | Why monitor | Planning action |
|--------|-------------|-----------------|
| **User / farm growth** | Active farms, MAU proxies | Scale API replicas; connection pools |
| **Database size** | Disk & backup windows | Partitioning, archival, vertical scale |
| **Storage growth** | S3/media (harvest images) | Lifecycle policies, retention |
| **Queue growth** | Sustained depth trend | Add workers; split queues |
| **Memory consumption** | Headroom before OOM | Resize hosts; worker concurrency |
| **Traffic trends** | RPS weekly/seasonal | Pre-scale before harvest seasons |

### 12.1 Review Cadence

| Cadence | Activity |
|---------|----------|
| Weekly | Error budget & alert noise review |
| Monthly | Capacity trends (DB, disk, RPS, queues) |
| Quarterly | SLO revisit; load test staging; DR restore drill |

---

## 13. Log Retention

| Environment | Hot (Loki/searchable) | Archive | Notes |
|-------------|----------------------|---------|-------|
| **Development** | Days (local) | None | Disk hygiene |
| **Testing / CI** | Ephemeral | None | CI artifacts only |
| **Staging** | 7–14 days | Optional | Enough for release debug |
| **Production** | **30–90 days** | Cold object storage optional | Cost vs investigate window |
| **Audit DB** | Online years | Compliance export | Not subject to Loki TTL |
| **Metrics** | 15–90 days Prometheus | Thanos/Mimir long-term optional | Recording rules for trends |
| **Traces** | 3–14 days | Rarely archive | High volume |

### 13.1 Compliance

- Harvest/media retention follows Phase 4 storage policy (business), separate from log TTL  
- Security investigations may require extended log hold — define legal hold process  
- PII minimization in logs reduces GDPR risk  

---

## 14. Security Monitoring

| Signal | Source | Response |
|--------|--------|----------|
| **Failed logins** | Metrics + audit + auth logs | Lockout already in app; alert on spikes / distributed spray |
| **Permission violations** | `403` + `authz_forbidden_total` | Investigate probing or mis-provisioned roles |
| **Rate limit violations** | `429` + Nginx/app counters | Ban/throttle; check for bots |
| **JWT failures** | `INVALID_TOKEN` / `EXPIRED_TOKEN` rates | Misconfig vs attack |
| **API abuse** | Unusual RPS per IP/user | WAF/Nginx rules; temporary blocks |
| **Suspicious requests** | Path scanning, SQLi fingerprints in Nginx | Block + review |
| **Token reuse** | Audit + counter | **Critical** — revoke families, force password reset path |

Security dashboard (§5.6) is mandatory in production Grafana with restricted viewers.

---

## 15. Operational Runbooks

Each alert annotation points to a runbook. Store under `observability/runbooks/` (and/or `docs/deployment/runbooks/`).

| Runbook | Symptoms | First checks | Mitigation sketch |
|---------|----------|--------------|-------------------|
| **Database Down** | Ready fail, `pg_up=0` | Host/disk, managed status, connections | Failover/restore; freeze deploys; status page |
| **Redis Down** | Worker errors, enqueue fail | Container/process, memory | Restart Redis; if persistent, rebuild volume from empty (queues lossy) + replay DLQ policy |
| **High CPU** | Latency ↑, CPU > 90% | Which container; recent deploy | Scale replicas; reduce worker concurrency; rollback if deploy-related |
| **High Memory** | OOMKills | Worker leaks, report jobs | Restart workers; lower prefetch; vertical scale |
| **Worker Failure** | Queue depth ↑, workers_up=0 | Logs, broker, DB | Restart workers; check task poison messages |
| **Deployment Failure** | Actions red, smoke fail | Phase 15 rollback | `rollback.sh` to previous digest; verify ready |
| **Authentication Failure** | Login fail spike | IdP/DB, JWT secret mismatch post-deploy | Verify secrets; check lockouts; rollback config |
| **Queue Overflow** | Depth ≫ threshold | Consumer crash, slow tasks | Scale workers; pause producers if needed; drain DLQ |

Runbooks must include: severity, impact, verification steps, escalation, and “how to close the alert.”

---

## 16. Best Practices

1. **Correlate everything** with `request_id` / `trace_id` — refuse new features that omit them on I/O paths.  
2. **Bounded label cardinality** — never put UUIDs on Prometheus labels.  
3. **Stdout JSON only** in containers — no ad-hoc log files inside app containers.  
4. **Separate audit from logs** — compliance lives in Postgres.  
5. **Alert runbooks before alerts** — no orphan pages.  
6. **Instrument once via OTel** where possible; export to multiple backends.  
7. **Redact secrets** at the logging filter layer; test with intentional canaries in CI.  
8. **Dashboard as code** — PR review for alert/dashboard changes.  
9. **Staging parity** — same scrape targets and alert rules (thresholds may differ).  
10. **Error budgets** drive release pace (Phase 15 promote gate considers burn).  
11. **Workers are first-class** — never API-only monitoring.  
12. **Beat is singular** — alert on duplicate beat or missing ticks.  

---

## 17. Architecture Decision Rationale

| # | Decision | Alternatives | Rationale |
|---|----------|--------------|-----------|
| OBS-001 | Grafana LGTM stack (Loki, Prometheus, Tempo) | ELK + Jaeger only; Datadog-only | Open stack; fits Compose; Grafana UX unified |
| OBS-002 | ADR-011 JSON logs → Loki | App writes to Elasticsearch directly | 12-factor; simpler containers (Phase 14) |
| OBS-003 | OpenTelemetry for traces/metrics | Vendor agents only | Portable; FastAPI/Celery support |
| OBS-004 | Sentry for exceptions | Logs-only errors | Grouping, release health, stack expertise |
| OBS-005 | Audit in Postgres, not Loki | Log-based audit | Phase 2/10 compliance; queryable, append-only |
| OBS-006 | `/metrics` internal scrape | Pushgateway-only | Pull model standard; simpler MVP |
| OBS-007 | Low-cardinality business metrics | Per-farm Prometheus labels | Protects TSDB; per-farm via logs/audit |
| OBS-008 | Tail/head sampling in prod | Always 100% traces | Cost control; always sample errors |
| OBS-009 | Alert → runbook mandatory | Tribal knowledge | MTTR reduction; SRE discipline |
| OBS-010 | Full observability on staging | Prod-only monitoring | Validates alerts before customer impact |
| OBS-011 | Design-only this phase | Ship Grafana JSON now | Matches phases 5–15 documentation discipline |

### 17.1 Alignment Map

| Phase | Contribution |
|-------|--------------|
| Phase 4 | Logging categories, future metrics/tracing sketch |
| Phase 10 | Audit events & security logging split |
| Phase 11 | Health endpoint contract |
| Phase 12 | Worker/queue metrics & alerts |
| Phase 14 | Log shipping, host probes, synthetic uptime |
| Phase 15 | Deploy soak, rollback monitoring |
| Phase 16 | This specification — full observability platform |

### 17.2 Implementation Readiness Checklist

- [ ] Add `observability/` tree with README stubs for logging contract  
- [ ] Instrument API: request_id middleware, JSON logging, `/metrics`  
- [ ] OTel SDK + collector Compose profile (staging)  
- [ ] Exporters: postgres, redis, node, celery  
- [ ] Import six Grafana dashboards  
- [ ] Wire Alertmanager + eight core runbooks  
- [ ] Sentry DSN via secrets (staging/prod)  
- [ ] Synthetic checks on `/health/ready`  
- [ ] Document log field contract in `observability/logging/`  
- [ ] Verify `request_id` appears in API error envelope, logs, and traces  

---

**Document Status:** Ready for observability stack & instrumentation implementation.  
**Next Phase:** [Phase 17 — Performance Optimization & Scalability](./17-performance-scalability-architecture.md). Implementation scaffold follows after performance architecture.
