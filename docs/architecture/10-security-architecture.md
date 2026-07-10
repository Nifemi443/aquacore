# Authentication, Authorization & Security Architecture

> **Phase:** 10 — Security Architecture  
> **Status:** Approved — Pre-Implementation  
> **Project:** PondDesk Fish Farm Management Platform  
> **Stack:** FastAPI · PostgreSQL · SQLAlchemy 2.0 (async) · Pydantic v2 · JWT · Argon2id · Python 3.13+  
> **Depends on:** Phase 3 (API auth/RBAC) · Phase 4 (§13–§20) · Phase 7 (auth DTOs) · Phase 8–9 (repos/services) · ADR-006 · ADR-007 · ADR-014

Designs the complete authentication, authorization, and API security model. No FastAPI route implementations, no JWT library code, no ORM models, and no SQL in this phase.

## Related Documents

- [API Contract §9–§10](./03-api-contract.md#9-security-architecture) — Endpoint-level security & permission matrix source
- [Backend Architecture §13–§14](./04-backend-architecture.md#13-authentication--authorization) — Auth placement in Clean Architecture
- [Service Layer](./09-service-layer.md) — Farm-scope checks & sensitive-op revalidation
- [Security Index](../security/README.md) — Quick reference (this document is canonical for Phase 10)
- [ADR-006](../adr/ADR-006-jwt-with-refresh-token-rotation.md) · [ADR-007](../adr/ADR-007-rbac-with-permission-strings.md) · [ADR-014](../adr/ADR-014-argon2id-password-hashing.md)

---

## Table of Contents

- [1. Authentication Overview](#1-authentication-overview)
- [2. Authentication Flow](#2-authentication-flow)
- [3. JWT Strategy](#3-jwt-strategy)
- [4. Password Security](#4-password-security)
- [5. RBAC Design](#5-rbac-design)
- [6. Permission Matrix](#6-permission-matrix)
- [7. Dependency Design](#7-dependency-design)
- [8. Session Management](#8-session-management)
- [9. API Security](#9-api-security)
- [10. Middleware Recommendations](#10-middleware-recommendations)
- [11. Secrets Management](#11-secrets-management)
- [12. Audit Logging](#12-audit-logging)
- [13. Error Handling](#13-error-handling)
- [14. Future Security Enhancements](#14-future-security-enhancements)
- [15. Testing Strategy](#15-testing-strategy)
- [16. Security Best Practices](#16-security-best-practices)
- [17. Architecture Decision Rationale](#17-architecture-decision-rationale)

---

## 1. Authentication Overview

### 1.1 Goals

| Goal | Approach |
|------|----------|
| **Stateless API scaling** | Short-lived JWT access tokens (ADR-006) |
| **Revocable long sessions** | Opaque refresh tokens stored hashed in DB with rotation |
| **Strong credential storage** | Argon2id (ADR-014); never bcrypt for new hashes |
| **Least privilege** | RBAC permission strings (ADR-007), not role-only checks |
| **Tenant isolation** | `farm_id` on JWT + membership validation + repository filters |
| **Framework independence** | Crypto in `app/security/`; gates in `app/dependencies/`; business authz in services |
| **Defense in depth** | Route permission gate **and** service farm-scope / sensitive-op checks |

### 1.2 Component Map

```
Client
  │  Authorization: Bearer <access_jwt>
  │  (optional) refresh via body or HttpOnly cookie
  ▼
Middleware (CORS, hosts, rate limit, headers, request_id)
  ▼
Route Dependencies
  ├── get_current_user()          → validate access JWT → CurrentUser
  ├── require_permission("…")     → RBAC gate
  └── resolve_farm_context()      → X-Farm-Id ∩ memberships
  ▼
AuthService / domain services
  ├── password verify (Argon2id)
  ├── issue / rotate / revoke tokens
  └── farm_id ownership checks
  ▼
Repositories (refresh_tokens, users, farm_memberships, audit_log)
```

### 1.3 Token Pair Summary

| Token | Format | Lifetime | Storage (client) | Storage (server) | Purpose |
|-------|--------|----------|------------------|------------------|---------|
| **Access** | JWT (signed) | **15 minutes** | Memory (web) / secure storage (mobile) | Not stored (stateless) | Authorize API calls |
| **Refresh** | Opaque UUID / random 256-bit | **7 days** | HttpOnly `Secure` cookie **or** secure mobile store | **Hash only** in `refresh_tokens` | Obtain new access (+ rotate) |

**Why not long-lived JWT alone?** Cannot revoke without a denylist; stolen tokens remain valid for days.  
**Why not session cookies alone?** Harder for mobile/IoT; couples API to browser cookie model. Hybrid (JWT access + optional cookie refresh) supports both web and mobile.

### 1.4 What This Layer Must Never Do

| Forbidden | Why |
|-----------|-----|
| Put business rules in auth dependencies | Belongs in services / domain |
| Trust `farm_id` from client body without membership check | Tenant escape |
| Log passwords, tokens, or Argon2 hashes | Credential leakage |
| Embed PII beyond `sub` / role / farm in JWT unnecessarily | Token bloat + privacy |
| Use global auth middleware for all routes | Breaks `/health`, `/auth/login` |
| Store refresh tokens in plaintext | DB breach → session hijack |

---

## 2. Authentication Flow

### 2.1 Lifecycle Overview

```
Registration
    ↓
Email Verification (optional MVP; recommended before production GA)
    ↓
Login  →  Access Token + Refresh Token
    ↓
Protected Requests (Bearer access)
    ↓
Token Refresh (rotate refresh; issue new pair)
    ↓
Logout / Logout-all  →  Revoke refresh token(s)
```

### 2.2 Registration

| Step | Behavior |
|------|----------|
| 1 | Client `POST /api/v1/auth/register` with email, password, name (and optional farm create) |
| 2 | Pydantic validates email format, password policy (§4) |
| 3 | `AuthService` checks email uniqueness (case-normalized) |
| 4 | Hash password with Argon2id; create `users` row (`is_active=true`, `email_verified=false` if verification enabled) |
| 5 | If creating a farm: create `farms` + `farm_memberships` with role `ADMIN` |
| 6 | Optionally enqueue verification email (background task) |
| 7 | **Do not** auto-login until email verified **or** (MVP) issue tokens immediately with `email_verified` claim false and restrict sensitive ops |

**Rationale:** Registration is a privileged write; rate-limit aggressively. Prefer verify-before-full-access in production.

### 2.3 Email Verification (Optional → Recommended)

| Step | Behavior |
|------|----------|
| 1 | Issue single-use token (random, hashed in DB), TTL 24h |
| 2 | User opens link → `POST /auth/verify-email` |
| 3 | Mark `email_verified_at`; invalidate token |
| 4 | Audit: `EMAIL_VERIFIED` |

MVP may skip UI but keep schema + service hooks so GA does not require a migration redesign.

### 2.4 Login

| Step | Behavior |
|------|----------|
| 1 | `POST /api/v1/auth/login` `{ email, password }` (+ optional `farm_id` if multi-farm) |
| 2 | Rate limit by IP + email (§9.3 / account lockout §8.4) |
| 3 | Load user by email; if missing, still run dummy Argon2 verify (constant-time UX) |
| 4 | Verify password; on failure: increment failed attempts, audit `LOGIN_FAILED`, return generic `INVALID_CREDENTIALS` |
| 5 | Reject if `is_active=false` or account locked → `ACCOUNT_LOCKED` / `ACCOUNT_DISABLED` |
| 6 | Resolve active farm: single membership, or requested `farm_id` if member |
| 7 | Load role + permission set for that membership |
| 8 | Issue access JWT + create refresh token row (store **hash**, family_id, device metadata optional) |
| 9 | Reset failed-attempt counter; audit `LOGIN_SUCCESS` |
| 10 | Return `{ access_token, refresh_token?, token_type, expires_in, user }` |

**Generic errors:** Never reveal whether email exists on failed login.

### 2.5 Protected Requests

| Step | Behavior |
|------|----------|
| 1 | Client sends `Authorization: Bearer <access_token>` |
| 2 | Optional `X-Farm-Id` when user has multiple farms (must match membership) |
| 3 | `get_current_user` validates signature, `exp`, `nbf`, `iss`/`aud` (if set), and optional denylist `jti` |
| 4 | Build `CurrentUser(id, farm_id, role, permissions, …)` |
| 5 | `require_permission` checks route permission |
| 6 | Service re-checks `entity.farm_id == current_user.farm_id` |

### 2.6 Token Refresh

| Step | Behavior |
|------|----------|
| 1 | `POST /api/v1/auth/refresh` with refresh token (body or cookie) |
| 2 | Hash presented token; lookup `refresh_tokens` |
| 3 | If not found / expired / revoked → `INVALID_TOKEN` |
| 4 | **Reuse detection:** if token already marked rotated/used → **revoke entire token family** for user (or all sessions) → `TOKEN_REUSE_DETECTED` |
| 5 | Else: mark old token revoked/rotated; issue new access + new refresh (same `family_id`) |
| 6 | Audit `TOKEN_REFRESHED` |

**Why rotation?** Stolen refresh tokens have a short window; reuse proves theft.

### 2.7 Logout & Revocation

| Action | Behavior |
|--------|----------|
| **Logout** | Revoke current refresh token (and optionally current access `jti` if denylist enabled) |
| **Logout all devices** | Revoke all refresh tokens for `user_id`; bump `token_version` on user to invalidate access JWTs that embed version |
| **Password change / reset** | Force logout-all + invalidate reset tokens |
| **Role/permission change** | Bump permission cache / `token_version` so next access requires refresh |

Access JWTs remain valid until expiry unless `jti` denylist or `token_version` claim is used. Prefer **short TTL (15m)** + **token_version** over a large denylist.

---

## 3. JWT Strategy

### 3.1 Access Token

| Property | Specification |
|----------|---------------|
| Type | JWT (JWS) |
| Algorithm (dev) | **HS256** with strong secret (≥ 32 bytes entropy) |
| Algorithm (prod) | Prefer **RS256** or **ES256** (private key signs; public key verifies) |
| TTL | **15 minutes** |
| Clock skew | Allow **±60 seconds** on `exp`/`nbf` validation |
| Transport | `Authorization: Bearer` only — never query string |

### 3.2 Access Token Claims

```json
{
  "sub": "<user_uuid>",
  "farm_id": "<active_farm_uuid>",
  "role": "MANAGER",
  "permissions": ["ponds:read", "feedings:write", "harvests:write"],
  "tv": 3,
  "iss": "ponddesk-api",
  "aud": "ponddesk-clients",
  "iat": 1710000000,
  "nbf": 1710000000,
  "exp": 1710000900,
  "jti": "<unique_access_id>"
}
```

| Claim | Purpose |
|-------|---------|
| `sub` | User identity |
| `farm_id` | Active tenant context |
| `role` | Coarse UI / logging; **authorization uses `permissions`** |
| `permissions` | Fine-grained RBAC (keep list small; or omit and load from DB/cache if JWT size grows) |
| `tv` | `token_version` — invalidate all access tokens on password/role change |
| `jti` | Unique id for optional denylist / audit |
| `iss` / `aud` | Prevent token confusion across environments |

**MVP note:** Embedding permissions is acceptable for 3 roles. If permission sets grow, switch to `role` + server-side permission resolve with Redis cache (`user:{id}:permissions`, TTL 600s, invalidate on role change — Phase 3 §11.2).

### 3.3 Refresh Token

| Property | Specification |
|----------|---------------|
| Format | Cryptographically random (e.g. 32 bytes, URL-safe) — **not** a JWT |
| Server storage | `SHA-256` or HMAC hash of token; never plaintext |
| TTL | **7 days** from issue (sliding optional: extend on refresh up to absolute max 30 days) |
| Binding | `user_id`, `farm_id` (optional), `family_id`, `created_at`, `expires_at`, `revoked_at`, `replaced_by`, `user_agent`/`ip` (optional) |
| Rotation | Every successful refresh replaces the token |

### 3.4 Signing & Secret Management

| Environment | Access signing | Refresh |
|-------------|----------------|---------|
| Local/CI | `JWT_SECRET` from `.env` (fixed in tests) | Same DB hash strategy |
| Staging/Prod | Asymmetric keys from secrets manager; rotate annually | N/A (opaque) |

- Separate **access signing key** from other secrets.
- Never commit secrets; fail fast at startup if missing in production.
- Key rotation: support `kid` header for overlapping verify windows.

### 3.5 Revocation & Blacklist

| Mechanism | When to use |
|-----------|-------------|
| Refresh revoke in DB | Primary session kill |
| `token_version` (`tv`) on user | Invalidate all access JWTs after password/role change |
| Access `jti` denylist (Redis) | Immediate kill of a single access token (logout, admin force); TTL = remaining access lifetime |
| Do **not** persist every access JWT | Unnecessary; short TTL is the control |

### 3.6 Decision Rationale (JWT)

| Decision | Why |
|----------|-----|
| 15m access | Limits blast radius of stolen Bearer tokens |
| Opaque refresh + hash | Revocable; DB breach does not yield usable tokens |
| Rotation + reuse detection | Industry standard for refresh theft detection |
| Permissions in JWT (MVP) | Avoid DB hit every request; short TTL bounds staleness |
| Auth via Depends, not middleware | Public routes stay public; clearer OpenAPI security schemes |

---

## 4. Password Security

### 4.1 Hashing — Argon2id (ADR-014)

| Parameter | Recommendation (OWASP baseline; tune to ~100–250ms on prod CPU) |
|-----------|------------------------------------------------------------------|
| Variant | **Argon2id** |
| Memory | ≥ 19 MiB (prefer 64 MiB if hardware allows) |
| Iterations (time) | ≥ 2 |
| Parallelism | 1 |
| Salt | Unique per password (library-managed) |
| Pepper | Optional HMAC pepper from secrets manager (defense in depth) |

**Supersedes** Phase 3 bcrypt mention. Implementation **must** follow ADR-014. Existing bcrypt hashes (if any from prototypes) may verify-and-rehash on login.

### 4.2 Password Policy

| Rule | Requirement |
|------|-------------|
| Minimum length | **12** characters (prefer 14+ for admins) |
| Maximum length | **128** (DoS guard; Argon2 input bound) |
| Complexity | At least 3 of: upper, lower, digit, symbol — **or** passphrase ≥ 16 chars |
| Blocked | Password == email/local-part; known breached passwords (optional HaveIBeenPwned k-anonymity) |
| Unicode | Allow; normalize carefully; do not strip spaces in middle of passphrase |

### 4.3 Password Change (Authenticated)

```
Verify current password → validate new policy → Argon2id hash
→ update users.password_hash → bump token_version → revoke all refresh tokens
→ audit PASSWORD_CHANGED → optional notify email
```

### 4.4 Password Reset (Unauthenticated)

```
POST /auth/forgot-password { email }
  → always return generic success (no email enumeration)
  → if user exists: create single-use reset token (hashed, TTL 1 hour)
  → enqueue email with link

POST /auth/reset-password { token, new_password }
  → validate token → set new hash → invalidate token
  → bump token_version → revoke all refresh → audit PASSWORD_RESET
```

Rate limit: **3/hour per email**, **10/hour per IP**.

### 4.5 Password History (Optional)

Store last **N=5** password hashes; reject reuse on change/reset. Skip for MVP; design column `password_history` JSONB or side table for GA.

---

## 5. RBAC Design

### 5.1 Roles

| Role | Code | Scope | Typical user |
|------|------|-------|--------------|
| **Admin** | `ADMIN` | Full farm control, team, settings, destructive ops, exports | Farm owner |
| **Manager** | `MANAGER` | Operational write, inventory restock, reports; no team delete / farm admin settings | Farm manager |
| **Worker** | `WORKER` | Field recording (feeding, water, mortality) + broad read; no harvest create, no user mgmt | Field staff |

Hierarchy for “at least role X” checks: `ADMIN > MANAGER > WORKER`. Prefer **permission** checks over role checks for new code (ADR-007).

### 5.2 Permission Model

- Format: `{resource}:{action}` (e.g. `harvests:write`, `reports:export`)
- Stored on `roles.permissions` (JSONB) per Phase 5 — not a separate Permission table in MVP
- Membership binds `user` ↔ `farm` ↔ `role`
- Effective permissions = role permissions for the **active farm membership**

### 5.3 Enforcement Layers

| Layer | Responsibility |
|-------|----------------|
| **Route dependency** | `require_permission("harvests:write")` — fail fast 403 |
| **Service** | Farm ownership; “worker cannot void feeding”; close-batch manager+ |
| **Repository** | Always filter `farm_id`; never interpret roles |
| **Domain** | Pure business invariants (qty ≤ population) — not RBAC |

### 5.4 Multi-Farm Users

- User may have multiple `farm_memberships`
- Access token embeds **one** active `farm_id`
- Switch farm: refresh or dedicated `POST /auth/switch-farm` that re-issues token pair after membership check
- `X-Farm-Id` must equal JWT `farm_id` **or** be validated and trigger re-issue — pick one strategy and stick to it (recommend: JWT is source of truth; header optional consistency check)

---

## 6. Permission Matrix

Canonical product matrix (aligned with [API Contract §10.2](./03-api-contract.md#102-permission-matrix); expanded for clarity).

### 6.1 Capability Matrix by Role

| Area | Admin | Manager | Worker |
|------|:-----:|:-------:|:------:|
| **Dashboard** read | ✅ | ✅ | ✅ |
| **Farms** read | ✅ | ✅ | ✅ |
| **Farms** update | ✅ | ✅ (limited profile) | ❌ |
| **Farms** delete / transfer ownership | ✅ | ❌ | ❌ |
| **Ponds** create / update / delete | ✅ | ✅ | ❌ |
| **Ponds** read | ✅ | ✅ | ✅ |
| **Batches** create / update / stock / transfer / close | ✅ | ✅ | ❌ |
| **Batches** read | ✅ | ✅ | ✅ |
| **Feedings** create (record) | ✅ | ✅ | ✅ |
| **Feedings** edit / void | ✅ | ✅ | ❌ |
| **Feed inventory** read | ✅ | ✅ | ✅ |
| **Feed inventory** restock | ✅ | ✅ | ❌ |
| **Feed inventory** adjust / write-off | ✅ | ❌* | ❌ |
| **Water records** create | ✅ | ✅ | ✅ |
| **Water records** edit / void | ✅ | ✅ | ❌ |
| **Mortality** record | ✅ | ✅ | ✅ |
| **Harvest** record | ✅ | ✅ | ❌ |
| **Harvest** void | ✅ | ❌ | ❌ |
| **Reports** generate | ✅ | ✅ | ❌ |
| **Reports** download / read | ✅ | ✅ | ✅ (own farm, non-sensitive) |
| **Exports** (bulk data) | ✅ | ❌ | ❌ |
| **Notifications** read / dismiss | ✅ | ✅ | ✅ |
| **Settings** farm / team / admin | ✅ | ❌ | ❌ |
| **Settings** own profile / prefs | ✅ | ✅ | ✅ |
| **Users** invite / remove / change role | ✅ | ❌ | ❌ |

\*Manager inventory **adjust** may be enabled later via explicit permission; MVP = Admin only for destructive adjust.

### 6.2 Permission Codes

```
dashboard:read

farms:read, farms:write, farms:delete

ponds:read, ponds:write, ponds:delete

batches:read, batches:write, batches:stock, batches:transfer, batches:close

feedings:read, feedings:write, feedings:void

water:read, water:write, water:void

mortality:read, mortality:write

harvests:read, harvests:write, harvests:void

inventory:read, inventory:write, inventory:adjust

reports:read, reports:generate, reports:export

notifications:read, notifications:write

settings:read, settings:write, settings:team, settings:admin

users:invite, users:remove, users:manage

exports:run
```

### 6.3 Default Role Bundles

| Role | Includes (summary) |
|------|--------------------|
| **ADMIN** | All permission codes |
| **MANAGER** | All except `users:*`, `settings:admin`, `settings:team`, `farms:delete`, `harvests:void`, `inventory:adjust`, `exports:run` |
| **WORKER** | `*:read` for operational resources + `feedings:write`, `water:write`, `mortality:write`, `notifications:read/write` (dismiss), `settings:read` (own prefs only via service) |

Exact JSON bundles live in seed data / `app/core/permissions.py` constants — single source of truth for tests and JWT issuance.

---

## 7. Dependency Design

Design-only contracts (no FastAPI implementation in this document).

### 7.1 Core Dependencies

| Dependency | Input | Output | Failure |
|------------|-------|--------|---------|
| `get_current_user` | `Authorization` Bearer | `CurrentUser` | 401 `UNAUTHORIZED` / `INVALID_TOKEN` / `EXPIRED_TOKEN` |
| `get_current_active_user` | wraps above | `CurrentUser` with `is_active` | 401/403 `ACCOUNT_DISABLED` |
| `require_permission(code)` | `CurrentUser` + permission string | same user | 403 `FORBIDDEN` |
| `require_roles(*roles)` | `CurrentUser` | same user | 403 — prefer permissions for new endpoints |
| `require_admin` | shorthand | — | 403 |
| `require_manager` | Admin **or** Manager | — | 403 |
| `get_farm_context` | JWT `farm_id` + optional header | validated farm id | 403 `FARM_ACCESS_DENIED` |

### 7.2 `CurrentUser` Context Object

Logical fields (dataclass / Pydantic model in `app/schemas` or `app/core`):

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | `sub` |
| `email` | str | Optional load from DB |
| `farm_id` | UUID | Active tenant |
| `role` | enum | `ADMIN` \| `MANAGER` \| `WORKER` |
| `permissions` | frozenset[str] | Effective set |
| `token_version` | int | From `tv` claim |
| `jti` | str | Access token id |

### 7.3 Authorization Enforcement Pattern

```
Route:
  Depends(get_current_active_user)
  Depends(require_permission("harvests:write"))
  → HarvestService.record_harvest(dto, current_user)

Service:
  assert membership / farm_id
  assert domain rules
  commit + events
```

**Do not** implement `require_worker()` as “must be worker only.” Workers are the least privileged role; gates are “has permission,” not “is exactly worker.”

### 7.4 Public vs Protected Routes

| Public (no user) | Protected |
|------------------|-----------|
| `GET /health`, `GET /health/ready` | All `/api/v1/*` business routes |
| `POST /auth/login`, `register`, `forgot-password`, `reset-password`, `verify-email` | `POST /auth/logout`, `GET /auth/me` |
| OpenAPI docs (non-prod only) | `POST /auth/refresh` (validates refresh, not access) |

---

## 8. Session Management

### 8.1 Concurrent Sessions

- Allow multiple refresh token families (web + mobile).
- Cap optional: max **N=10** active refresh tokens per user; revoke oldest on exceed.
- List sessions (GA): device, last IP, last used, revoke one.

### 8.2 Logout All Devices

- Revoke all `refresh_tokens` for user.
- Increment `users.token_version`.
- Audit `LOGOUT_ALL`.

### 8.3 Refresh Strategy

| Policy | Value |
|--------|-------|
| Access TTL | 15m |
| Refresh TTL | 7d |
| Rotation | Mandatory on each refresh |
| Absolute session | Optional max 30d from first login in family |
| Idle timeout | Optional: revoke refresh if `last_used_at` older than 14d |

### 8.4 Account Lockout & Brute Force

| Control | Specification |
|---------|---------------|
| Failed attempts | Count per user (and separately per IP) |
| Lock threshold | **5** failures → lock **15 minutes** (exponential backoff optional) |
| Response | `ACCOUNT_LOCKED` (do not confirm password correctness) |
| Reset | Successful login or admin unlock |
| CAPTCHA | Future after repeated failures |

### 8.5 Suspicious Login (Optional GA)

- New device / new country vs prior sessions → email alert + require refresh re-auth.
- Store coarse geo from IP (privacy policy required).

---

## 9. API Security

### 9.1 Transport & Auth Header

| Control | Spec |
|---------|------|
| HTTPS only | TLS terminated at reverse proxy; HSTS enabled |
| Auth scheme | `Authorization: Bearer <access_token>` |
| No tokens in URLs | Prevents log leakage |
| Body size | 1 MB JSON; 10 MB multipart (Phase 3) |

### 9.2 Input / Output Validation

- **Input:** Pydantic v2 on all bodies/queries; reject unknown fields where appropriate (`extra=forbid` on auth DTOs).
- **Output:** Response schemas only — never ORM; never `password_hash`.
- **Mass assignment:** Explicit Create/Update schemas (ADR-005).

### 9.3 Injection & XSS

| Threat | Mitigation |
|--------|------------|
| SQL injection | SQLAlchemy parameterized only; no f-string SQL |
| XSS | JSON API; sanitize rich text if ever rendered as HTML |
| CSRF | Bearer header auth → CSRF N/A; if refresh cookie → `SameSite=Strict`, `Secure`, CSRF token on cookie-auth routes |
| SSRF | No user-controlled server-side URL fetch in MVP |
| Path traversal | File storage via keyed object IDs (ADR-012) |

### 9.4 Rate Limiting

| Scope | Limit |
|-------|-------|
| Login / register | **10/min per IP** (Phase 3); prefer **5/min** for login alone |
| Password reset | **3/hour per email** |
| Refresh | **30/min per IP** |
| Report generation | **5/hour per user** |
| General API | **100/min per user** |
| File upload | **20/hour per user** |

MVP: in-memory / process-local. Production: Redis-backed sliding window.

### 9.5 Security Headers & CSP

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'none'   # API responses
```

API CSP is minimal; the Next.js app owns its own CSP.

### 9.6 CORS

```
Allowed origins: https://app.ponddesk.app, http://localhost:3000
Allowed methods: GET, POST, PATCH, DELETE, OPTIONS
Allowed headers: Authorization, Content-Type, X-Farm-Id, X-Request-Id
Expose: X-Request-Id, X-Response-Time
Credentials: true  # only if cookie refresh is used
```

Never `Access-Control-Allow-Origin: *` with credentials.

### 9.7 Tenant Isolation

- Repository: every operational query includes `farm_id` (ADR-013).
- Service: verify entity ownership.
- Future: PostgreSQL RLS with `SET LOCAL app.current_farm_id` (Phase 3 §9.8).

---

## 10. Middleware Recommendations

### 10.1 Stack (Outermost → Innermost)

| Order | Middleware | Purpose |
|------:|------------|---------|
| 1 | Trusted Hosts | Reject bad `Host` in production |
| 2 | HTTPS redirect | Optional behind proxy that already terminates TLS |
| 3 | CORS | Origin whitelist |
| 4 | GZip | Responses > 1 KB |
| 5 | Request ID | Create/propagate `X-Request-Id` |
| 6 | Security Headers | HSTS, nosniff, frame deny, etc. |
| 7 | Rate Limiting | IP/user throttles |
| 8 | Request Logging | Method, path, status, duration, `user_id`, `farm_id`, `request_id` (no bodies with secrets) |

### 10.2 Not Global Middleware

| Concern | Use instead |
|---------|-------------|
| Authentication | `Depends(get_current_user)` |
| Authorization | `Depends(require_permission(...))` |
| Input validation | Pydantic on routes |
| Transactions | Service / UoW |

---

## 11. Secrets Management

### 11.1 Secret Inventory

| Secret | Dev | Production |
|--------|-----|------------|
| `JWT_SECRET` / signing private key | `.env` | AWS SM / GCP SM / Vault |
| JWT public key (verify) | file/env | Secrets manager or mounted file |
| `DATABASE_URL` | `.env` | Secrets manager; IAM auth preferred long-term |
| Argon2 pepper (optional) | `.env` | Secrets manager |
| SMTP / email API keys | `.env` | Secrets manager |
| Object storage keys | `.env` | Instance role / SM |
| Sentry / observability tokens | `.env` | SM |

### 11.2 Rules

- Load via pydantic-settings at startup; **crash** if required secrets missing in `ENV=production`.
- Never log secret values; redact in error reports.
- Rotate JWT signing keys with `kid` overlap window.
- Separate CI secrets from production; fixed JWT secret only in tests.
- `.env` in `.gitignore`; provide `.env.example` with placeholders only.

### 11.3 Cloud Secrets (Future)

- Short-lived DB credentials via IAM.
- Automatic rotation for SMTP and signing keys.
- No secrets in container images or Kubernetes ConfigMaps (use Secrets / external operator).

---

## 12. Audit Logging

### 12.1 Principles

- Append-only `audit_log` (Phase 2).
- Record **who**, **what**, **when**, **farm**, **request_id**, **outcome**.
- Never store passwords, tokens, or full card-like secrets.
- Security events are mandatory even when business mutation audit is sampled.

### 12.2 Required Security / Auth Events

| Event | Trigger |
|-------|---------|
| `LOGIN_SUCCESS` | Successful login |
| `LOGIN_FAILED` | Bad password / unknown user (no PII beyond email hash optional) |
| `LOGOUT` / `LOGOUT_ALL` | Session end |
| `TOKEN_REFRESHED` | Refresh rotation |
| `TOKEN_REUSE_DETECTED` | Refresh reuse → family revoke |
| `TOKEN_REVOKED` | Explicit revoke |
| `PASSWORD_CHANGED` | Authenticated change |
| `PASSWORD_RESET_REQUESTED` / `PASSWORD_RESET_COMPLETED` | Reset flow |
| `ACCOUNT_LOCKED` / `ACCOUNT_UNLOCKED` | Lockout |
| `EMAIL_VERIFIED` | Verification |
| `PERMISSION_CHANGED` / `ROLE_CHANGED` | Admin team ops |
| `USER_INVITED` / `USER_REMOVED` | Membership changes |

### 12.3 High-Value Business Audits (Security-Relevant)

| Event | Why |
|-------|-----|
| `HARVEST_RECORDED` / `HARVEST_VOIDED` | Financial / inventory integrity |
| `INVENTORY_RESTOCKED` / `INVENTORY_ADJUSTED` | Shrinkage / fraud |
| `BATCH_CLOSED` / `BATCH_DELETED` (soft) | Lifecycle integrity |
| `SETTINGS_UPDATED` | Control-plane changes |
| `EXPORT_REQUESTED` | Data exfiltration monitoring |

### 12.4 Operational Logging vs Audit

| Type | Destination | Retention |
|------|-------------|-----------|
| Structured app logs | stdout → aggregator | 30–90 days |
| Audit log | PostgreSQL `audit_log` | Long-term (compliance) |
| Auth metrics | counters (login fail rate) | Metrics backend |

---

## 13. Error Handling

### 13.1 Security Error Codes

Align with Phase 3 envelope (`success`, `message`, `error_code`, `request_id`).

| HTTP | `error_code` | Meaning |
|-----:|--------------|---------|
| 401 | `UNAUTHORIZED` | Missing/malformed Authorization header |
| 401 | `INVALID_TOKEN` | Bad signature, unknown refresh, malformed JWT |
| 401 | `EXPIRED_TOKEN` | Access or refresh past `exp` |
| 401 | `REVOKED_TOKEN` | Explicitly revoked / reuse-compromised family |
| 401 | `INVALID_CREDENTIALS` | Login failed (generic) |
| 403 | `FORBIDDEN` | Authenticated but missing permission |
| 403 | `FARM_ACCESS_DENIED` | Not a member of requested farm |
| 403 | `ACCOUNT_DISABLED` | `is_active=false` |
| 403 | `ACCOUNT_LOCKED` | Temporary lockout |
| 403 | `EMAIL_NOT_VERIFIED` | When verification enforced |
| 429 | `RATE_LIMITED` | Throttle exceeded |

### 13.2 Response Rules

- Same message for unknown email vs bad password on login.
- Never include stack traces or SQL in client responses.
- Include `request_id` for support correlation.
- Map service `AuthenticationError` / `AuthorizationError` in centralized handlers (Phase 4 §15).

---

## 14. Future Security Enhancements

Design hooks now; implement later without redesigning tenancy.

| Feature | Design hook |
|---------|-------------|
| **2FA / TOTP** | `users.mfa_enabled`, `mfa_secret_encrypted`; login returns `mfa_required` intermediate token |
| **WebAuthn** | Separate credential table; step-up for admin actions |
| **SSO / OIDC** | `auth_identities` (provider, subject); link to `users`; JIT provisioning into memberships |
| **OAuth providers** | Google/Microsoft via OIDC; still issue PondDesk token pair |
| **API keys** | Hashed keys for integrations; scoped permissions; no refresh; farm-scoped |
| **Mobile auth** | Same token pair; certificate pinning optional; biometric unlock of refresh store on device |
| **Multi-tenant orgs** | Org above farms; org-admin role; keep farm_id as operational scope |
| **Step-up auth** | Re-auth for `exports:run`, user remove, password change |
| **PostgreSQL RLS** | Session `app.current_farm_id` as second line of defense |

---

## 15. Testing Strategy

### 15.1 Pyramid Focus for Security

| Layer | What to test |
|-------|--------------|
| **Unit** | Argon2 hash/verify; JWT claim build/validate; permission bundle resolution; lockout counters |
| **Service** | Login, refresh rotation, reuse detection, password reset, logout-all |
| **API** | 401/403 matrices; RBAC per role; rate limit headers; CORS preflight |
| **Integration** | Refresh hash storage; audit rows written; token_version invalidation |

### 15.2 Mandatory Test Cases

| Case | Expectation |
|------|-------------|
| Valid login | 200 + access + refresh created |
| Bad password | 401 `INVALID_CREDENTIALS`; audit fail |
| Expired access | 401 `EXPIRED_TOKEN` |
| Tampered JWT | 401 `INVALID_TOKEN` |
| Worker → `POST /harvests` | 403 `FORBIDDEN` |
| Manager → harvest create | 200 (with farm scope) |
| Cross-farm resource id | 404 or 403 (no leakage) |
| Refresh once | New pair; old refresh dead |
| Refresh reuse | Family revoked; 401 |
| Logout | Refresh unusable |
| Password change | Old refresh dead; `tv` bump |
| Rate limit login | 429 after threshold |
| Permission matrix snapshot | Seeded role bundles match §6 |

### 15.3 Test Hygiene

- Fixed `JWT_SECRET` in pytest.
- Fake clock for expiry tests.
- Never use production hashes/secrets in fixtures.
- CI: `pip-audit` / Dependabot; grep that `app/security` does not import routes.

---

## 16. Security Best Practices

1. **Short-lived access + rotatable refresh** — default session model.  
2. **Argon2id only for new passwords** — ADR-014.  
3. **Permission strings over role-only checks** — ADR-007.  
4. **Farm scope everywhere** — JWT + service + repository (ADR-013).  
5. **Depends for auth, not global middleware.**  
6. **Generic auth failure messages** — no user enumeration.  
7. **Audit security events** — especially refresh reuse and lockouts.  
8. **Secrets from environment / SM** — fail closed in production.  
9. **Rate-limit auth endpoints** harder than general API.  
10. **Defense in depth** — route permission + service ownership.  
11. **Least privilege defaults** — Worker cannot harvest, void, or manage users.  
12. **Redact tokens** in logs and exception reporters.  
13. **Dependency scanning** in CI.  
14. **Separate signing keys** per environment (`iss`/`aud` isolation).  
15. **Plan key rotation** (`kid`) before first production cutover.

### 16.1 What Security Code Must Never Do

| Never | Why |
|-------|-----|
| Implement business harvest/inventory rules | Wrong layer |
| Return HTTP Response objects from `app/security` | Keep pure crypto/helpers |
| Write SQL | Repositories only |
| Trust client-supplied role in body | Role comes from membership DB at login |
| Disable TLS verification “temporarily” in prod | Downgrade attacks |

---

## 17. Architecture Decision Rationale

| # | Decision | Alternatives | Rationale |
|---|----------|--------------|-----------|
| SEC-001 | JWT access + opaque refresh | Session cookie only; long-lived JWT | Scalable API + revocable sessions (ADR-006) |
| SEC-002 | Refresh rotation + reuse detection | Refresh without rotation | Detects stolen refresh tokens |
| SEC-003 | Argon2id | bcrypt, scrypt | OWASP recommendation (ADR-014) |
| SEC-004 | Permission strings | Role-only; full ABAC | Simple for 3 roles; extensible (ADR-007) |
| SEC-005 | Auth via FastAPI Depends | Global auth middleware | Public routes; clearer OpenAPI |
| SEC-006 | 15m / 7d TTLs | 1h access / 30d refresh | Balance UX vs stolen-token window |
| SEC-007 | `token_version` for access kill | Large JWT denylist only | Cheap global invalidate |
| SEC-008 | Permissions in JWT (MVP) | DB lookup every request | Performance; short TTL limits staleness |
| SEC-009 | Hash refresh tokens at rest | Store plaintext | DB leak resistance |
| SEC-010 | Route + service authz | Route-only | Defense in depth (Phase 9 SVC-008) |
| SEC-011 | Bearer header (not cookie) for access | Cookie access token | Simplifies CSRF for SPA/mobile |
| SEC-012 | Lockout after 5 failures | CAPTCHA-only | Stops credential stuffing without UX tax on success path |
| SEC-013 | RS256/ES256 in production | HS256 everywhere | Key distribution & blast-radius control |
| SEC-014 | Email verification optional MVP | Mandatory day one | Unblocks implementation; hooks ready for GA |
| SEC-015 | No SQL/FastAPI in this design doc | Code-first security | Matches phases 5–9 design-before-build |

### 17.1 Alignment Map

| Phase / ADR | Contribution |
|-------------|--------------|
| Phase 3 §9–§10 | Rate limits, CORS, permission matrix baseline |
| Phase 4 §13–§14 | Dependency placement, middleware order |
| Phase 8–9 | Farm scope in repos/services |
| ADR-006 / 007 / 014 | Token, RBAC, password decisions |
| Phase 10 | This specification — full security architecture |

### 17.2 Implementation Readiness Checklist

- [ ] Implement `app/security/` (password hasher, JWT issuer/validator, token hasher)  
- [ ] Implement `app/dependencies/auth.py` + `permissions.py`  
- [ ] Seed role permission bundles matching §6  
- [ ] `AuthService`: login, refresh (rotation + reuse), logout, password reset  
- [ ] `refresh_tokens` persistence via repository (hashed)  
- [ ] Account lockout + auth rate limits  
- [ ] Audit events for §12.2  
- [ ] Security test suite §15.2 in CI  
- [ ] Production secrets + RS256/ES256 keys  
- [ ] Confirm Phase 3 bcrypt references treated as superseded by ADR-014  

---

**Document Status:** Ready for security & auth implementation.  
**Next Phase:** [Phase 11 — API Presentation Layer](./11-api-presentation-layer.md), then Phase 12 — scaffold & vertical-slice implementation.
