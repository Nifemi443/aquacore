# API Documentation Index

Quick reference for the PondDesk REST API. The canonical specification is in the architecture docs.

## Canonical Document

**[REST API Contract (Phase 3)](../architecture/03-api-contract.md)** — Full endpoint catalog, auth flow, validation, errors, and RBAC.

## Related Documents

- [Backend Architecture](../architecture/04-backend-architecture.md) — Route layer rules
- [Security](../security/README.md) — JWT, RBAC, headers
- [Domain Model](../architecture/01-domain-model.md) — Business rules behind endpoints
- [Database Architecture](../architecture/02-database-architecture.md) — Table mappings

## Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.ponddesk.app/api/v1/` |
| Staging | `https://api-staging.ponddesk.app/api/v1/` |
| Local | `http://localhost:8000/api/v1/` |

## Module Router Map

| Module | Prefix | Auth | Phase 3 Reference |
|--------|--------|------|-----------------|
| Authentication | `/auth` | Public (login/register) | [§2](../architecture/03-api-contract.md#2-authentication-flow) |
| Dashboard | `/dashboard` | JWT + farm scope | [§3](../architecture/03-api-contract.md#3-endpoint-catalog) |
| Farms | `/farms` | JWT + farm scope | [§3.1](../architecture/03-api-contract.md#31-farms) |
| Ponds | `/ponds` | JWT + farm scope | [§3.2](../architecture/03-api-contract.md#32-ponds) |
| Fish Batches | `/batches` | JWT + farm scope | [§3.3](../architecture/03-api-contract.md#33-fish-batches) |
| Daily Feedings | `/feedings` | JWT + farm scope | [§3.4](../architecture/03-api-contract.md#34-daily-feedings) |
| Feed Inventory | `/inventory` | JWT + farm scope | [§3.5](../architecture/03-api-contract.md#35-feed-inventory) |
| Water Records | `/water-records` | JWT + farm scope | [§3.6](../architecture/03-api-contract.md#36-water-records) |
| Harvest | `/harvests` | JWT + farm scope | [§3.7](../architecture/03-api-contract.md#37-harvest) |
| Reports | `/reports` | JWT + farm scope | [§3.8](../architecture/03-api-contract.md#38-reports) |
| Notifications | `/notifications` | JWT + farm scope | [§3.9](../architecture/03-api-contract.md#39-notifications) |
| Settings | `/settings` | JWT + farm scope | [§3.10](../architecture/03-api-contract.md#310-settings) |
| Search | `/search` | JWT + farm scope | [§3.11](../architecture/03-api-contract.md#311-search) |
| Files | `/files` | JWT + farm scope | [§3.12](../architecture/03-api-contract.md#312-files) |

## Request Headers

| Header | Required | Purpose |
|--------|----------|---------|
| `Authorization` | Protected routes | `Bearer <access_token>` |
| `X-Farm-Id` | Multi-farm users | Active farm UUID |
| `X-Request-Id` | Optional | Distributed tracing |
| `Content-Type` | POST/PATCH/PUT | `application/json` |

## Standard Response Envelope

See [§6 Request/Response Standards](../architecture/03-api-contract.md#6-requestresponse-standards) for pagination, filtering, and error envelope format.

## Tenancy Model

1. JWT identifies `user_id`
2. `X-Farm-Id` or token `farm_id` claim selects active farm
3. Middleware validates `farm_memberships` + role
4. All queries filter `farm_id` at repository layer
