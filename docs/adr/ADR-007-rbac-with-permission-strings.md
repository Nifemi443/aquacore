# ADR-007: RBAC with permission strings

> **Status:** Accepted  
> **Date:** 2026-07-09  
> **Source:** [Backend Architecture §24](../architecture/04-backend-architecture.md#24-architecture-decision-rationale-adr-summary)

## Context

PondDesk backend requires architectural decisions that remain maintainable for 5+ years across a growing fish farm SaaS platform.

## Decision

**RBAC with permission strings**

## Alternatives Considered

- Role-only checks, ABAC

## Rationale

Simple enough for 3 roles; extensible to ABAC later.

## Consequences

### Positive

- Aligns with Clean Architecture and production readiness goals defined in Phase 4.

### Negative / Trade-offs

- Requires team discipline to avoid bypassing the chosen pattern under delivery pressure.

## Related Documents

- [Backend Architecture](../architecture/04-backend-architecture.md)
- [API Contract](../architecture/03-api-contract.md)
- [ADR Index](./README.md)
