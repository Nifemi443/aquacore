# CI/CD Pipeline & Production Deployment Architecture

> **Phase:** 15 — Continuous Integration, Continuous Deployment & Production Release  
> **Status:** Approved — Pre-Implementation  
> **Project:** PondDesk Fish Farm Management Platform  
> **Stack:** GitHub Actions · Docker · GHCR · Nginx · Ubuntu · FastAPI · Next.js · PostgreSQL · Redis · Alembic · Python 3.13+  
> **Depends on:** Phase 6 (migrations) · Phase 10 (secrets) · Phase 11 (health) · Phase 12 (workers) · Phase 13 (test gates) · Phase 14 (Docker/Compose/Nginx)

Designs production-ready CI/CD, release management, environment promotion, zero-downtime deploy patterns, rollback, secrets, security scanning, and disaster recovery for the PondDesk stack. No workflow YAML, Dockerfiles, or deploy scripts are implemented in this phase.

## Related Documents

- [Infrastructure Architecture (Phase 14)](./14-infrastructure-architecture.md) — Containers, Compose, Nginx, backups, health
- [Testing Architecture (Phase 13)](./13-testing-architecture.md) — PR test stages & coverage gates
- [Migration Strategy (Phase 6)](./06-migration-strategy.md) — Expand/contract, deploy & rollback rules
- [Security Architecture §11](./10-security-architecture.md#11-secrets-management) — App secrets & JWT
- [Background Processing (Phase 12)](./12-background-processing.md) — Worker/Beat deploy constraints
- [API Presentation § Health](./11-api-presentation-layer.md) — `/health/live`, `/health/ready`
- [Deployment Index](../deployment/README.md) — Runtime quick reference

---

## Table of Contents

- [1. Deployment Overview](#1-deployment-overview)
- [2. CI Pipeline](#2-ci-pipeline)
- [3. CD Pipeline](#3-cd-pipeline)
- [4. GitHub Actions Design](#4-github-actions-design)
- [5. Environment Strategy](#5-environment-strategy)
- [6. Docker Image Strategy](#6-docker-image-strategy)
- [7. Database Deployment](#7-database-deployment)
- [8. Production Server Architecture](#8-production-server-architecture)
- [9. Rollback Strategy](#9-rollback-strategy)
- [10. Zero-Downtime Deployment](#10-zero-downtime-deployment)
- [11. Monitoring During Deployment](#11-monitoring-during-deployment)
- [12. Secrets Management](#12-secrets-management)
- [13. Security Best Practices](#13-security-best-practices)
- [14. Disaster Recovery](#14-disaster-recovery)
- [15. Documentation Requirements](#15-documentation-requirements)
- [16. Architecture Decision Rationale](#16-architecture-decision-rationale)

---

## 1. Deployment Overview

### 1.1 Goals

| Goal | Approach |
|------|----------|
| **Shift-left quality** | Every PR runs lint, types, security scan, unit + integration tests, coverage gate |
| **Immutable artifacts** | Build once; promote the same image digests across staging → production |
| **Safe schema change** | Alembic oneshot migrate job; Phase 6 expand/contract; backup before prod migrate |
| **Low downtime** | Rolling (MVP) / blue-green (preferred on dual slot); health-gated traffic switch |
| **Fast recovery** | Image re-tag + previous Compose revision; forward-fix migrations preferred |
| **Auditable releases** | SemVer tags, GitHub Releases, deploy annotations, audit of who promoted |
| **Least privilege** | Separate deploy identities per env; no prod secrets in PR workflows |

### 1.2 End-to-End Flow

```
Developer → Feature branch → Pull Request
                │
                ▼
         CI (GitHub Actions)
    lint · types · security · tests · coverage · build verify
                │
                ▼
         Merge to main (protected)
                │
                ▼
         Build & push images (GHCR)
                │
                ▼
         Deploy Staging → migrate → health → smoke
                │
                ▼
         Manual / gated Promote to Production
                │
                ▼
         Backup DB → migrate → rolling/blue-green switch
                │
                ▼
         Health · smoke · notify · observe soak window
```

### 1.3 Non-Goals (This Phase)

- No Kubernetes/Terraform required for MVP (Compose on Ubuntu; path documented in Phase 14 §16)
- No multi-region active-active failover
- No implementation of workflow YAML or shell deployers
- No automatic production deploy without human gate for MVP (may relax later for staging-only auto)

### 1.4 Deployment Folder Structure

Extends Phase 14 monorepo layout with explicit CD assets:

```
ponddesk/
├── .github/
│   ├── workflows/                 # CI/CD workflow definitions
│   │   ├── ci.yml                 # PR continuous integration
│   │   ├── code-quality.yml       # Optional dedicated quality (or job in ci)
│   │   ├── security.yml           # Scheduled + PR security scans
│   │   ├── docker-build.yml       # Build/push on main & tags
│   │   ├── deploy-staging.yml     # Auto/manual staging deploy
│   │   ├── deploy-production.yml  # Gated production deploy
│   │   ├── release.yml            # SemVer tag → GitHub Release
│   │   └── dependabot-automerge.yml  # Optional (policy-gated)
│   ├── CODEOWNERS                 # Review ownership
│   └── dependabot.yml             # Dependency update PRs
│
├── docker/                        # Compose files (Phase 14)
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── docker-compose.test.yml
│   └── docker-compose.prod.yml
│
├── deployment/                    # Production/staging deploy assets
│   ├── staging/
│   │   ├── compose.override.yml   # Env-specific Compose overlays
│   │   └── inventory.env.example  # Non-secret host inventory hints
│   ├── production/
│   │   ├── compose.override.yml
│   │   └── inventory.env.example
│   ├── nginx/                     # Or symlink → ../../nginx
│   └── README.md                  # Points to this phase + runbooks
│
├── nginx/                         # Edge configs (Phase 14)
│   ├── nginx.conf
│   └── conf.d/ponddesk.conf
│
├── scripts/
│   ├── migrate.sh                 # Alembic upgrade (CI + deploy)
│   ├── backup-db.sh
│   ├── deploy.sh                  # Orchestrates pull/migrate/switch
│   ├── rollback.sh
│   ├── smoke-test.sh              # Post-deploy HTTP checks
│   └── health-wait.sh             # Poll /health/ready
│
├── docs/
│   ├── architecture/15-…          # This document (canonical)
│   └── deployment/                # Runbooks, checklists (indexes)
│
├── backend/                       # API image build context
├── frontend/                      # Next.js image build context
└── Makefile                       # Local + thin wrappers for scripts
```

### 1.5 Directory Purposes

| Directory | Purpose |
|-----------|---------|
| `.github/workflows/` | Automated CI, security, image build, deploy, release |
| `.github/dependabot.yml` | Scheduled dependency PRs (pip, npm, Actions, Docker) |
| `docker/` | Compose definitions shared by local, CI, and server deploys |
| `deployment/` | Environment-specific overlays, inventory notes, deploy docs entry |
| `nginx/` | TLS termination, routing, upstreams used during traffic switch |
| `scripts/` | Idempotent ops automation invoked by Make and GitHub Actions |
| `docs/architecture/` | Canonical design — Phase 15 lives here |
| `docs/deployment/` | Operator-facing indexes, checklists, incident runbooks |

---

## 2. CI Pipeline

Triggered on every pull request targeting `main` (and optionally `develop`). Merge is blocked until all required checks pass (branch protection).

```
Every Pull Request
        ↓
Install Dependencies
        ↓
Lint
        ↓
Format Check
        ↓
Static Analysis
        ↓
Security Scan
        ↓
Unit Tests
        ↓
Integration Tests
        ↓
Build Verification
        ↓
Coverage Report
        ↓
Merge Approval
```

### 2.1 Stage Catalog

| Stage | What runs | Pass criteria | Notes |
|-------|-----------|---------------|-------|
| **Install Dependencies** | Backend: `uv`/`pip` from lockfile; Frontend: `npm ci` | Lockfile resolves; cache hit preferred | Pin lockfiles; no floating latest |
| **Lint** | Backend: `ruff check`; Frontend: ESLint | Zero errors | Matches Phase 13 |
| **Format Check** | `ruff format --check`; Prettier/check | No drift | Format in pre-commit locally |
| **Static Analysis** | `mypy` (domain/services strict-first); `tsc --noEmit` | Zero errors | Gradual mypy strictness OK |
| **Security Scan** | Bandit (high), `pip-audit`, `npm audit` (policy), secret scan | No high/critical unresolved | Warn vs fail policy documented §13 |
| **Unit Tests** | `pytest -m unit` (eager Celery); frontend unit if present | All green | No Docker required |
| **Integration Tests** | Compose Postgres (+ Redis); `alembic upgrade head`; `pytest -m "integration or api or security"` | All green | Phase 13 §13.1 |
| **Build Verification** | Docker build (no push); `from app.main import create_app`; OpenAPI gen; Next.js `next build` | Images build; imports OK | Catches broken Dockerfiles early |
| **Coverage Report** | pytest-cov + upload artifact / Codecov | Overall ≥80%; domain ≥95%; services ≥85% | Phase 13 §15 |
| **Merge Approval** | Required checks + CODEOWNERS + ≥1 review | Human + bots green | No self-approve for risky paths |

### 2.2 Path Filters (Optional Optimization)

| Change set | Required jobs |
|------------|---------------|
| `backend/**` only | Backend lint/types/security/tests + API image build verify |
| `frontend/**` only | Frontend lint/tsc/build; skip backend integration unless shared contracts changed |
| `docs/**` only | Doc lint / link check (optional); skip heavy tests |
| `docker/**`, `nginx/**`, `deployment/**` | Compose config validation + both image builds |
| Shared contracts (`docs/architecture/03-*`, OpenAPI) | Full backend + frontend contract smoke |

Path filters must never skip security or secret scanning when lockfiles or workflows change.

### 2.3 Artifacts Retained from CI

| Artifact | Retention | Use |
|----------|-----------|-----|
| JUnit XML | 14–30 days | GitHub Checks UI |
| Coverage XML/HTML | 14–30 days | Trend & gate |
| Build logs on failure | 14 days | Debug |
| SBOM (optional) | Per release | Supply-chain audit |

### 2.4 What CI Must Not Do

- Deploy to staging/production from PR workflows  
- Use production secrets or production databases  
- Mutate GHCR production tags (`prod-*`, SemVer) from forks  
- Skip hooks via `--no-verify` culture (team rule)

---

## 3. CD Pipeline

### 3.1 Happy Path (Merge → Production)

```
Merge to Main
        ↓
Build Docker Images
        ↓
Push Images (GHCR)
        ↓
Deploy Staging
        ↓
Run Database Migrations (staging)
        ↓
Health Checks
        ↓
Smoke Tests
        ↓
[Human gate / release tag]
        ↓
Backup Production DB
        ↓
Deploy Production (pull images)
        ↓
Run Database Migrations (production)
        ↓
Traffic Switch (rolling / blue-green)
        ↓
Health Checks + Smoke Tests
        ↓
Success Notification + Soak Observe
```

### 3.2 Step Detail

| Step | Description |
|------|-------------|
| **Merge to Main** | Protected branch; CI green; squash or merge commit policy consistent |
| **Build Docker Images** | Multi-stage prod images for `api` (also worker/beat) and `frontend`; same commit SHA |
| **Push Images** | Tag with `sha-<gitsha>`, `main`, and (on release) SemVer; prefer digest pinning on servers |
| **Deploy Staging** | SSH/API to staging host; `compose pull` + migrate oneshot + recreate services |
| **Run Migrations** | Single-flight `alembic upgrade head` before new API replicas serve traffic |
| **Health Checks** | Poll `/health/live` then `/health/ready`; worker ping; Nginx upstream up |
| **Smoke Tests** | Login, dashboard read, one write path (e.g. create pond / record feeding) against staging |
| **Promote** | Manual `workflow_dispatch` or SemVer tag triggers production deploy |
| **Backup** | Snapshot/`pg_dump` before production migrate (mandatory for schema-changing releases) |
| **Production Deploy** | Pull digests; migrate; rolling or blue-green switch (§10) |
| **Verify** | Health + smoke + error-rate/latency soak (§11) |
| **Notify** | Slack/email/GitHub Deployment status: success or auto-open incident path on failure |

### 3.3 Promotion Rules

| From → To | Automation | Gate |
|-----------|------------|------|
| PR → `main` | Auto after checks | Reviews + required CI |
| `main` → Staging | Auto on push to `main` | Staging deploy workflow green |
| Staging → Production | Manual / tag | Staging soak ≥ N minutes (recommend 30–120); checklist signed; backup OK |
| Hotfix tag → Production | Expedited path | Abbreviated soak; still backup + health |

### 3.4 Deploy Identity

GitHub Actions authenticates to the server via:

- **Preferred:** OIDC → short-lived cloud IAM (if hosts are cloud VMs with SSM/SSH certificates), or  
- **MVP Ubuntu:** Deploy key / SSH key stored as GitHub Environment secret; restricted `deploy` Linux user with Docker group membership only for PondDesk Compose project  

Never use a personal admin SSH key as the CD identity.

---

## 4. GitHub Actions Design

### 4.1 Workflow Catalog

| Workflow | File (illustrative) | When it runs | Purpose |
|----------|---------------------|--------------|---------|
| **CI** | `ci.yml` | `pull_request` to `main`; optionally `push` to feature branches | Lint, types, tests, coverage, build verify |
| **Code Quality** | Job inside `ci.yml` (or `code-quality.yml`) | Same as CI | Ruff, mypy, ESLint, `tsc`, format check |
| **Testing** | Jobs inside `ci.yml` | Same as CI; fuller suite on `main` | Unit → integration/api/security; e2e on main/nightly |
| **Security Scan** | `security.yml` + CI jobs | PR (fast); weekly schedule (deep); on lockfile change | Bandit, pip-audit, npm audit, Trivy fs, secret scan |
| **Docker Build** | `docker-build.yml` | Push to `main`; SemVer tags; manual | Build & push GHCR images; optional Trivy image scan gate |
| **Deploy Staging** | `deploy-staging.yml` | After successful image build on `main`; manual | Pull, migrate, recreate, smoke |
| **Deploy Production** | `deploy-production.yml` | `workflow_dispatch` and/or `release` published; environment protection | Backup, migrate, zero-downtime switch, smoke |
| **Release** | `release.yml` | Push tag `v*.*.*` | Generate notes, GitHub Release, attach SBOM/checksums |
| **Dependency Updates** | Dependabot + optional automerge | Schedule (weekly) | Version bumps as PRs through full CI |

### 4.2 Concurrency & Environments

| Concern | Policy |
|---------|--------|
| **Concurrency** | Cancel outdated PR CI runs; never cancel in-flight production deploy |
| **GitHub Environments** | `staging`, `production` with protection rules; production requires reviewer |
| **Permissions** | `contents: read` default; `packages: write` only on build; `id-token: write` if OIDC |
| **Fork PRs** | No secrets; no push to GHCR; CI with restricted permissions |

### 4.3 Job Matrix Sketch (CI)

```
ci
├── backend-quality      (ruff, format, mypy, bandit)
├── frontend-quality     (eslint, tsc, prettier)
├── backend-unit         (pytest -m unit)
├── backend-integration  (compose test DB + alembic + pytest markers)
├── frontend-build       (next build)
├── docker-build-verify  (build api + frontend, no push)
└── security-deps        (pip-audit, npm audit -- omit dev policy)
```

Jobs should fail fast where independent; integration depends on quality optionally for cost control.

### 4.4 Nightly / Scheduled

| Schedule | Workload |
|----------|----------|
| Nightly | Full e2e (Phase 13), migration upgrade/downgrade smoke on ephemeral DB, optional schemathesis |
| Weekly | Deep Trivy (OS + libs), Dependabot digest, restore-backup drill dry-run against staging snapshot |
| Monthly | Load smoke against staging (k6/Locust) — non-blocking unless regression threshold breached |

---

## 5. Environment Strategy

| Environment | Purpose | Data | Deploy trigger | Parity |
|-------------|---------|------|----------------|--------|
| **Development** | Engineer laptops / local Compose | Synthetic seed; disposable | `make up` | Close: same images optional; hot reload overrides |
| **Testing** | Ephemeral CI / local pytest | Throwaway Postgres volume | Every CI run | Same major Postgres; Celery eager; fakes (ADR-012) |
| **Staging** | Pre-prod validation, QA, partner demos | Anonymized or synthetic prod-like | Auto from `main` | Same Compose topology as prod; sandbox SMTP; separate secrets |
| **Production** | Paying farms / live operations | Real farm data | Manual / release gate | Canonical; DEBUG=false; SM secrets; no public `/docs` |

### 5.1 Rules

1. **No shared databases** across environments.  
2. **No production data** in development without anonymization pipeline.  
3. **Config differs; images do not** — promote digests, not rebuilds.  
4. **Staging must exercise workers + Beat** (not API-only).  
5. **URL map** (from Phase 14 / deployment index):

| Env | API | App |
|-----|-----|-----|
| Production | `https://api.ponddesk.app/api/v1/` | `https://app.ponddesk.app` |
| Staging | `https://api-staging.ponddesk.app/api/v1/` | `https://staging.ponddesk.app` |
| Local | `http://localhost:8000/api/v1/` | `http://localhost:3000` |

### 5.2 Environment Protection (GitHub)

| Environment | Required reviewers | Wait timer | Secrets scope |
|-------------|-------------------|------------|---------------|
| `staging` | Optional | 0 | Staging SSH, staging SM |
| `production` | ≥1 release owner | Optional 5–10 min | Prod SSH/OIDC, prod SM refs only |

---

## 6. Docker Image Strategy

### 6.1 Multi-Stage Builds

| Stage | Contents | Discarded after? |
|-------|----------|------------------|
| **deps / builder** | Compilers, `uv`/`npm`, test-only tools | Yes |
| **runtime** | Slim Python/Node base, app code, non-root user | Final image |

- **API / Worker / Beat:** one image, different `CMD` (Phase 14 INF-003).  
- **Frontend:** Next.js standalone output preferred for smaller runtime.  
- **No secrets** in build args that persist in layers; use BuildKit secret mounts if needed for private deps.

### 6.2 Image Versioning

| Tag | When | Mutable? |
|-----|------|----------|
| `sha-<fullgitsha>` | Every main build | Immutable content (tag may be overwritten only if same SHA rebuild — avoid) |
| `main` | Tip of main | Mutable pointer |
| `vMAJOR.MINOR.PATCH` | Release | Immutable |
| `vMAJOR.MINOR` | Optional floating minor | Mutable |
| `staging` / `prod` | Optional env pointers | Mutable; prefer digest in Compose |

**Production Compose pins digests** (`image@sha256:…`) recorded in deployment lockfile or release notes.

### 6.3 Registry

| Item | Choice |
|------|--------|
| Registry | **GitHub Container Registry (GHCR)** |
| Visibility | Private packages for MVP |
| Auth | `GITHUB_TOKEN` in Actions; deploy pull token / OIDC on server |
| Retention | Keep all SemVer; prune untagged / old `sha-*` after N days (e.g. 90) |

### 6.4 Image Scanning

| Scan | Gate |
|------|------|
| Trivy/Grype on built image | Fail on CRITICAL; HIGH with exception ticket |
| Scan base image weekly | Rebuild if fixed base available |
| Sign images (cosign) optional | Recommended at production hardening milestone |

### 6.5 Caching & Optimization

| Technique | Benefit |
|-----------|---------|
| Registry cache / GHA cache for BuildKit layers | Faster CI |
| Lockfile-only dependency layers before COPY app | Cache stability |
| `.dockerignore` excludes tests, docs, `.git` | Smaller context |
| Pin base digests in production Dockerfiles | Reproducible builds |
| Single API image for workers | Less registry churn |

---

## 7. Database Deployment

Aligns with Phase 6 and Phase 14 INF-006 (migrate oneshot before API).

### 7.1 Migration Ordering in a Release

```
1. CI already proved: alembic upgrade head on ephemeral DB
2. Staging: backup (optional light) → upgrade head → start new app
3. Production: mandatory backup/snapshot → upgrade head (single job)
4. Only then: roll API / workers to new image
5. Verify alembic_version + smoke writes
```

**Never** run migrations from multiple API replicas concurrently. Use a oneshot Compose `migrate` service or deploy script with a lock.

### 7.2 Migration Validation

| Check | Where |
|-------|-------|
| Single head (`alembic heads`) | CI + pre-merge |
| Upgrade from previous release tag DB dump | Staging pre-prod for risky revisions |
| Expand/contract compliance | PR review (Phase 6) |
| Downgrade smoke (non-prod only) | Nightly ephemeral |

### 7.3 Backup Before Migration

| Release type | Production backup |
|--------------|-------------------|
| App-only (no migration) | Point-in-time / last nightly sufficient |
| Schema or data migration | **Fresh snapshot or `pg_dump` immediately before migrate** |
| Contract-phase migration | Fresh backup + explicit rollback plan in release notes |

### 7.4 Rollback (Database)

| Situation | Action |
|-----------|--------|
| Expand-only migration + app rollback | Redeploy previous app image; leave new columns (safe) |
| Failed migration mid-way | Restore from pre-migrate backup if transaction aborted uncleanly; prefer forward-fix migration |
| Contract already applied | **Forward fix** — do not blind `alembic downgrade` in production without rehearsed plan (Phase 6) |

### 7.5 Post-Migration Verification

- `alembic current` matches release expected revision  
- `/health/ready` returns OK  
- Critical queries: login, list ponds, record feeding, harvest eligibility path  
- Worker can enqueue/consume one known task  
- No prolonged lock/blocking queries (watch `pg_stat_activity` during migrate)

---

## 8. Production Server Architecture

MVP production target: **single Ubuntu LTS host** (or one app host + managed Postgres) running Docker Engine + Compose, matching Phase 14 topology. Scale-out path remains Phase 14 §16.

### 8.1 Logical Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Ubuntu LTS Host (or App VM + Managed PostgreSQL)               │
│                                                                 │
│  ┌─────────┐   ┌──────────┐  ┌──────────┐  ┌─────────────────┐ │
│  │  Nginx  │──▶│ FastAPI  │  │ Next.js  │  │ Celery Worker   │ │
│  │  :443   │   │  (api×N) │  │ frontend │  │ Celery Beat (×1)│ │
│  └─────────┘   └────┬─────┘  └──────────┘  └────────┬────────┘ │
│       │             │                                │          │
│       │             ▼                                ▼          │
│       │        ┌─────────┐                     ┌─────────┐      │
│       │        │  Redis  │◄────────────────────┤ queues  │      │
│       │        └─────────┘                     └─────────┘      │
│       │             │                                           │
│       │             ▼                                           │
│       │        ┌──────────────┐     ┌──────────────────────┐    │
│       └───────▶│ PostgreSQL   │     │ Object storage (S3)  │    │
│                │ (local/managed)    │ reports / media      │    │
│                └──────────────┘     └──────────────────────┘    │
│                                                                 │
│  Agents: node exporter / Docker logs → aggregator               │
│  Cron: backup-db.sh, cert renew (certbot), prune images         │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Component Roles

| Component | Role in production |
|-----------|--------------------|
| **Ubuntu** | Hardened host OS; unattended-upgrades for security; SSH key-only |
| **Docker** | Runs all app services; Compose project `ponddesk` |
| **Nginx** | TLS, HTTP→HTTPS, `/api/*` → API, `/` → Next, security headers, rate limits |
| **FastAPI** | Stateless API; Gunicorn+Uvicorn; scale replicas when needed |
| **Next.js** | SSR/standalone UI; no direct DB access |
| **Redis** | Celery broker (+ cache/rate-limit later); not public |
| **Workers** | Celery consumers by queue; scale horizontally |
| **Beat** | Exactly one scheduler replica |
| **PostgreSQL** | System of record; prefer managed in prod when budget allows |
| **Health monitoring** | Container healthchecks + external uptime on `/health/ready` |

### 8.3 Network Exposure

| Port | Public? |
|------|---------|
| 443/80 (Nginx) | Yes |
| 8000, 3000, 5432, 6379 | **No** — Docker internal network only |

### 8.4 Host Layout (Recommended Paths)

| Path | Contents |
|------|----------|
| `/opt/ponddesk/` | Compose files, overlays, deploy lock (digests) |
| `/opt/ponddesk/scripts/` | Symlink or copy of migrate/backup/rollback |
| `/var/log/ponddesk/` | Optional host-side Nginx logs if not stdout-only |
| Secret injection | Env file from SM **outside git**, mode `0600`, owned by deploy user |

### 8.5 Managed Postgres Variant

When DB is managed (RDS/Cloud SQL): omit `postgres` container; set `DATABASE_URL` with TLS; run migrate job from app network with egress allowlist; backups via provider PITR + app-level dump for migrate windows.

---

## 9. Rollback Strategy

### 9.1 Decision Tree

```
Deploy unhealthy?
    ├─ Application failure (5xx, failed smoke, bad ready)
    │     → Rollback application images to previous digests
    │     → Keep DB if migration was expand-only / no-op
    │
    ├─ Database failure (migrate error, corruption risk)
    │     → Stop traffic / maintenance page
    │     → Restore pre-migrate backup if needed
    │     → Redeploy last known-good app + matching alembic_version
    │
    └─ Partial (workers only)
          → Pin worker/beat to previous image; keep API if compatible
```

### 9.2 Failed Deployment

1. GitHub Actions marks deploy failed; page on-call / notify channel.  
2. Nginx serves previous upstream set (blue-green) **or** Compose recreates previous digests (rolling).  
3. Do **not** push hotfixes to `main` without CI — use hotfix branch → PR → tag.  
4. Capture logs, `request_id`s, migrate output as incident artifacts.

### 9.3 Application Failure

| Action | Detail |
|--------|--------|
| Revert Compose image digests | `rollback.sh` reads `previous-release.lock` |
| Recreate api, frontend, worker, beat | Order: stop new → start old → health wait |
| Skip migrate | If no schema change or expand-compatible |
| Smoke | Same suite as deploy |
| Announce | Deployment status = failure; rollback = success/fail |

### 9.4 Database Failure

| Action | Detail |
|--------|--------|
| Halt deploys | Environment lock |
| Assess | Can forward-fix? Prefer Phase 6 forward fix |
| Restore | From pre-migrate snapshot (§14) |
| Align images | App version must match schema expectations |
| Verify | `alembic current`, integrity checks, smoke |

### 9.5 Rollback Verification

- `/health/ready` green  
- Error rate back to baseline  
- Queue depth draining (not wedged)  
- One successful authenticated write  
- Confirm GitHub Deployment / release notes updated with rollback event  

### 9.6 Recovery After Rollback

- Root-cause in staging with failing digest  
- Forward fix PR  
- New SemVer patch release  
- Update runbook if process gap found  

---

## 10. Zero-Downtime Deployment

### 10.1 Recommended Progression

| Stage | Strategy | When |
|-------|----------|------|
| **MVP (single host)** | **Rolling with health gate** | One Compose project; brief connection drain |
| **Preferred hardening** | **Blue-green on same host** | Dual upstream slots in Nginx (`blue`/`green`) |
| **Later** | Canary ( % traffic ) | Multiple nodes or mesh; not required day one |

### 10.2 Rolling Deployment (MVP Default)

```
1. Pull new images
2. Run migrate oneshot (compatible with old app — expand/contract!)
3. Recreate API replica(s) one at a time (or with stop_grace_period)
4. Wait /health/ready
5. Recreate frontend
6. Recreate workers (drain: warm shutdown)
7. Recreate Beat last (single instance)
8. Reload Nginx if upstream ports changed
9. Smoke + observe
```

**Requirement:** Migrations must be **backward-compatible** with the previous app version for the duration of the roll (Phase 6 expand before contract).

### 10.3 Blue-Green (Preferred When Feasible)

```
        Nginx
       /     \
   Blue       Green
   (live)     (idle / new)
```

1. Deploy new version to idle color (full stack slice: api+frontend; shared Redis/Postgres).  
2. Migrate (expand-compatible).  
3. Health + smoke against idle color via internal hostname.  
4. Switch Nginx upstream to new color (atomic reload).  
5. Keep old color warm for fast rollback during soak window.  
6. Decommission old color after soak.

Workers: either share queues (version-tolerant tasks) or pause consumers briefly; prefer idempotent tasks (Phase 12).

### 10.4 Canary Release (Future)

- Route 5–10% of traffic via Nginx split or separate canary host.  
- Compare error rate/latency vs baseline.  
- Promote or abort.  
- Skip until multi-instance capacity exists.

### 10.5 Traffic Switching

| Mechanism | Use |
|-----------|-----|
| Nginx `upstream` + `nginx -s reload` | Blue-green switch |
| Compose `scale` / recreate | Rolling |
| DNS TTL changes | Avoid for app cutover (too slow/sticky) |

### 10.6 Health Validation Gate

Before declaring success:

| Check | Must pass |
|-------|-----------|
| API live + ready | Yes |
| Frontend HTTP 200 | Yes |
| Worker ping | Yes |
| Beat process up | Yes |
| Smoke script | Yes |
| Error rate < threshold for soak | Yes (staging auto; prod soak) |

Failed gate → automatic rollback trigger for production workflow.

---

## 11. Monitoring During Deployment

### 11.1 Deployment Status

| Signal | Source |
|--------|--------|
| Workflow run state | GitHub Actions |
| Environment deployment | GitHub Deployments API |
| Compose service state | `docker compose ps` on host |
| Release annotation | SemVer + git SHA in logs/`X-App-Version` header (recommended) |

### 11.2 Application Health

| Metric / probe | Alert if |
|----------------|----------|
| `/health/ready` | Non-200 for >1–2 min |
| HTTP 5xx rate | Spike vs 1h baseline |
| Auth failures | Sudden surge (misconfig JWT) |

### 11.3 Database

| Signal | Alert if |
|--------|----------|
| Connections near `max_connections` | Saturation |
| Migration locks / long transactions | During deploy window |
| Disk free | <15% |
| Replication lag | If replica exists |

### 11.4 Workers & Queues

| Signal | Alert if |
|--------|----------|
| Celery inspect ping | Worker down |
| Queue depth | Sustained growth (Phase 12 thresholds) |
| Task failure rate | Spike after deploy |
| Beat heartbeat | Missing schedules |

### 11.5 Logs & Latency

| Stream | Watch for |
|--------|-----------|
| API JSON logs | `ERROR`/`CRITICAL`, migration noise |
| Nginx access | 502/504 bursts |
| p95 latency | Regression > agreed % (e.g. +50% sustained) |

### 11.6 Soak Window

| Env | Minimum observe after cutover |
|-----|-------------------------------|
| Staging | 15–30 minutes before prod promote |
| Production | 30–120 minutes with old color retained (blue-green) |

---

## 12. Secrets Management

### 12.1 Secret Inventory

| Secret | Environments | Notes |
|--------|--------------|-------|
| **JWT signing secret / keys** | All non-test | Rotate with `kid` overlap (Phase 10); never in images |
| **Database credentials** | Staging, prod, CI test (ephemeral) | Least-privilege DB role; TLS in prod |
| **Redis URL/password** | Staging, prod | Internal network; AUTH enabled in prod |
| **SMTP credentials** | Staging (sandbox), prod | Separate providers/accounts |
| **Object storage keys** | Staging, prod | Scoped bucket IAM preferred over static keys |
| **API keys** (AI, Sentry, etc.) | As enabled | Empty disables optional features |
| **Deploy SSH / OIDC** | Actions → env | GitHub Environment secrets |
| **GHCR pull token** | Servers | Read-only package scope |
| **Backup encryption key** | Prod | Separate from app JWT |

### 12.2 GitHub Secrets Layout

| Location | Examples |
|----------|----------|
| **Repository secrets** | `GHCR` already via `GITHUB_TOKEN`; non-prod shared tooling |
| **Environment `staging`** | `STAGING_SSH_KEY`, `STAGING_HOST`, refs to staging SM |
| **Environment `production`** | `PROD_SSH_KEY` / OIDC role, `PROD_HOST` |
| **Dependabot secrets** | Only if private registries required |

### 12.3 Runtime Injection

| Env | Mechanism |
|-----|-----------|
| Local | `.env` gitignored (Phase 14) |
| CI | GitHub Actions secrets; ephemeral test JWT |
| Staging/Prod | Secrets Manager → file or env at deploy time; Compose `env_file` outside repo |

### 12.4 Rules

- PR workflows never receive production secrets.  
- Fork PRs never receive any deploy secrets.  
- Rotation runbook exists for JWT, DB, SMTP.  
- Secret scanning enabled on push/PR (GitHub Advanced Security or equivalent).  

---

## 13. Security Best Practices

| Control | Practice |
|---------|----------|
| **Image scanning** | Trivy/Grype on every image push; block CRITICAL |
| **Dependency scanning** | `pip-audit`, npm audit, Dependabot; CI gate per policy |
| **Secret scanning** | GitHub secret scanning + push protection; pre-commit detect-secrets optional |
| **Branch protection** | `main`: require PR, required checks, CODEOWNERS, no force-push, linear history optional |
| **Signed commits** | Recommend verified commits for maintainers; required later if compliance demands |
| **Least privilege** | Separate staging/prod identities; deploy user cannot SSH as root; DB role no DDL except via migrate job role if split |
| **Workflow hardening** | Pin Actions by SHA; `permissions:` least privilege; no `pull_request_target` with secrets |
| **Supply chain** | Lockfiles; cosign optional; ignore untrusted fork workflows writing packages |
| **Host hardening** | UFW allow 22/80/443 only; fail2ban optional; automatic security updates |
| **Audit** | Retain Actions logs; app `audit_log` unaffected by deploys |

Align perimeter controls with Phase 10 (AuthN/AuthZ) and Phase 14 §13.

---

## 14. Disaster Recovery

### 14.1 Recovery Objectives (Initial)

| Objective | Target |
|-----------|--------|
| **RPO** | ≤ 24h (improve with managed PITR → ≤ 5–15 min) |
| **RTO** | ≤ 4–8h single-region host loss |
| **Backup validation** | Quarterly restore to staging |

### 14.2 Scenarios

| Scenario | Response |
|----------|----------|
| **Database restore** | Provision/restore Postgres from snapshot or `pg_dump`; verify `alembic_version`; start API at matching release; smoke |
| **Media restore** | Replicate from S3 versioning / secondary bucket; repair DB pointers if needed |
| **Bad release rollback** | §9 application rollback; retain backups |
| **Server failure** | Rebuild Ubuntu host from documented bootstrap; pull Compose + digests from GHCR; inject secrets; restore DB if local; point DNS |
| **Ransomware / host compromise** | Isolate; restore DB/media to new host from offline/versioned backups; rotate all secrets |

### 14.3 Backup Validation

1. Restore latest prod backup to isolated staging DB monthly/quarterly.  
2. Run `alembic current` + smoke suite.  
3. Record drill results in `docs/deployment/` runbook log.  
4. Fix gaps (missing WAL, wrong retention, unencrypted dumps).

### 14.4 DR & Deploy Freeze

During DR: freeze production deploys via GitHub Environment lock / team agreement; communicate status page if customer-facing.

---

## 15. Documentation Requirements

| Document | Audience | Contents |
|----------|----------|----------|
| **Developer Guide** | Engineers | Branching, PR checks, local `make test`, how CI maps to Phase 13 |
| **Production Guide** | SRE / DevOps | Host bootstrap, Compose layout, secret injection, Nginx, DNS, TLS |
| **Release Checklist** | Release owner | SemVer, staging soak, backup, migrate risk, smoke, notify, soak |
| **Deployment Checklist** | Operator | Pre-flight (disk, backup, digest), execute, verify, post |
| **Incident Response** | On-call | Severity, comms, deploy freeze, rollback vs restore, escalation |
| **Runbooks** | On-call | Rollback, failed migration, Redis down, disk full, cert expiry, GHCR auth failure |

### 15.1 Suggested Paths (Implementation Time)

```
docs/deployment/
├── README.md                 # Index (exists) — link Phase 15
├── developer-guide.md
├── production-guide.md
├── release-checklist.md
├── deployment-checklist.md
├── incident-response.md
└── runbooks/
    ├── rollback.md
    ├── failed-migration.md
    ├── restore-database.md
    └── host-rebuild.md
```

Canonical architecture remains this Phase 15 document; runbooks must not contradict it without an ADR.

### 15.2 Release Checklist (Summary)

1. CI green on release commit  
2. Staging deployed & soaked  
3. Migration risk classified (none / expand / contract)  
4. Production backup completed (if migrate)  
5. Reviewers approved GitHub `production` environment  
6. Deploy + health + smoke  
7. GitHub Release published with notes  
8. Monitor soak window  
9. Close or continue incident if degraded  

---

## 16. Architecture Decision Rationale

| # | Decision | Alternatives | Rationale |
|---|----------|--------------|-----------|
| CICD-001 | GitHub Actions as CI/CD | GitLab CI, CircleCI, Jenkins | Repo already on GitHub; tight PR checks; Environments API |
| CICD-002 | Build once, promote digests | Rebuild per environment | Eliminates “works in staging only” drift |
| CICD-003 | GHCR for images | Docker Hub, ECR-only | Native Actions auth; private packages; simple MVP |
| CICD-004 | Manual gate for production | Fully automatic prod on main | Farm data risk; small team; staging auto is enough |
| CICD-005 | Rolling now; blue-green preferred | Canary/K8s day one | Matches single Ubuntu Compose (Phase 14); upgrade path clear |
| CICD-006 | Migrate oneshot before traffic | Migrate in API lifespan | Avoid multi-replica races (Phase 14 INF-006) |
| CICD-007 | SemVer tags + GitHub Releases | CalVer / SHA-only | Clear hotfixes, notes, rollback targets |
| CICD-008 | Forward-fix DB over blind downgrade | Always `alembic downgrade` | Phase 6; safer for farm ledgers |
| CICD-009 | Dependabot for deps | Renovate only / manual | Native GitHub; PRs still hit full CI |
| CICD-010 | Pin Actions by SHA + least permissions | Floating `@v4` tags only | Supply-chain hardening |
| CICD-011 | Separate GitHub Environments | Repo secrets only | Enforces prod reviewers & secret isolation |
| CICD-012 | Design-only this phase | Ship workflow YAML now | Matches phases 5–14 documentation discipline |

### 16.1 Release Strategy Detail

| Topic | Policy |
|-------|--------|
| **Semantic Versioning** | `MAJOR.MINOR.PATCH` — breaking API/schema contract → MAJOR; features → MINOR; fixes → PATCH |
| **Release tags** | `vX.Y.Z` on git; triggers release + optional prod deploy |
| **Release notes** | Generated from PR labels/conventional commits; include migration risk & rollback notes |
| **Hotfixes** | Branch `hotfix/X.Y.Z` from tag → PR to main → patch tag; expedited soak |
| **Rollback** | Prefer redeploy previous SemVer digest; DB per §7/§9 |
| **LTS** | Not promised initially; document N-1 app compatibility window during expand phases only |

### 16.2 Alignment Map

| Phase | Contribution |
|-------|--------------|
| Phase 6 | Migration ordering, expand/contract, rollback philosophy |
| Phase 10 | Secret classes, JWT rotation constraints |
| Phase 11 | Health endpoints for deploy gates |
| Phase 12 | Worker/Beat single-leader & queue monitoring |
| Phase 13 | Exact CI test/quality/coverage gates |
| Phase 14 | Compose topology, images, backups, host networking |
| Phase 15 | This specification — pipelines, promotion, zero-downtime, DR ops |

### 16.3 Implementation Readiness Checklist

- [ ] Add `.github/workflows/` for CI, security, docker-build, deploy-staging, deploy-production, release  
- [ ] Configure branch protection + CODEOWNERS + Dependabot  
- [ ] Create GitHub Environments `staging` / `production` with reviewers  
- [ ] Implement `scripts/deploy.sh`, `rollback.sh`, `smoke-test.sh`, `backup-db.sh`  
- [ ] Add `deployment/staging` & `deployment/production` Compose overlays  
- [ ] Wire GHCR push on main; digest pin file on servers  
- [ ] Document runbooks under `docs/deployment/`  
- [ ] Rehearse staging deploy + rollback + DB restore drill  
- [ ] Enable secret scanning & image scan gates  

---

**Document Status:** Ready for GitHub Actions & production deploy implementation.  
**Next Phase:** [Phase 16 — Monitoring, Logging & Observability](./16-observability-architecture.md). Implementation scaffold follows after observability architecture.
