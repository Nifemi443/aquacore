# ADR-014: Argon2id password hashing

> **Status:** Accepted  
> **Date:** 2026-07-09  
> **Source:** [Backend Architecture §24](../architecture/04-backend-architecture.md#24-architecture-decision-rationale-adr-summary)

## Context

PondDesk backend requires architectural decisions that remain maintainable for 5+ years across a growing fish farm SaaS platform.

## Decision

**Argon2id password hashing**

## Alternatives Considered

- bcrypt, scrypt

## Rationale

OWASP current recommendation for new systems.

## Consequences

### Positive

- Aligns with Clean Architecture and production readiness goals defined in Phase 4.

### Negative / Trade-offs

- Requires team discipline to avoid bypassing the chosen pattern under delivery pressure.

## Related Documents

- [Backend Architecture](../architecture/04-backend-architecture.md)
- [API Contract](../architecture/03-api-contract.md)
- [ADR Index](./README.md)
