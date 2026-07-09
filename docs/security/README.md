# Security Architecture

Security design consolidated from Phase 3 (API) and Phase 4 (Backend). Do not modify without a new ADR.

## Related Documents

- [API Contract §9](../architecture/03-api-contract.md#9-security-architecture)
- [API Contract §10 RBAC](../architecture/03-api-contract.md#10-rbac-permissions)
- [Backend Architecture §13](../architecture/04-backend-architecture.md#13-authentication--authorization)
- [Backend Architecture §20](../architecture/04-backend-architecture.md#20-security-architecture)
- [ADR-006 JWT](./../adr/ADR-006-jwt-with-refresh-token-rotation.md)
- [ADR-007 RBAC](./../adr/ADR-007-rbac-with-permission-strings.md)
- [ADR-014 Argon2id](./../adr/ADR-014-argon2id-password-hashing.md)

## Authentication

### Token Strategy

| Token | Type | Lifetime | Storage |
|-------|------|----------|---------|
| Access Token | JWT (HS256 or RS256) | 15 minutes | Client memory |
| Refresh Token | Opaque UUID (hashed in DB) | 7 days | HttpOnly cookie or secure storage |

### Access Token Claims

```json
{
  "sub": "<user_id>",
  "farm_id": "<active_farm_id>",
  "role": "MANAGER",
  "permissions": ["ponds:read", "feedings:write"],
  "iat": 1710000000,
  "exp": 1710000900,
  "jti": "<unique_token_id>"
}
```

### Authentication Flow

1. `POST /api/v1/auth/login` — validate credentials, issue token pair
2. Client sends `Authorization: Bearer <access_token>` on protected routes
3. `get_current_user()` dependency decodes JWT, validates signature + expiry
4. `POST /api/v1/auth/refresh` — rotate refresh token; detect reuse → revoke all tokens

### Password Hashing

| Document | Specification |
|----------|---------------|
| Phase 3 API Contract | bcrypt (cost factor 12) via `passlib` |
| Phase 4 ADR-014 | **Argon2id** (OWASP recommendation) |

> Implementation follows **ADR-014 (Argon2id)** per Phase 4 backend blueprint.

## Authorization (RBAC)

### Roles

| Role | Scope | Typical User |
|------|-------|--------------|
| **Admin** | Full farm + user management | Farm owner |
| **Manager** | All operations except user/role management | Farm manager |
| **Worker** | Daily operations: feedings, water records, view ponds | Field staff |

### Permission Format

`{resource}:{action}` — e.g., `harvest:create`, `reports:export`, `settings:update`

### Where Authorization Occurs

| Check | Layer |
|-------|-------|
| Role/permission gate | `dependencies/permissions.py` |
| Resource ownership (`farm_id`) | Service layer |
| Field-level restrictions | Service layer |
| Never | Repository layer |

Full permission matrix: [API Contract §10](../architecture/03-api-contract.md#10-rbac-permissions)

## Multi-Tenant Isolation

- `farm_id` on every operational query (repository level)
- Service verifies `entity.farm_id == current_user.farm_id`
- `X-Farm-Id` header validated against `farm_memberships`
- See [ADR-013](../adr/ADR-013-farm_id-tenant-scoping-at-repository-level.md)

## Security Controls

| Control | Implementation |
|---------|----------------|
| SQL injection | SQLAlchemy parameterized queries only |
| XSS | JSON API; `Content-Type: application/json` |
| Input sanitization | Pydantic validation + `bleach` for text fields |
| Rate limiting | Per-IP on `/auth/login` (5/min); per-user API (100/min) |
| Secure headers | HSTS, X-Content-Type-Options, X-Frame-Options, CSP |
| HTTPS | TLS at reverse proxy (Nginx/ALB) |
| CORS | Strict origin whitelist |
| Secrets | Env vars (dev); Vault/AWS SM (production) |
| Audit trail | Append-only `audit_log` for all mutations |
| Dependency scanning | `pip-audit` / Dependabot in CI |

## Middleware Security Stack

See [Backend Architecture §14](../architecture/04-backend-architecture.md#14-middleware-stack):

1. Trusted Hosts
2. CORS
3. GZip Compression
4. Request ID
5. Request Logging
6. Response Timing
7. Rate Limiting (future: Redis-backed)
8. Security Headers

Authentication is **not** global middleware — use FastAPI `Depends(get_current_user)`.
