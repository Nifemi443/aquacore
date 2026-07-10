# Deployment & Runtime

Deployment and application lifecycle from Phase 4 backend architecture.

## Related Documents

- [Backend Architecture §4](../architecture/04-backend-architecture.md#4-application-startup-lifecycle)
- [Backend Architecture §5](../architecture/04-backend-architecture.md#5-configuration-management)
- [Backend Architecture §22](../architecture/04-backend-architecture.md#22-observability)
- [Background Processing (Phase 12)](../architecture/12-background-processing.md) — Workers, Beat, Redis queues
- [Migration Strategy](../architecture/06-migration-strategy.md) — Alembic deploy & rollback
- [API Contract §1.2 Base URLs](../architecture/03-api-contract.md#12-base-url--environment)

## Stack

| Service | Image / Runtime |
|---------|----------------|
| API | FastAPI + Uvicorn/Gunicorn (Docker) |
| Database | PostgreSQL 15+ |
| Migrations | Alembic (run on deploy) |
| Broker / cache | Redis (Phase 12) |
| Workers | Celery worker + Celery Beat (Phase 12) |

## Environment URLs

| Environment | API Base |
|-------------|----------|
| Production | `https://api.ponddesk.app/api/v1/` |
| Staging | `https://api-staging.ponddesk.app/api/v1/` |
| Local | `http://localhost:8000/api/v1/` |

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
| **Development** | `DEBUG=true`, local storage, relaxed CORS |
| **Testing** | Test Postgres, fake storage, fixed JWT secret |
| **Staging** | Production-like, separate DB, SMTP sandbox |
| **Production** | `DEBUG=false`, strict CORS, JSON logs, secrets manager |

Settings loaded once at boot via Pydantic `BaseSettings`. Immutable after startup.

## Health Checks

| Endpoint | Purpose | Orchestrator Use |
|----------|---------|------------------|
| `GET /health` | App running | Liveness |
| `GET /health/ready` | DB + storage OK | Readiness |
| `GET /health/live` | Process responsive | Kubernetes liveness |

## Docker Layout

```
docker/
├── Dockerfile          # Production multi-stage
├── Dockerfile.dev      # Dev with hot reload
└── docker-compose.yml  # API + Postgres (+ Redis future)
```

## Graceful Shutdown

1. Stop accepting new requests
2. Drain in-flight requests (timeout: 30s)
3. Flush logs and audit entries
4. Close database connection pool
5. Exit

## Observability (Future)

| Tool | Purpose |
|------|---------|
| Prometheus | Metrics (`http_requests_total`, `db_pool_checked_out`) |
| Grafana | Dashboards |
| Sentry | Error tracking |
| OpenTelemetry | Distributed tracing |
| Jaeger/Tempo | Trace visualization |

## Scalability Phases

| Phase | Trigger | Change |
|-------|---------|--------|
| A | >50 farms | Redis cache + Celery workers |
| B | >200 farms | Read replicas, CDN, rate limiting |
| C | IoT sensors | WebSockets, Kafka, time-series DB |
| D | AI features | ML inference service |
| E | Multi-region | Service decomposition |

See [Backend Architecture §23](../architecture/04-backend-architecture.md#23-scalability-roadmap)
