# Deployment & Runtime

Deployment, application lifecycle, and delivery. Canonical specs:

- **Runtime / Docker / Compose:** [Phase 14 — Infrastructure Architecture](../architecture/14-infrastructure-architecture.md)
- **CI/CD / releases / rollback / DR:** [Phase 15 — CI/CD & Production Deployment](../architecture/15-cicd-deployment-architecture.md)
- **Monitoring / logging / alerting:** [Phase 16 — Observability Architecture](../architecture/16-observability-architecture.md)
- **Performance / scale:** [Phase 17 — Performance & Scalability](../architecture/17-performance-scalability-architecture.md)
- **Production readiness / DR / governance:** [Phase 18 — Production Readiness & Governance](../architecture/18-production-readiness-governance.md)

## Related Documents

- **[Infrastructure Architecture (Phase 14)](../architecture/14-infrastructure-architecture.md)** — Docker, Compose, Nginx, envs, DX, backups, scale
- **[CI/CD & Production Deployment (Phase 15)](../architecture/15-cicd-deployment-architecture.md)** — GitHub Actions, CD, SemVer, zero-downtime, secrets, DR
- **[Observability Architecture (Phase 16)](../architecture/16-observability-architecture.md)** — Logs, metrics, traces, dashboards, alerts, runbooks
- **[Performance & Scalability (Phase 17)](../architecture/17-performance-scalability-architecture.md)** — Caching, DB/API/worker scale, load tests
- **[Production Readiness & Governance (Phase 18)](../architecture/18-production-readiness-governance.md)** — Launch checklist, DR, backups, ops, CTO sign-off
- [Backend Architecture §4](../architecture/04-backend-architecture.md#4-application-startup-lifecycle)
- [Backend Architecture §5](../architecture/04-backend-architecture.md#5-configuration-management)
- [Backend Architecture §22](../architecture/04-backend-architecture.md#22-observability)
- [Background Processing (Phase 12)](../architecture/12-background-processing.md) — Workers, Beat, Redis queues
- [Migration Strategy](../architecture/06-migration-strategy.md) — Alembic deploy & rollback
- [Testing Architecture §13](../architecture/13-testing-architecture.md#13-cicd-testing-pipeline) — CI test gates
- [API Contract §1.2 Base URLs](../architecture/03-api-contract.md#12-base-url--environment)

## Stack

| Service | Image / Runtime |
|---------|----------------|
| API | FastAPI + Uvicorn/Gunicorn (Docker) |
| Frontend | Next.js (Docker / Node) |
| Database | PostgreSQL 15+ |
| Migrations | Alembic (oneshot before API) |
| Broker / cache | Redis |
| Workers | Celery worker + Celery Beat |
| Edge | Nginx (or cloud LB) |
| CI/CD | GitHub Actions → GHCR → staging/prod Compose |

## Environment URLs

| Environment | API Base |
|-------------|----------|
| Production | `https://api.ponddesk.app/api/v1/` |
| Staging | `https://api-staging.ponddesk.app/api/v1/` |
| Local | `http://localhost:8000/api/v1/` (or via Nginx `:443`) |

## Delivery Summary

| Stage | Spec |
|-------|------|
| PR CI | Lint, types, security, unit + integration, coverage ≥80%, build verify |
| Main | Build/push images to GHCR (`sha-*`, `main`) |
| Staging | Auto deploy from `main`; migrate → health → smoke |
| Production | Manual / SemVer gate; backup → migrate → rolling or blue-green → soak |
| Rollback | Previous image digests; DB forward-fix preferred over blind downgrade |

Full pipelines: [Phase 15 §2–§4](../architecture/15-cicd-deployment-architecture.md#2-ci-pipeline).

## Observability Summary

| Pillar | Stack |
|--------|-------|
| Logs | JSON stdout → Loki (ADR-011) |
| Metrics | Prometheus + exporters |
| Traces | OpenTelemetry → Tempo/Jaeger |
| Audit | PostgreSQL `audit_log` (compliance) |
| UI / Alerts | Grafana + Alertmanager (+ Sentry errors) |

Correlate with `request_id` / `trace_id`. Full design: [Phase 16](../architecture/16-observability-architecture.md).

## Application Startup Sequence

Order is critical — see [§4 Startup Lifecycle](../architecture/04-backend-architecture.md#4-application-startup-lifecycle):

```
1.  Logging Initialization
2.  Configuration Loading
3.  Environment Validation
4.  Database Engine Creation
5.  Dependency Registration
6.  Exception Handler Registration
7.  Middleware Registration
8.  Router Registration
9.  Event Handler Registration
10. Health Check Endpoints
11. Startup Event Hooks
─── RUNNING ───
12. Shutdown Event Hooks
13. Database Engine Disposal
```

## Configuration Profiles

| Environment | Key Settings |
|-------------|-------------|
| **Development** | `DEBUG=true`, local/MinIO storage, Mailpit SMTP, relaxed CORS |
| **Testing** | Test Postgres, fake storage, fixed JWT secret, Celery eager |
| **Staging** | Production-like, separate DB, SMTP sandbox |
| **Production** | `DEBUG=false`, strict CORS, JSON logs, secrets manager |

Settings loaded once at boot via Pydantic `BaseSettings`. Immutable after startup.

## Health Checks

| Endpoint | Purpose | Orchestrator Use |
|----------|---------|------------------|
| `GET /health` | App running | Liveness |
| `GET /health/ready` | DB (+ Redis if required) OK | Readiness |
| `GET /health/live` | Process responsive | Kubernetes liveness |

Full probe matrix: [Phase 14 §15](../architecture/14-infrastructure-architecture.md#15-health-monitoring).  
Deploy gates: [Phase 15 §10–§11](../architecture/15-cicd-deployment-architecture.md#10-zero-downtime-deployment).

## Docker Layout

```
docker/
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.test.yml
└── docker-compose.prod.yml

backend/
├── Dockerfile
└── Dockerfile.dev

.github/workflows/          # Phase 15
deployment/staging|production/
```

See [Phase 14 §3–§4](../architecture/14-infrastructure-architecture.md#3-docker-architecture) and [Phase 15 §1.4](../architecture/15-cicd-deployment-architecture.md#14-deployment-folder-structure).

## Graceful Shutdown

1. Stop accepting new requests
2. Drain in-flight requests (timeout: 30s)
3. Flush logs and audit entries
4. Close database connection pool
5. Exit

## Observability (Future)

| Tool | Purpose |
|------|---------|
| Prometheus | Metrics (`http_requests_total`, `db_pool_checked_out`, queue depth) |
| Grafana | Dashboards |
| Sentry | Error tracking |
| OpenTelemetry | Distributed tracing |
| Jaeger/Tempo | Trace visualization |

## Scalability Phases

| Phase | Trigger | Change |
|-------|---------|--------|
| A | >50 farms | Redis cache + scale Celery workers |
| B | >200 farms | Read replicas, CDN, rate limiting |
| C | IoT sensors | WebSockets, Kafka, time-series DB |
| D | AI features | ML inference service |
| E | Multi-region | Service decomposition / regional edge |

See [Backend Architecture §23](../architecture/04-backend-architecture.md#23-scalability-roadmap), [Phase 14 §16](../architecture/14-infrastructure-architecture.md#16-scalability-roadmap), and [Phase 17](../architecture/17-performance-scalability-architecture.md).

## Operator Docs (To Be Added at Implementation)

| Doc | Purpose |
|-----|---------|
| Developer guide | PR/CI workflow |
| Production guide | Host bootstrap & secrets |
| Release checklist | SemVer promote gate |
| Deployment checklist | Pre/post deploy steps |
| Incident response | Severity & freeze |
| Runbooks | Rollback, restore, host rebuild |

See [Phase 15 §15](../architecture/15-cicd-deployment-architecture.md#15-documentation-requirements).
