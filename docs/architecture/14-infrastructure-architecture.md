# Infrastructure, Docker & Development Environment Architecture

> **Phase:** 14 — Infrastructure & Developer Platform  
> **Status:** Approved — Pre-Implementation  
> **Project:** PondDesk Fish Farm Management Platform  
> **Stack:** Docker · Docker Compose · PostgreSQL 15+ · Redis · Nginx · Celery · FastAPI · Next.js · GitHub Actions · Python 3.13+  
> **Depends on:** Phase 4 (config/startup) · Phase 6 (migrations) · Phase 10 (secrets) · Phase 11 (health) · Phase 12 (workers) · Phase 13 (CI tests)

Designs local-to-production infrastructure: repo layout, containers, Compose, environments, Nginx, DB/Redis/storage, logging, DX tooling, backups, health, and scale-out. No Dockerfiles, Compose YAML, or scripts implemented in this phase.

## Related Documents

- [Deployment Index](../deployment/README.md) — Runtime quick reference (this document is canonical for Phase 14 infra)
- [CI/CD & Production Deployment (Phase 15)](./15-cicd-deployment-architecture.md) — Pipelines, promotion, rollback
- [Observability Architecture (Phase 16)](./16-observability-architecture.md) — Logs, metrics, traces, alerts
- [Performance & Scalability (Phase 17)](./17-performance-scalability-architecture.md) — Scale triggers & caching
- [Backend Architecture §4–§5](./04-backend-architecture.md#4-application-startup-lifecycle) — Startup & settings
- [Migration Strategy](./06-migration-strategy.md) — Alembic deploy/rollback
- [Security Architecture §11](./10-security-architecture.md#11-secrets-management) — Secrets
- [Background Processing](./12-background-processing.md) — Worker/Beat/Redis queues
- [Testing Architecture](./13-testing-architecture.md) — CI test stages
- [API Contract §1.2](./03-api-contract.md#12-base-url--environment) — Environment URLs

---

## Table of Contents

- [1. Infrastructure Overview](#1-infrastructure-overview)
- [2. Project Structure](#2-project-structure)
- [3. Docker Architecture](#3-docker-architecture)
- [4. Docker Compose Design](#4-docker-compose-design)
- [5. Environment Management](#5-environment-management)
- [6. Local Development Workflow](#6-local-development-workflow)
- [7. Nginx Architecture](#7-nginx-architecture)
- [8. Database Infrastructure](#8-database-infrastructure)
- [9. Redis Strategy](#9-redis-strategy)
- [10. File Storage Strategy](#10-file-storage-strategy)
- [11. Logging Architecture](#11-logging-architecture)
- [12. Developer Experience](#12-developer-experience)
- [13. Security Best Practices](#13-security-best-practices)
- [14. Backup & Recovery](#14-backup--recovery)
- [15. Health Monitoring](#15-health-monitoring)
- [16. Scalability Roadmap](#16-scalability-roadmap)
- [17. Architecture Decision Rationale](#17-architecture-decision-rationale)

---

## 1. Infrastructure Overview

### 1.1 Goals

| Goal | Approach |
|------|----------|
| **Parity** | Same container images locally, staging, production (config differs) |
| **One-command DX** | `make up` brings API + DB + Redis + worker (+ optional frontend/nginx) |
| **Safe secrets** | Never in git; `.env.example` placeholders only |
| **Observable** | Structured logs, health probes, metrics-ready |
| **Scalable path** | Compose today → Swarm/K8s later without rewriting apps |
| **Monolith-first** | Single FastAPI deployable + workers (ADR-002) |

### 1.2 Environment Topology

```
┌─────────────────────────────────────────────────────────────┐
│  Edge: Nginx / ALB (TLS, routing, headers, rate limit)      │
└───────────────┬─────────────────────────────┬───────────────┘
                │ /api/*                      │ /, /_next/*
                ▼                             ▼
         FastAPI (×N)                   Next.js (×N)
                │                             │
     ┌──────────┼──────────┐                  │
     ▼          ▼          ▼                  │
  Celery     Celery     Redis ◄───────────────┘ (optional cache)
  Worker     Beat         │
     │          │         │ broker/cache
     └──────────┴─────────┼──────────────┐
                          ▼              ▼
                     PostgreSQL    Object Storage
                                   (local/MinIO/S3)
```

### 1.3 Current Repo Note

Frontend MVP currently lives at repository root (`src/`). Target layout (§2) introduces `backend/` and optionally relocates the Next.js app to `frontend/`. Migration can be incremental; Compose paths must match the chosen layout at implementation time.

### 1.4 Non-Goals (This Phase)

- No Terraform/K8s manifests required for MVP  
- No multi-region active-active design yet (§16 Phase E)  
- No implementation of Dockerfiles or GitHub Actions YAML  

---

## 2. Project Structure

### 2.1 Target Monorepo Layout

```
ponddesk/                          # repository root
├── backend/                       # FastAPI application (Python 3.13+)
│   ├── app/                       # Application package (Phases 4–12)
│   ├── alembic/                   # Migrations (ADR-010: at backend project root)
│   ├── tests/                     # Phase 13 suites
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── Dockerfile.dev
│
├── frontend/                      # Next.js 14 app (moved from root when ready)
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── Dockerfile.dev
│
├── infrastructure/                # Non-app ops assets (optional umbrella)
│   ├── nginx/                     # Reverse proxy configs
│   ├── redis/                     # redis.conf snippets (optional)
│   └── monitoring/                # Prometheus/Grafana stubs (future)
│
├── docker/                        # Compose entrypoints & shared Docker assets
│   ├── docker-compose.yml         # Local full stack
│   ├── docker-compose.dev.yml     # Overrides: hot reload, ports
│   ├── docker-compose.test.yml    # CI Postgres (+ Redis)
│   ├── docker-compose.prod.yml    # Production-like (staging)
│   └── .dockerignore templates
│
├── nginx/                         # Or under infrastructure/nginx/
│   ├── nginx.conf
│   ├── conf.d/ponddesk.conf
│   └── certs/                     # Local mkcert only (gitignored)
│
├── scripts/                       # DX & ops scripts (invoked by Make)
│   ├── wait-for-it.sh
│   ├── migrate.sh
│   ├── seed.sh
│   ├── backup-db.sh
│   └── reset-db.sh
│
├── docs/                          # Canonical architecture (existing)
├── .github/
│   └── workflows/                 # CI/CD (lint, test, build, deploy)
├── Makefile                       # One-command developer interface
├── .env.example                   # Documented placeholders (no secrets)
├── .env                           # Local secrets (gitignored)
├── .pre-commit-config.yaml
└── README.md                      # Quick start → points to this phase
```

### 2.2 Directory Purposes

| Directory | Purpose |
|-----------|---------|
| `backend/` | API, domain, workers entrypoints, Alembic, backend tests |
| `frontend/` | Next.js UI, its own Node toolchain |
| `infrastructure/` | Long-lived ops configs not tied to a single app build |
| `docker/` | Compose files composing all services |
| `nginx/` | Reverse proxy, TLS termination (local/staging) |
| `scripts/` | Idempotent automation for migrate/seed/backup |
| `docs/` | Architecture phases & ADRs — not regenerated ad hoc |
| `.github/` | CI: quality gates (Phase 13) + image build/push |
| `.env.example` | Contract of required env vars for onboarding |

### 2.3 Image Build Contexts

| Service | Context | Dockerfile |
|---------|---------|------------|
| API / Worker / Beat | `backend/` | Multi-stage prod; `Dockerfile.dev` for reload |
| Frontend | `frontend/` | Multi-stage Next.js standalone output |
| Nginx | `nginx/` | Official nginx + config mount |
| Postgres / Redis | Official images | No custom build |

Worker and Beat **reuse the API image** with different `CMD` (Celery worker / beat) — one artifact, multiple processes.

---

## 3. Docker Architecture

### 3.1 Containers

| Container | Responsibility |
|-----------|----------------|
| **backend (api)** | FastAPI via Uvicorn/Gunicorn; serves `/api/v1`, `/health` |
| **frontend** | Next.js server (or static export behind Nginx in simpler deploys) |
| **postgres** | System of record; persistent volume |
| **redis** | Celery broker/result; cache; rate-limit counters |
| **worker** | Celery consumer: reports, email, file jobs, AI queue |
| **scheduler** | Celery Beat: periodic scans & digests (Phase 12) |
| **nginx** | TLS, routing, compression, security headers, edge rate limits |
| **mailpit** (dev only) | Catch SMTP for local email testing |
| **minio** (dev optional) | S3-compatible local object storage |

### 3.2 Image Principles

- **Multi-stage builds** — build deps discarded; slim runtime  
- **Non-root user** in production images  
- **Pinned base tags** (digest preferred in prod)  
- **No secrets in layers** — runtime env / mounted secrets only  
- **Healthcheck instruction** on API, Postgres, Redis  
- **Read-only rootfs** where practical (tmpfs for temp)  

### 3.3 Process Model

| Process | Runs in | Notes |
|---------|---------|-------|
| Gunicorn + Uvicorn workers | `api` | Stateless; scale horizontally |
| Celery worker | `worker` | Prefork/gevent per queue config |
| Celery Beat | `scheduler` | **Single instance** (leadership) |
| Next.js | `frontend` | Stateless |
| Nginx | `nginx` | Stateless |

---

## 4. Docker Compose Design

### 4.1 Services (Local / Staging Compose)

| Service | Image / Build | Ports (dev) | Depends on |
|---------|---------------|-------------|------------|
| `postgres` | `postgres:15` | `5432` | — |
| `redis` | `redis:7` | `6379` | — |
| `api` | `backend` Dockerfile | `8000` | postgres healthy, redis healthy |
| `worker` | same image | — | postgres, redis |
| `scheduler` | same image | — | postgres, redis |
| `frontend` | `frontend` Dockerfile | `3000` | api (soft) |
| `nginx` | nginx + config | `80`/`443` | api, frontend |
| `mailpit` | axllent/mailpit | `8025` UI | — |
| `minio` | minio/minio (optional) | `9000` | — |

### 4.2 Networks

| Network | Purpose |
|---------|---------|
| `ponddesk_internal` | Bridge; all app services; no host exposure required for DB/Redis in prod-like |
| Host published ports | Dev convenience only (`5432`, `8000`, `3000`) |

Postgres and Redis **must not** be publicly reachable in staging/production.

### 4.3 Volumes

| Volume | Mount | Purpose |
|--------|-------|---------|
| `postgres_data` | `/var/lib/postgresql/data` | Durable DB |
| `redis_data` | `/data` | Optional AOF persistence |
| `media_data` | `/var/ponddesk/media` | Local file storage (dev) |
| `nginx_certs` | certs path | Local TLS (mkcert) |
| Bind mounts (dev) | `backend/app`, `frontend/src` | Hot reload |

### 4.4 Health Checks

| Service | Check |
|---------|-------|
| `postgres` | `pg_isready -U ponddesk` |
| `redis` | `redis-cli ping` |
| `api` | `GET /health/live` then ready uses `/health/ready` |
| `worker` | Celery inspect ping / custom heartbeat file |
| `frontend` | `GET /` or `/api/health` if defined |
| `nginx` | `nginx -t` + wget localhost |

### 4.5 Startup Order

```
1. postgres, redis          → healthy
2. api                      → migrate job (oneshot) OR entrypoint migrate
3. worker, scheduler        → after migrate + redis
4. frontend                 → after api reachable (optional wait)
5. nginx                    → after api + frontend
```

**Migrations:** Prefer a **oneshot `migrate` service** (`alembic upgrade head`, `restart: on-failure`) before `api` scales, or an entrypoint that migrates then execs — never race multiple migrators (use Compose `depends_on` + lock or job).

### 4.6 Compose File Split

| File | Role |
|------|------|
| `docker-compose.yml` | Base services & volumes |
| `docker-compose.dev.yml` | Hot reload, Mailpit, published ports |
| `docker-compose.test.yml` | Postgres (+ Redis) only for pytest |
| `docker-compose.prod.yml` | Resource limits, no bind mounts, restart policies |

Invoke: `docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up`.

---

## 5. Environment Management

### 5.1 Profiles

| Profile | `APP_ENV` | Characteristics |
|---------|-----------|-----------------|
| **Development** | `development` | DEBUG, relaxed CORS, local disk/MinIO, Mailpit SMTP, verbose logs |
| **Testing** | `test` | Ephemeral DB, fixed `JWT_SECRET`, fake storage/email, Celery eager |
| **Staging** | `staging` | Prod-like; sandbox SMTP; separate DB; debug tools limited |
| **Production** | `production` | DEBUG=false; secrets manager; strict CORS; JSON logs; no docs UI |

Settings via Pydantic `BaseSettings` — validate at boot; **crash if required secrets missing in production** (Phase 4 / 10).

### 5.2 Variable Catalog (Illustrative)

| Category | Examples |
|----------|----------|
| **App** | `APP_ENV`, `LOG_LEVEL`, `CORS_ORIGINS`, `API_PREFIX` |
| **JWT** | `JWT_SECRET` / keys, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `JWT_ALGORITHM` |
| **Database** | `DATABASE_URL`, `DB_POOL_SIZE`, `DB_MAX_OVERFLOW` |
| **Redis** | `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` |
| **Storage** | `STORAGE_BACKEND=local|s3`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` |
| **SMTP** | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` |
| **AI** | `AI_API_KEY`, `AI_BASE_URL` (optional; empty disables) |
| **Observability** | `SENTRY_DSN`, `OTEL_EXPORTER_OTLP_ENDPOINT` |

### 5.3 Secrets Management

| Environment | Mechanism |
|-------------|-----------|
| Local | `.env` (gitignored); copy from `.env.example` |
| CI | GitHub Actions secrets / OIDC |
| Staging/Prod | AWS Secrets Manager / GCP SM / Vault; inject as env or files |
| Rotation | JWT `kid` overlap; DB credentials via IAM long-term |

**Never** commit `.env`, private keys, or dump secrets into Compose `environment:` hardcoded values in git.

### 5.4 Frontend Env

| Var | Purpose |
|-----|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Browser-callable API origin |
| Server-only secrets | None required for MVP BFF; if added, no `NEXT_PUBLIC_` prefix |

---

## 6. Local Development Workflow

```
Clone Project
    ↓
Configure Environment   (.env from .env.example)
    ↓
Build Containers        (make build / compose build)
    ↓
Run Migrations          (make migrate)
    ↓
Seed Database           (make seed — roles, demo farm)
    ↓
Start Backend Stack     (api + worker + scheduler + redis + postgres)
    ↓
Start Frontend          (compose or pnpm/npm dev)
    ↓
Run Tests               (make test-unit / test-integration)
```

### 6.1 Step Detail

| Step | Action | Notes |
|------|--------|-------|
| **Clone** | `git clone …` | Install Docker Desktop / Engine + Compose v2 |
| **Configure** | `cp .env.example .env` | Generate local `JWT_SECRET` (≥32 bytes) |
| **Build** | `make build` | First run pulls Postgres/Redis |
| **Migrate** | `make migrate` | `alembic upgrade head` against Compose Postgres |
| **Seed** | `make seed` | ADMIN/MANAGER/WORKER roles + demo farm (idempotent) |
| **Backend** | `make up` | Hot reload via bind mount in dev override |
| **Frontend** | `make up-web` or `npm run dev` | Point at `http://localhost:8000` or via Nginx |
| **Tests** | `make test` | Unit without Docker; integration uses `docker-compose.test.yml` |

### 6.2 Day-to-Day Loops

- API code change → Uvicorn reload  
- Worker code change → worker restart (or watch)  
- Migration change → `make migrate`  
- DB mess → `make reset-db` (destroy volume + migrate + seed)  

---

## 7. Nginx Architecture

### 7.1 Responsibilities

| Concern | Behavior |
|---------|----------|
| **HTTPS** | TLS 1.2+; redirect HTTP→HTTPS; HSTS |
| **API routing** | `location /api/` → `api:8000` |
| **Web routing** | `/` → `frontend:3000` |
| **Health** | `/health` may bypass to API or dedicated |
| **Compression** | gzip/brotli for text/JSON |
| **Caching** | Cache immutable `/_next/static` aggressively; **no cache** for `/api/` |
| **Security headers** | Align Phase 10 (nosniff, frame deny, referrer, CSP for web) |
| **Rate limiting** | `limit_req` zones for `/api/v1/auth/login` and general API |
| **Uploads** | `client_max_body_size` ≥ 10 MB (Phase 3) |
| **WebSockets** | Future IoT: upgrade headers when needed |

### 7.2 Local vs Cloud Edge

| Context | TLS / Proxy |
|---------|-------------|
| Local | Nginx in Compose + mkcert **or** hit ports 3000/8000 directly |
| Staging/Prod VM | Nginx or Caddy on host |
| Cloud | ALB/Cloudflare in front; Nginx optional as ingress |

### 7.3 Upstream Timeouts

Long report downloads: raise `proxy_read_timeout` for `/api/v1/reports/*/download` only; keep auth endpoints tight.

---

## 8. Database Infrastructure

### 8.1 Runtime

| Item | Spec |
|------|------|
| Engine | PostgreSQL **15+** |
| Naming | `ponddesk` DB; app role least-privilege |
| Pooling | SQLAlchemy async pool (`pool_size`/`max_overflow`); PgBouncer later if needed |
| Migrations | Alembic on deploy (Phase 6 expand/contract) |
| Health | `pg_isready` + API `/health/ready` `SELECT 1` |

### 8.2 Migration Workflow

```
dev: make migrate
CI: alembic upgrade head on test DB
deploy: pre-start job / init container → upgrade head → start api/workers
rollback: Phase 6 expand/contract; never blind downgrade in prod without plan
```

### 8.3 Backups & Monitoring

See §14. Enable `pg_stat_statements` in staging/prod. Alert on connection saturation, disk, replication lag (when replicas exist).

### 8.4 Connection Hygiene

- API and workers use separate pool budgets  
- Short statement timeouts for web requests; longer for report workers  
- SSL required to managed Postgres in production  

---

## 9. Redis Strategy

| Use case | Key pattern / notes | When |
|----------|---------------------|------|
| **Task queue (broker)** | Celery queues (`high_priority`, `default`, …) | Production async (Phase 12) |
| **Result backend** | Short TTL; or disable if unused | Optional |
| **Caching** | `farm:{id}:dashboard` etc. (Phase 3) | Scale Phase A |
| **Rate limiting** | Sliding window counters | Prod hardening |
| **Access jti denylist** | TTL = remaining access life | Optional logout immediacy |
| **Idempotency keys** | Task dedupe TTL 7d | Workers |
| **Session storage** | Prefer refresh tokens in **Postgres**; Redis not primary session store | — |
| **Temporary data** | Short-lived locks / Beat coordination | As needed |

**Persistence:** AOF optional for broker durability; accept task at-least-once + idempotency.  
**Eviction:** `volatile-lru` or split Redis instances (cache vs broker) at scale.

---

## 10. File Storage Strategy

| Environment | Backend | Paths / buckets |
|-------------|---------|-----------------|
| **Local** | Disk volume `media_data` or MinIO | `/var/ponddesk/media` |
| **Test** | In-memory fake (ADR-012) | — |
| **Staging/Prod** | S3-compatible (AWS S3, R2, MinIO) | `ponddesk-{env}-files` |

### 10.1 Object Classes

| Class | Examples | Access |
|-------|----------|--------|
| Images | Profile, farm logo, harvest, water photos | Signed URLs (1h) |
| Reports | PDF, Excel, CSV | Signed URLs; farm-scoped ACL in DB |
| Imports | Uploaded CSV staging | Private; delete after process |
| Exports | Bulk admin exports | Short-lived signed URL |

Storage accessed only via **storage protocol** in app (ADR-012) — never raw SDK in routes.

---

## 11. Logging Architecture

### 11.1 Streams

| Source | Destination | Format |
|--------|-------------|--------|
| **Application (API)** | stdout | Structured JSON (ADR-011) |
| **Worker / Beat** | stdout | JSON + `task_id`, `farm_id` |
| **Nginx access** | stdout/file | Combined or JSON |
| **Nginx error** | stderr | — |
| **PostgreSQL** | managed logs / stderr | Slow query log on |
| **Aggregator** | Loki/CloudWatch/ELK | Ship from Docker logging driver |

### 11.2 Fields (App)

`timestamp`, `level`, `message`, `request_id`, `user_id`, `farm_id`, `path`, `status_code`, `duration_ms` — **never** passwords, tokens, or raw card-like secrets.

### 11.3 Rotation

- Containers: rely on orchestrator log rotation / driver `max-size`  
- Host Nginx files: `logrotate` weekly, compress, retain 14–30 days  
- Audit trail remains in **Postgres `audit_log`**, not only files  

---

## 12. Developer Experience

### 12.1 Makefile Targets (Recommended)

| Target | Purpose |
|--------|---------|
| `make up` | Start core stack |
| `make down` | Stop stack |
| `make build` | Build images |
| `make migrate` | Alembic upgrade |
| `make seed` | Idempotent seed |
| `make reset-db` | Volume wipe + migrate + seed |
| `make test-unit` | Pytest unit markers |
| `make test-integration` | Compose test DB + pytest |
| `make lint` | Ruff + mypy |
| `make logs` | Tail api/worker |
| `make shell-api` | Exec into api container |

### 12.2 Tooling

| Tool | Role |
|------|------|
| **Makefile** | Stable DX interface |
| **Pre-commit** | Ruff format/lint, mypy (Phase 13) |
| **Env validation** | Pydantic settings on boot; `make doctor` checks Docker/.env |
| **One-command setup** | `make bootstrap` = copy env + build + up + migrate + seed |
| **Mailpit UI** | Inspect emails at `:8025` |
| **Task runner** | Make is enough; Taskfile optional |

### 12.3 IDE

- Open workspace at monorepo root  
- Python venv optional when using containers for runtime  
- Recommend Dev Containers later (`devcontainer.json`) — optional Phase 14+ enhancement  

---

## 13. Security Best Practices

| Control | Practice |
|---------|----------|
| **Secrets** | SM/Vault in prod; `.env` local only; scan for leaks in CI |
| **Env isolation** | Separate AWS accounts/projects per env; separate DBs |
| **Container security** | Non-root; minimal base; no privileged; drop caps |
| **Least privilege** | DB role: DML on app schema only; no SUPERUSER for app |
| **Network** | Internal Docker network; publish only Nginx (prod) |
| **Image scanning** | Trivy/Grype in CI on built images |
| **Dependency scanning** | `pip-audit`, npm audit / Dependabot |
| **Supply chain** | Pin versions; verify base image provenance |
| **TLS** | Terminate at edge; internal mTLS optional later |
| **Docs** | Disable `/docs` in production or protect |

Align with Phase 10 for app-level auth; infrastructure enforces perimeter.

---

## 14. Backup & Recovery

### 14.1 What to Back Up

| Asset | Method | Frequency (prod starting point) |
|-------|--------|----------------------------------|
| **PostgreSQL** | `pg_dump` / managed automated snapshots | Daily full + WAL/PITR if managed |
| **Object storage** | Bucket versioning + cross-region replication | Continuous |
| **Configuration** | Infra-as-code + secret store (not flat file backups of `.env`) | On change |
| **Redis** | Optional AOF; **not** source of truth | — |

### 14.2 Restore Process

1. Declare incident; freeze deploys  
2. Provision empty Postgres (or point-in-time)  
3. Restore dump / PITR  
4. Verify `alembic_version` matches known release  
5. Restore/verify S3 objects if media needed  
6. Start API (migrations no-op if versions match)  
7. Smoke: login, dashboard, one write path  
8. Re-enable traffic  

### 14.3 Disaster Recovery

| Item | Target (initial) |
|------|------------------|
| RPO | ≤ 24h (improve with PITR) |
| RTO | ≤ 4–8h single-region |
| DR drill | Quarterly restore to staging |

Document runbooks under `docs/deployment/` at implementation time.

---

## 15. Health Monitoring

### 15.1 Application Probes

| Target | Liveness | Readiness |
|--------|----------|-----------|
| **Backend** | `/health/live` | `/health/ready` (DB; Redis if required) |
| **Frontend** | HTTP 200 on `/` | Same or build-id endpoint |
| **Worker** | Celery ping / process up | Can connect broker + DB |
| **Scheduler** | Process up | Beat schedule loaded |
| **Postgres** | `pg_isready` | Accepts connections |
| **Redis** | `PING` | — |
| **Nginx** | Local stub status / wget | Upstreams resolving |

### 15.2 Host / Cluster Signals

| Signal | Alert when |
|--------|------------|
| Disk space | < 15% free on DB/volume |
| Memory | Sustained > 85% or OOM kills |
| CPU | Sustained saturation on API/worker |
| Queue depth | Phase 12 thresholds |
| Certificate expiry | < 14 days |

### 15.3 Synthetic Checks

External ping of `/health/ready` and login smoke from uptime monitor (staging + prod).

---

## 16. Scalability Roadmap

Aligned with Phase 4 §23 / deployment index; detailed performance program in [Phase 17](./17-performance-scalability-architecture.md):

| Phase | Trigger | Infrastructure change |
|-------|---------|------------------------|
| **Now (Compose)** | Team local + small staging | Single API, one worker, one Beat, one Postgres, Redis |
| **A** | >50 farms / slow reports | Scale API replicas; more workers by queue; Redis cache |
| **B** | >200 farms | Load balancer; PgBouncer; **read replica** for reports; CDN for frontend static; edge rate limits |
| **C** | IoT sensors | Kafka/streams; time-series store; WebSockets gateway |
| **D** | Heavy AI | Dedicated `ai` worker pool / GPU inference service |
| **E** | Multi-region | Active-passive DB; object storage replication; regional edge |

### 16.1 Horizontal Scaling Notes

- **API:** Stateless behind LB — safe to replicate  
- **Worker:** Scale per queue; autoscaling on depth  
- **Beat:** Exactly one leader  
- **Postgres:** Vertical first; then read replicas  
- **Frontend:** CDN + multiple Next instances  
- **Orchestration:** ECS/GKE/K8s when Compose ops cost exceeds benefit  

---

## 17. Architecture Decision Rationale

| # | Decision | Alternatives | Rationale |
|---|----------|--------------|-----------|
| INF-001 | Monorepo `backend/` + `frontend/` | Separate repos early | Single versioning; shared CI; ADR-002 |
| INF-002 | Docker Compose for local/staging | Dev services only on host | Parity; onboarding speed |
| INF-003 | One image for api/worker/beat | Separate images | DRY; CMD differs |
| INF-004 | Nginx at edge (or cloud LB) | Expose Uvicorn publicly | TLS, headers, routing |
| INF-005 | Redis for broker + cache | RabbitMQ + separate cache | Ops simplicity for Phase 12 |
| INF-006 | Migrate as oneshot before API | Migrate inside every API start | Avoid multi-replica race |
| INF-007 | Local disk/MinIO → S3 protocol | S3-only from day one | ADR-012; offline DX |
| INF-008 | `.env.example` + SM in prod | Secrets in Compose git | Phase 10 |
| INF-009 | Make as DX façade | Raw compose commands only | Consistent team workflows |
| INF-010 | Beat single replica | Multi-beat | Duplicate scheduled jobs |
| INF-011 | Structured JSON logs to stdout | Ad-hoc files in containers | 12-factor; ADR-011 |
| INF-012 | Trivy + pip-audit in CI | Scan only in prod | Shift-left |
| INF-013 | Design-only this phase | Commit Dockerfiles now | Matches phases 5–13 discipline |

### 17.1 Alignment Map

| Phase | Contribution |
|-------|--------------|
| Phase 4 | Startup, settings profiles, scale roadmap |
| Phase 6 | Migration deploy rules |
| Phase 10 | Secrets & headers |
| Phase 11 | Health endpoints |
| Phase 12 | Worker/Beat/Redis queues |
| Phase 13 | CI test stages in GitHub Actions |
| Phase 14 | This specification — platform & DX |

### 17.2 Implementation Readiness Checklist

- [ ] Create `backend/` scaffold + Dockerfiles  
- [ ] Add `docker/docker-compose*.yml` with healthchecks  
- [ ] `.env.example` covering §5.2  
- [ ] `Makefile` bootstrap/migrate/seed/test  
- [ ] Nginx config for `/api` + frontend  
- [ ] GitHub Actions: lint/test/build images  
- [ ] Document local quick start in root README  
- [ ] Staging backup job + restore drill checklist  
- [ ] Optionally relocate Next.js to `frontend/`  

---

**Document Status:** Ready for Docker/Compose & DX implementation.  
**Next Phase:** [Phase 15 — CI/CD Pipeline & Production Deployment](./15-cicd-deployment-architecture.md). Implementation scaffold follows after delivery architecture.
