# API & Backend Layer Diagrams

> **Sources:** [API Contract §1.3](../architecture/03-api-contract.md#13-architectural-layers) · [Backend Architecture §1.1](../architecture/04-backend-architecture.md#11-architectural-style)

## API Architectural Layers (Phase 3)

```mermaid
flowchart TB
    API["API Layer — FastAPI routers, Pydantic schemas"]
    AUTH["Auth Layer — JWT validation, RBAC"]
    SVC["Service Layer — Business rules, transactions"]
    REPO["Repository Layer — SQLAlchemy 2.0 queries"]
    DB["Database — PostgreSQL"]

    API --> AUTH --> SVC --> REPO --> DB
```

## Clean Architecture (Phase 4)

```mermaid
flowchart TB
    DEL["Delivery Layer — Routes, Middleware, Webhooks"]
    APP["Application Layer — Services, Use Cases, DTOs"]
    DOM["Domain Layer — Entities, Events, Rules"]
    INF["Infrastructure — Repositories, DB, Storage, Queue"]

    DEL --> APP --> DOM
    APP --> INF
    INF --> DOM
```

Dependencies point **inward only**.

## Request Lifecycle

```mermaid
sequenceDiagram
    participant C as Client
    participant M as Middleware
    participant R as Route
    participant S as Service
    participant RE as Repository
    participant DB as PostgreSQL

    C->>M: HTTP Request + JWT
    M->>M: Request ID, CORS, Logging
    M->>R: Forward
    R->>R: Pydantic validation
    R->>S: Call service method
    S->>S: Business validation
    S->>RE: Repository operations
    RE->>DB: SQL (parameterized)
    DB-->>RE: Result
    RE-->>S: ORM entities
    S->>S: commit() + publish events
    S-->>R: Result
    R-->>C: Response schema + status
```

## Related Documents

- [API Contract](../architecture/03-api-contract.md)
- [Backend Architecture](../architecture/04-backend-architecture.md)
- [Dependency Injection §7](../architecture/04-backend-architecture.md#7-dependency-injection-design)
