# DP00 – Project Foundation

Status: implemented in this repository (see Definition of Done in the root README).

Approved source: SP2036 MVP Developer Package DP00 (document version 1.0, Priority P0).

## Included

- pnpm monorepo: `apps/website`, `apps/admin`, `apps/api`, `packages/*`
- TypeScript strict mode, ESLint, Prettier
- `.env.example` only (no committed secrets)
- PostgreSQL via Docker Compose + Prisma migrate foundation
- Health Check API: `GET /health` and `GET /api/v1/health`
- Startable website and admin shells

## Explicitly out of scope

Authentication, Dashboard, Customers, Products, Bookings, Payments, and all V2 features.
