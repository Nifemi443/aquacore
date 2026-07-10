# PondDesk

**The operating system for modern fish farms.**

PondDesk is a commercial fish farm management SaaS for freshwater/brackish aquaculture. Manage ponds, fish batches, daily feeding, feed inventory, water quality, mortality, harvest planning, vendor deliveries, reports, and AI-powered farm insights from one dashboard.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

| Layer | Technology | Status |
|-------|------------|--------|
| Frontend | Next.js 14, TypeScript, Tailwind | MVP UI complete |
| Backend | FastAPI, Python 3.13+ | Architecture complete |
| Database | PostgreSQL 15+, SQLAlchemy 2.0 | Architecture complete |

## Documentation

See [`docs/README.md`](docs/README.md) for the full architecture documentation (Phases 1–4).

AI assistants: start with [`CLAUDE.md`](CLAUDE.md).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
