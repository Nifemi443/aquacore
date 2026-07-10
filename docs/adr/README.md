# Architecture Decision Records (ADR)

Index of formal architecture decisions for the PondDesk backend. All decisions are extracted from Phase 4 and must not be changed without a new ADR.

## Related Documents

- [Backend Architecture](../architecture/04-backend-architecture.md) — Full Phase 4 blueprint
- [Domain Model](../architecture/01-domain-model.md)
- [Database Architecture](../architecture/02-database-architecture.md)
- [API Contract](../architecture/03-api-contract.md)

## ADR Index

| ADR | Decision | Status |
|-----|----------|--------|
| [ADR-001](./ADR-001-clean-architecture-with-4-layers.md) | Clean Architecture with 4 layers | Accepted |
| [ADR-002](./ADR-002-monolith-first.md) | Monolith first | Accepted |
| [ADR-003](./ADR-003-repository-pattern-with-interfaces.md) | Repository pattern with interfaces | Accepted |
| [ADR-004](./ADR-004-service-layer-owns-transactions.md) | Service layer owns transactions | Accepted |
| [ADR-005](./ADR-005-pydantic-schema-separation-create-update-response.md) | Pydantic schema separation | Accepted |
| [ADR-006](./ADR-006-jwt-with-refresh-token-rotation.md) | JWT with refresh token rotation | Accepted |
| [ADR-007](./ADR-007-rbac-with-permission-strings.md) | RBAC with permission strings | Accepted |
| [ADR-008](./ADR-008-in-process-event-bus-phase-1.md) | In-process event bus (Phase 1) | Accepted |
| [ADR-009](./ADR-009-async-sqlalchemy.md) | Async SQLAlchemy | Accepted |
| [ADR-010](./ADR-010-alembic-at-project-root.md) | Alembic at project root | Accepted |
| [ADR-011](./ADR-011-structured-json-logging.md) | Structured JSON logging | Accepted |
| [ADR-012](./ADR-012-storage-backend-protocol.md) | Storage backend protocol | Accepted |
| [ADR-013](./ADR-013-farm_id-tenant-scoping-at-repository-level.md) | `farm_id` tenant scoping at repository level | Accepted |
| [ADR-014](./ADR-014-argon2id-password-hashing.md) | Argon2id password hashing | Accepted |
| [ADR-015](./ADR-015-fastapi-backgroundtasks-to-celery-migration-path.md) | BackgroundTasks → Celery migration path | Accepted |

## How to Propose a New ADR

1. Copy an existing ADR as template
2. Assign the next sequential number
3. Document context, decision, alternatives, rationale, and consequences
4. Link related architecture documents
5. Mark status as **Proposed** until reviewed
