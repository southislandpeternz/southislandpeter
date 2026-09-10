# SP2036 MVP

AI Smart Tourism Operating System for a New Zealand South Island boutique tour company.

This repository currently contains **DP00 – Project Foundation** only. Authentication, Dashboard, and business modules are not implemented yet.

## Stack

| Layer           | Technology                        |
| --------------- | --------------------------------- |
| Website / Admin | Next.js + TypeScript              |
| API             | NestJS                            |
| Database        | PostgreSQL + Prisma               |
| Tooling         | pnpm workspaces, ESLint, Prettier |

## Prerequisites

- Node.js 22+
- pnpm 9 (`corepack enable`)
- Docker (for PostgreSQL)

## Setup

```bash
pnpm install
cp .env.example .env   # local only — never commit .env
pnpm db:up
pnpm db:generate
pnpm db:migrate:deploy
```

## Run

```bash
pnpm dev:api       # http://localhost:3001/health
pnpm dev:website   # http://localhost:3000
pnpm dev:admin     # http://localhost:3002
```

Health Check:

- `GET /health`
- `GET /api/v1/health`

Successful envelope:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "sp2036-api",
    "database": "connected"
  }
}
```

## Git

Simplified Git Flow: `main` (production), `develop` (daily), `feature/*`. Do not commit directly to `main`.

## Next package

DP01 – Authentication (not in this drop).
