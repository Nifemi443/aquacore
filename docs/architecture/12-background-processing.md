# Background Tasks, Event Processing & Automation Architecture

> **Phase:** 12 — Asynchronous Processing & Automation  
> **Status:** Approved — Pre-Implementation  
> **Project:** PondDesk Fish Farm Management Platform  
> **Stack:** FastAPI · PostgreSQL · Redis · Celery (+ Beat) · Pydantic v2 · Python 3.13+ · Docker  
> **Depends on:** Phase 4 §17–§18 · Phase 9 (events/notifications) · Phase 10–11 · ADR-008 · ADR-015

Designs background jobs, schedulers, domain-event handling, queues, notifications, reports, AI/file pipelines, and worker observability. No application code in this phase.

## Related Documents

- [Backend Architecture §17](./04-backend-architecture.md#17-background-task-design) — MVP → Celery path
- [Service Layer §8–§9, §13](./09-service-layer.md#8-domain-events) — Event catalog & notification triggers
- [API Presentation Layer](./11-api-presentation-layer.md) — `202 Accepted` for reports/uploads
- [ADR-008](../adr/ADR-008-in-process-event-bus-phase-1.md) — In-process event bus (MVP)
- [ADR-015](../adr/ADR-015-fastapi-backgroundtasks-to-celery-migration-path.md) — BackgroundTasks → Celery
- [Deployment](../deployment/README.md) — Worker/container topology (future)

---

## Table of Contents

- [1. Architecture Overview](#1-architecture-overview)
- [2. Folder Structure](#2-folder-structure)
- [3. Task Organization](#3-task-organization)
- [4. Scheduler Design](#4-scheduler-design)
- [5. Event Architecture](#5-event-architecture)
- [6. Queue Strategy](#6-queue-strategy)
- [7. Retry Strategy](#7-retry-strategy)
- [8. Notification Architecture](#8-notification-architecture)
- [9. AI Task Architecture](#9-ai-task-architecture)
- [10. Report Generation](#10-report-generation)
- [11. File Processing](#11-file-processing)
- [12. Monitoring Strategy](#12-monitoring-strategy)
- [13. Failure Recovery](#13-failure-recovery)
- [14. Testing Strategy](#14-testing-strategy)
- [15. Best Practices](#15-best-practices)
- [16. Architecture Decision Rationale](#16-architecture-decision-rationale)

---

## 1. Architecture Overview

### 1.1 Goals

| Goal | Approach |
|------|----------|
| Keep HTTP fast | Offload email, PDF, AI, bulk I/O to workers |
| Reliable side effects | Domain events after commit → enqueue tasks |
| Scheduled farm ops | Celery Beat (or equivalent) cron-like schedules |
| Scale independently | Separate worker pools per queue |
| Evolve without rewrite | Task façade stable from BackgroundTasks → Celery (ADR-015) |

### 1.2 Evolution Path (Authoritative)

| Stage | Events | Async execution | When |
|-------|--------|-----------------|------|
| **MVP (A)** | In-process `EventBus` (ADR-008) | FastAPI `BackgroundTasks` for light email/dispatch | Early vertical slices |
| **Production (B)** | Same `EventBus` protocol; handlers enqueue jobs | **Celery + Redis** broker/result | Reports, schedules, multi-instance API |
| **Scale (C)** | Optional transactional outbox → Redis/Kafka | Dedicated AI/report worker fleets | >50 farms / heavy AI (Phase 4 roadmap) |

**Recommended production default for PondDesk:** **Celery + Redis + Celery Beat**.  
**Alternatives considered:** Dramatiq (simpler Redis), ARQ (asyncio-native). Celery wins for Beat maturity, ops ecosystem, and ADR-015 alignment. ARQ remains acceptable if the team standardizes on asyncio-only workers — keep the same queue/task *contracts*.

### 1.3 Runtime Topology

```
┌─────────────┐     commit + publish      ┌──────────────────┐
│  FastAPI    │ ────────────────────────► │  EventBus        │
│  Services   │                           │  (in-process)    │
└─────────────┘                           └────────┬─────────┘
                                                   │ enqueue
                                                   ▼
                                          ┌──────────────────┐
                                          │  Redis Broker    │
                                          └────────┬─────────┘
                   ┌───────────────┬───────────────┼───────────────┐
                   ▼               ▼               ▼               ▼
            high_priority     default         reports            ai
            workers           workers         workers         workers
                   │               │               │               │
                   └───────────────┴───────┬───────┴───────────────┘
                                           ▼
                                    PostgreSQL / S3 / SMTP / SMS
```

### 1.4 Separation of Concerns

| Layer | Owns |
|-------|------|
| **Services** | Business TX, publish domain events after commit |
| **Event handlers** | Map events → create in-app notification and/or enqueue task |
| **Tasks** | Idempotent side effects (email, PDF, AI, imports) |
| **Scheduler** | Time-based scans that emit events or enqueue tasks |
| **Routes** | Never run heavy work; return `202` for long jobs |

---

## 2. Folder Structure

```
app/
├── domain/
│   └── events/                    # Event dataclasses (pure)
├── events/                        # Bus protocol + in-process impl + handlers registry
│   ├── bus.py
│   ├── handlers/                  # Thin: persist notification / enqueue task
│   └── outbox.py                  # Future transactional outbox
│
├── tasks/                         # Async job definitions (Celery tasks)
│   ├── celery_app.py              # App, broker, serializers, routes
│   ├── feeding/
│   │   └── reminders.py
│   ├── inventory/
│   │   └── alerts.py
│   ├── harvest/
│   │   └── reminders.py
│   ├── water/
│   │   └── alerts.py
│   ├── reports/
│   │   └── generate.py
│   ├── notifications/
│   │   ├── email.py
│   │   ├── sms.py
│   │   └── push.py
│   ├── ai/
│   │   └── jobs.py
│   ├── files/
│   │   └── processing.py
│   ├── farms/
│   │   └── summaries.py
│   ├── scheduler/                 # Beat entries + periodic task bodies
│   │   ├── schedules.py
│   │   └── jobs.py
│   ├── workers/                   # Worker process entrypoints / health
│   │   └── signals.py
│   └── shared/
│       ├── base.py                # Base task (acks, retry defaults)
│       ├── idempotency.py
│       └── context.py             # farm_id, request_id propagation
│
└── services/                      # Unchanged — may call task façade enqueue_* helpers
```

### 2.1 Folder Responsibilities

| Folder | Responsibility |
|--------|----------------|
| `tasks/feeding/` | Missed-feeding scans, daily feeding reminder dispatch |
| `tasks/inventory/` | Low-stock evaluation, vendor delivery reminders |
| `tasks/harvest/` | Upcoming harvest windows, post-harvest follow-ups |
| `tasks/water/` | Threshold re-checks, alert fan-out (if not sync) |
| `tasks/reports/` | PDF/Excel/CSV generation, status updates |
| `tasks/notifications/` | Channel adapters (email/SMS/push) |
| `tasks/ai/` | Growth/harvest/feed/mortality/anomaly jobs |
| `tasks/files/` | Image optimize, CSV import, bulk export |
| `tasks/scheduler/` | Beat schedule map + periodic orchestrators |
| `tasks/workers/` | Worker lifecycle hooks, graceful shutdown |
| `tasks/shared/` | Retries, idempotency keys, logging context |
| `domain/events/` | Event type definitions (no I/O) |
| `events/handlers/` | Subscribe to bus; enqueue only — no heavy logic |

**Rule:** Tasks may call **application services** or dedicated task services for DB work; they must not contain HTTP/FastAPI imports.

---

## 3. Task Organization

### 3.1 Task Catalog

| Task | Trigger | Queue | Priority | Notes |
|------|---------|-------|----------|-------|
| Daily feeding reminders | Beat 06:00 farm TZ | `notifications` | High | Per farm; respect prefs |
| Missed feeding detection | Beat every 15–60 min | `default` | High | Emit `FeedingMissed` / notify |
| Low feed inventory alerts | Event `InventoryLowStock` + hourly scan | `notifications` | High | Dedupe per SKU/day |
| Upcoming harvest notifications | Beat daily | `notifications` | Normal | 7 / 3 / 1 day windows |
| Water quality alerts | Event `WaterQualityAlert` | `high_priority` | High | CRITICAL may SMS later |
| Daily farm summary | Beat 18:00 / 06:00 | `reports` or `notifications` | Low | Email digest optional |
| Weekly reports | Beat Monday 06:00 | `reports` | Low | Auto or preference-gated |
| Monthly reports | Beat 1st of month | `reports` | Low | |
| Inactive pond detection | Beat daily | `default` | Low | No activity N days |
| Fish growth monitoring | Beat weekly / AI | `ai` | Low | Optional MVP skip |
| Vendor delivery reminders | Beat daily | `notifications` | Normal | From purchase ETA |
| AI recommendation jobs | Manual / Beat nightly | `ai` | Low | See §9 |
| Image processing | After upload event | `default` | Normal | Resize/optimize |
| Email notifications | `NotificationCreated` / channel task | `notifications` | High | |
| SMS notifications | Critical prefs only | `notifications` | High | Future |
| Push notifications | Mobile tokens | `notifications` | Normal | Future |
| Report generation | `ReportRequested` | `reports` | Normal | User-initiated |
| CSV import | Upload purpose IMPORT | `default` | Normal | Validate + upsert |
| Bulk export | `exports:run` | `reports` | Low | Admin |

### 3.2 Task Design Rules

1. **Idempotent** — same `(task_name, idempotency_key)` safe to run twice  
2. **Small** — one farm or one entity per task when possible (fan-out from scheduler)  
3. **Payload minimal** — IDs + correlation; load state inside task  
4. **Timeouts** — hard time limits per queue (§7)  
5. **No nested god-tasks** — orchestrator enqueues children  

### 3.3 Enqueue Façade

Services/handlers call `enqueue_report_generate(report_id)` etc. Implementation swaps BackgroundTasks → Celery without changing callers (ADR-015).

---

## 4. Scheduler Design

### 4.1 Component

**Celery Beat** (production) publishes periodic messages to Redis; workers execute them.  
MVP without Beat: cron container calling internal admin endpoints (discouraged long-term).

### 4.2 Schedule Map

| Job | Cadence | Timezone | Action |
|-----|---------|----------|--------|
| Feeding reminders | Daily 06:00 | Per-farm `FarmSettings.timezone` | Enqueue per-farm reminder tasks |
| Missed feeding scan | Every **15 minutes** | UTC tick; interpret farm local | Find due/unrecorded feedings |
| Inventory low-stock scan | Every **hour** | UTC | Safety net if event missed |
| Harvest window scan | Daily 06:30 | Farm TZ | 7/3/1 day notifications |
| Inactive ponds | Daily 02:00 | UTC | Flag / notify managers |
| Daily farm summary | Daily 18:00 | Farm TZ | Digest |
| Weekly report pack | **Monday** 06:00 | Farm TZ | Enqueue weekly report jobs |
| Monthly report pack | **1st** 06:00 | Farm TZ | Enqueue monthly reports |
| Growth / AI batch | Nightly 01:00 | UTC | Enqueue `ai` queue |
| Outbox relay (future) | Every **1 minute** | UTC | Publish unpublished outbox rows |

### 4.3 Scheduler Architecture

```
Celery Beat
  → periodic task "scan_missed_feedings"
      → query farms due
      → for each farm: enqueue_missed_feeding_check(farm_id)   # fan-out
          → worker creates notifications / emails
```

**Why fan-out?** Avoid one 30-minute monolithic task; failures isolate per farm; horizontal scale.

### 4.4 Timezone Rules

- Store schedules conceptually in farm local time via settings  
- Beat itself may run UTC; job body converts using farm timezone  
- Never assume server local time  

---

## 5. Event Architecture

### 5.1 Domain Event Catalog

| Event | Publisher (service) | Typical async follow-ups |
|-------|---------------------|--------------------------|
| `UserRegistered` | AuthService | Welcome email; verify email |
| `FishBatchCreated` | BatchService | Audit; cache invalidate |
| `FeedingRecorded` | FeedingService | Compliance metrics; clear missed state |
| `FeedingMissed` | Scheduler/Feeding | Notify managers + worker |
| `FeedInventoryUpdated` / `InventoryRestocked` | InventoryService | Clear low-stock |
| `InventoryLowStock` | InventoryService | Notify managers |
| `HarvestCompleted` | HarvestService | In-app + email; dashboard bust |
| `WaterQualityRecorded` / `WaterTestRecorded` | WaterService | If not HEALTHY → alert |
| `WaterQualityAlert` | WaterService | High-priority notify |
| `MortalityRecorded` | MortalityService | Spike detection task |
| `NotificationCreated` | NotificationService | Email/SMS/push dispatch |
| `ReportRequested` | ReportService | Generate artifact |
| `ReportReady` | Report task | Notify requesting user |
| `FileUploaded` | FileService | Image optimize / virus scan future |

### 5.2 Publishing Rules (Phase 9)

1. Publish **only after successful DB commit**  
2. Include `event_id`, `farm_id`, `actor_id`, `occurred_at`, `correlation_id` (`request_id`)  
3. Handler failures must **not** roll back the business transaction  
4. Handlers are **idempotent**  

### 5.3 Handling Flow

```
Service.commit()
  → EventBus.publish(HarvestCompleted)
      → Sync handlers (MVP): NotificationService.create_in_app(...)
      → Enqueue: send_email_notification(notification_id)
      → Enqueue: invalidate_dashboard_cache(farm_id)   # future
```

### 5.4 MVP vs Production Event Delivery

| Mode | Mechanism | Risk |
|------|-----------|------|
| MVP | In-process bus after commit | Lost handlers if process crashes post-commit |
| Hardening | **Transactional outbox** table written in same TX; relay task publishes | At-least-once delivery |
| Scale | Outbox → Redis Streams / Kafka | Multi-consumer |

Design outbox schema early even if relay ships in Stage C.

### 5.5 Event Bus Protocol

Services depend on `EventBus` protocol — not Celery. Handlers are the only place that know about queues. This preserves Clean Architecture and ADR-008.

---

## 6. Queue Strategy

### 6.1 Queues

| Queue | Purpose | Examples | Worker concurrency |
|-------|---------|----------|--------------------|
| `high_priority` | Time-sensitive ops alerts | Water CRITICAL, security emails | Low latency, modest concurrency |
| `default` | General async work | Image optimize, CSV import, scans | Medium |
| `notifications` | Channel delivery | Email, SMS, push | Isolated from heavy CPU |
| `reports` | CPU/IO heavy artifacts | PDF/Excel/CSV | Low concurrency, more memory |
| `ai` | Model inference / batch analytics | Growth, anomaly | Separate pool; GPU later |
| `dead_letter` | Exhausted retries | Manual replay | Ops only |

### 6.2 Why Separate Queues

- A stuck PDF job must not block water-critical SMS  
- AI jobs can saturate CPU without starving reminders  
- Scale reports horizontally without scaling notification workers  
- Different timeouts and retry budgets per class  

### 6.3 Routing

Celery `task_routes` map `tasks.reports.*` → `reports`, `tasks.notifications.*` → `notifications`, `tasks.ai.*` → `ai`, etc.

### 6.4 Priority Within Queue

Use queue separation first; optional Celery priority for “CRITICAL water” vs “INFO digest” inside `notifications` if needed.

---

## 7. Retry Strategy

### 7.1 Failure Classes

| Failure | Retry? | Strategy |
|---------|--------|----------|
| Transient DB / connection | Yes | Exponential backoff + jitter |
| Redis / broker blip | Yes | Celery automatic retry |
| SMTP / email provider 5xx | Yes | Backoff; max 5–8 |
| SMS provider timeout | Yes | Backoff; circuit-break after N |
| External AI API 429/5xx | Yes | Longer backoff; respect `Retry-After` |
| Validation / business bug | **No** | Fail → DLQ + alert |
| Missing entity (deleted) | **No** | Ack success or soft-skip (idempotent) |
| Permanent 4xx from provider | **No** | DLQ |

### 7.2 Default Policy

| Parameter | Default | Reports | AI | Notifications |
|-----------|---------|---------|-----|---------------|
| Max retries | 5 | 3 | 3 | 8 |
| Backoff | Exp base 2s, cap 15m | Exp base 5s | Exp base 10s | Exp base 2s |
| Jitter | ±20% | Yes | Yes | Yes |
| Soft time limit | 60s | 10–15 min | 15–30 min | 30s |
| Hard time limit | 90s | 20 min | 45 min | 60s |

### 7.3 Dead-Letter Queue

After max retries:

1. Move/store failure payload + exception + `task_id`  
2. Mark related domain row if any (`reports.status = FAILED`)  
3. Alert ops (Sentry / Slack)  
4. Support **manual replay** via admin tool or `celery replay`  

### 7.4 Idempotency Keys

Format: `{event_id}` or `{task}:{farm_id}:{business_key}:{date}`  
Store processed keys in Redis (TTL 7d) or `task_executions` table for critical jobs.

---

## 8. Notification Architecture

### 8.1 Channels

| Channel | MVP | GA | Notes |
|---------|-----|-----|-------|
| **In-app** | Required | Required | Written synchronously in handler (fast DB insert) |
| **Email** | Background task | Required | Template + preference check |
| **SMS** | — | Optional | CRITICAL water / security only |
| **Push** | — | Mobile GA | FCM/APNs |
| **WhatsApp** | — | Future | Same notification outbox; provider adapter |

### 8.2 Workflow

```
Domain event (e.g. InventoryLowStock)
  → Handler: create Notification row (in-app)
  → Publish NotificationCreated OR enqueue dispatch directly
  → Task: load Notification + UserPreferences
  → If email enabled → send via provider
  → Record delivery attempt (success/fail)
```

### 8.3 Trigger → Message Map

| Trigger | Severity | Audience | Channels |
|---------|----------|----------|----------|
| Feed inventory below threshold | WARNING | Managers | In-app + email |
| Harvest due in 7 / 3 / 1 days | INFO | Managers | In-app + email |
| Water quality warning | WARNING | Managers | In-app + email |
| Water quality critical | CRITICAL | Managers | In-app + email (+ SMS future) |
| Missed feeding | WARNING | Managers + assigned worker | In-app + email |
| Successful harvest | INFO | Managers | In-app |
| Report ready | INFO | Requesting user | In-app + email |
| Daily / weekly digest | INFO | Opt-in users | Email |

### 8.4 Preferences & Quiet Hours

- `UserPreferences` / farm notification settings gate channels  
- Quiet hours: delay non-CRITICAL email to next window  
- Deduplicate: same `(type, entity_id, day)` once  

### 8.5 Why Not Send Email in the Service TX

SMTP latency and provider outages must not fail harvest recording. In-app row is enough for UX; email is best-effort with retries.

---

## 9. AI Task Architecture

### 9.1 Future AI Jobs

| Job | Input | Output | Cadence |
|-----|-------|--------|---------|
| Growth prediction | Batch weights, feed, age | Predicted weight curve | Nightly / on demand |
| Harvest forecasting | Growth + target weight | Suggested harvest window | Nightly |
| Feed optimization | FCR history, inventory | Ration suggestions | Weekly |
| Mortality prediction | Mortality + water + density | Risk score | Daily |
| Water quality analysis | Recent water_records | Anomaly flags | On `WaterTestRecorded` or hourly |
| Farm performance insights | KPIs | Narrative summary | Weekly |
| Anomaly detection | Multi-signal | Alert events | Continuous batch |

### 9.2 Async Execution Model

```
API or Beat
  → create AiJob row (PENDING)
  → enqueue tasks.ai.run_job(job_id) on `ai` queue
  → worker loads features from DB (read replica preferred)
  → call model service / library
  → persist results + AiJob READY/FAILED
  → optional NotificationCreated
```

### 9.3 Constraints

- **Never** block HTTP on model inference  
- Isolate `ai` workers; failures must not affect feeding reminders  
- Version models (`model_version` on results)  
- Feature extraction stays in worker/service — not in routes  
- PII minimization in any external model API  

---

## 10. Report Generation

### 10.1 Report Types

| Type | Trigger | Formats |
|------|---------|---------|
| Daily | Beat / user | PDF, CSV |
| Weekly | Beat Monday / user | PDF, Excel, CSV |
| Monthly | Beat 1st / user | PDF, Excel, CSV |
| Custom range | User `POST /reports` | PDF, Excel, CSV |

### 10.2 Async Flow

```
POST /reports → ReportService.request_report
  → row status=PENDING
  → publish ReportRequested
  → 202 Accepted { report_id }
Worker:
  → status=RUNNING
  → aggregate queries
  → render PDF/XLSX/CSV → object storage
  → status=READY + file_id
  → notify user
```

### 10.3 Why Background

- PDF/Excel rendering is CPU- and memory-heavy  
- Large date ranges can exceed HTTP timeouts  
- Retries and partial failure handling need a job state machine  
- API instances stay responsive for field workers recording feedings  

### 10.4 State Machine

`PENDING → RUNNING → READY | FAILED` (optional `CANCELLED`)

---

## 11. File Processing

| Workload | Sync in request? | Async task |
|----------|------------------|------------|
| Upload receive + virus magic-byte check | Light validation sync | — |
| Persist to object storage | Sync or short async | Prefer sync for UX if <5MB |
| Image optimization / thumbnails | No | `tasks.files.optimize_image` |
| CSV imports (stock, water bulk) | No | Validate → stage → apply in TX batches |
| Bulk exports | No | Same as reports queue |
| File validation (schema, row limits) | Partial sync | Full validation in worker for large CSV |

**Event:** `FileUploaded` → enqueue optimize/import by `purpose`.

---

## 12. Monitoring Strategy

### 12.1 Metrics

| Metric | Why |
|--------|-----|
| Task success / failure rate | SLO for async reliability |
| Retry count per task | Provider or DB health signal |
| Queue depth (per queue) | Scaling & backlog alerts |
| Worker liveness / heartbeats | Orchestrator restarts |
| Task runtime p50/p95 | Catch regressions |
| Time in queue | Latency for notifications |
| DLQ depth | Ops attention |
| Report READY latency | User-facing async UX |

### 12.2 Tooling

- Celery events / Flower (or exporter) → Prometheus  
- Structured logs with `task_id`, `farm_id`, `correlation_id`, `event_id`  
- Sentry for task exceptions  
- Alerts: queue depth > threshold, DLQ > 0, notification failure spike  

### 12.3 Health

- Worker container: process up + broker ping  
- API readiness may check Redis if required for enqueue  
- Beat process monitored separately (missed schedule alert)

---

## 13. Failure Recovery

| Strategy | Description |
|----------|-------------|
| Automatic retry | §7 policies |
| Idempotent replay | Safe re-run with same key |
| DLQ + alert | Human triage |
| Manual replay | Admin replays DLQ or `report_id` |
| Compensating notify | Mark report FAILED; user can retry via API |
| Outbox relay catch-up | Republish unpublished events |
| Poison message quarantine | After N parse failures, isolate payload |

**Recovery principle:** Business data committed in API TX is source of truth; async layer converges eventually.

---

## 14. Testing Strategy

| Layer | What | How |
|-------|------|-----|
| **Unit** | Task pure helpers, template render, idempotency key | pytest, no broker |
| **Task tests** | Task body with DB fixtures | Eager Celery mode (`task_always_eager`) in CI |
| **Handler tests** | Event → enqueue called | Mock façade |
| **Queue routing** | Task lands on correct queue | Unit assert routes config |
| **Failure / retry** | Raise transient → retry count | Celery eager + fake clock or unit mock |
| **Scheduler** | Fan-out enqueues N farms | Mock enqueue |
| **Integration** | Redis + worker smoke (optional CI job) | Docker compose |
| **Contract** | API returns 202 and PENDING report | httpx |

Do not require live SMTP in CI — use fake email backend.

---

## 15. Best Practices

1. **Idempotent tasks** — always  
2. **Small tasks** — fan-out by farm/entity  
3. **Queue separation** — never mix AI and critical alerts  
4. **Timeouts** — soft + hard limits on every task  
5. **Graceful shutdown** — warm shutdown; finish current task; don’t ack early  
6. **Propagate correlation_id** — from HTTP → event → task logs  
7. **Enqueue after commit** — never before  
8. **Façade for enqueue** — swap BackgroundTasks ↔ Celery  
9. **Prefer events over cron for reactions** — cron is for time-based scans only  
10. **Dedupe notifications** — prevent alert storms  
11. **No FastAPI in workers** — shared services/domain only  
12. **Observe queues** — depth and DLQ are first-class SLOs  
13. **Secrets** — workers get same SM/env as API for SMTP/DB  
14. **Backpressure** — reject/slow AI enqueue if `ai` queue depth critical  

---

## 16. Architecture Decision Rationale

| # | Decision | Alternatives | Rationale |
|---|----------|--------------|-----------|
| ASYNC-001 | Celery + Redis for production | Dramatiq, ARQ, RQ | Beat + ecosystem; ADR-015 path |
| ASYNC-002 | BackgroundTasks only in early MVP | Celery day one | YAGNI until multi-instance/reports (ADR-015) |
| ASYNC-003 | In-process EventBus first | Kafka day one | ADR-008; protocol stays stable |
| ASYNC-004 | Handlers enqueue; services don’t call Celery | Service → Celery direct | Keeps domain free of broker |
| ASYNC-005 | Multi-queue topology | Single queue | Isolate reports/AI from alerts |
| ASYNC-006 | Fan-out periodic jobs per farm | One global scan task | Isolation + scale |
| ASYNC-007 | In-app sync; email async | All channels sync | UX + reliability |
| ASYNC-008 | Reports always async (`202`) | Sync PDF | Timeouts & memory |
| ASYNC-009 | AI on dedicated queue | Same as default | Protect operational alerts |
| ASYNC-010 | Exponential backoff + DLQ | Infinite retry | Bound cost; enable ops replay |
| ASYNC-011 | Transactional outbox as hardening | Trust in-process forever | Crash-safe at-least-once |
| ASYNC-012 | Idempotency keys | Fire-and-forget | Safe retries & replays |
| ASYNC-013 | WhatsApp/SMS as channel adapters | Hardcode providers in tasks | Future providers without redesign |
| ASYNC-014 | Design-only this phase | Implement workers now | Matches phases 5–11 discipline |

### 16.1 Alignment Map

| Phase / ADR | Contribution |
|-------------|--------------|
| Phase 4 §17–§18 | Background + event phasing |
| Phase 9 | Event catalog, notification triggers |
| Phase 11 | HTTP `202` for long work |
| ADR-008 | In-process bus MVP |
| ADR-015 | BackgroundTasks → Celery |
| Phase 12 | This specification |

### 16.2 Implementation Readiness Checklist

- [ ] Define `EventBus` protocol + in-process bus  
- [ ] Register handlers that create notifications / call enqueue façade  
- [ ] Implement enqueue façade (BackgroundTasks backend first)  
- [ ] Add Celery app, queues, Beat schedules when reports ship  
- [ ] Report state machine + worker  
- [ ] Email task + fake backend for tests  
- [ ] Metrics: queue depth, success/fail, DLQ  
- [ ] Document Docker services: `api`, `worker`, `beat`, `redis`  
- [ ] Outbox table migration reserved for hardening sprint  

---

**Document Status:** Ready for async infrastructure & worker implementation.  
**Next Phase:** [Phase 13 — Testing Architecture](./13-testing-architecture.md), then Phase 14 — scaffold & vertical-slice implementation.
