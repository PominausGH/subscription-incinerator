# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Subscription Incinerator — a subscription management SaaS built with Next.js 14 (App Router), TypeScript, PostgreSQL, and Redis. Users track recurring subscriptions, get renewal reminders, scan Gmail for subscriptions, import bank statements, and manage costs.

## Commands

All commands run from `/opt/docker/subscription/src/`.

```bash
npm run dev              # Next.js dev server (port 3000)
npm run worker           # BullMQ background worker (tsx watch)
npm run dev:all          # Both dev server + worker concurrently
npm run build            # Production build (standalone output)
npm run lint             # ESLint
npx tsc --noEmit         # Type check
npm test                 # Jest tests
npm test -- --watch      # Jest watch mode
npm test -- path/to/file # Run single test file
```

**Database (Prisma):**
```bash
npx prisma migrate dev      # Create/apply migrations
npx prisma migrate deploy   # Apply migrations (production)
npx prisma studio           # GUI for database browsing
npx prisma generate         # Regenerate client after schema changes
npm run seed:merchants       # Seed merchant alias data
npm run seed:alternatives    # Seed open-source alternatives
```

**Docker (production, from `/opt/docker/subscription/`):**
```bash
docker compose up -d         # Start all services
docker compose down          # Stop all services
docker compose up -d --build # Rebuild and restart
```

## Architecture

### App Router Structure (`app/`)
- `app/api/` — REST API routes (subscriptions CRUD, email scanning, bank import, Stripe webhooks, push notifications, analytics, health check)
- `app/dashboard/` — Main authenticated dashboard
- `app/subscriptions/` — Subscription detail/edit pages
- `app/settings/` — User preferences
- `app/import/` — Bank statement import flow
- `middleware.ts` — Route protection via NextAuth edge runtime

### Core Libraries (`lib/`)
- `auth.ts` / `auth-edge.ts` — NextAuth.js v5 config (JWT strategy, credentials provider). Edge variant uses Prisma Accelerate.
- `db/client.ts` — Prisma client with `@prisma/adapter-pg` for Node runtime
- `queue/client.ts` — BullMQ + ioredis connection setup. Queues: reminders, email-scanning, cleanup-pending
- `queue/jobs.ts` — Job type definitions and scheduling helpers
- `validations/` — Zod schemas for API input validation
- `rate-limit.ts` — Per-IP/user rate limiting
- `crypto.ts` — AES encryption for stored OAuth tokens (ENCRYPTION_SECRET)
- `bank-import/` — CSV parsing, merchant matching, recurring transaction detection
- `stripe.ts` — Stripe customer/subscription management

### Background Workers (`workers/`)
Separate Docker container running BullMQ processors:
- **reminder-sender** — Email/push notifications before billing dates (3h/7h/24h)
- **email-scanner** — Gmail OAuth scanning with Anthropic AI confidence scoring. High confidence (≥80%) auto-creates subscriptions; medium (40-80%) creates pending subscriptions for review
- **cleanup-pending** — Removes unreviewed pending subscriptions after 30 days

### Key Patterns
- **Prisma pg adapter**: Uses `@prisma/adapter-pg` with connection pool, not the default Prisma connection. See `lib/db/client.ts`.
- **Auth sessions**: JWT-based, extended with `userId` and `tier` (free/premium). Check `lib/auth.ts` callbacks.
- **Pending subscriptions**: Two-stage flow — auto-detected subs go to `PendingSubscription` table, users approve/reject from dashboard.
- **Multi-currency**: User-level currency preference, stored on User model. Conversion utilities in `lib/currency/`.

### Database (Prisma schema at `prisma/schema.prisma`)
Key models: User, Subscription, PendingSubscription, Category, Reminder, PushSubscription, BankImport, MerchantAlias, OpenSourceAlternative, ServiceConfig, CancellationAttempt.

### External Services
- **Resend** — Transactional email (reminders, notifications)
- **Stripe** — Premium tier payments + webhooks
- **Google APIs** — Gmail OAuth for email scanning
- **Anthropic Claude** — AI-powered CSV/email parsing and confidence scoring
- **Web Push** — Browser push notifications (VAPID keys)

## Testing

Jest with jsdom environment. Tests in `__tests__/` mirroring source structure. Setup files: `jest.env.setup.js` (env vars), `jest.setup.js` (mocks). Module alias `@/*` maps to source root.

## Deployment

Docker Compose on VPS. Services: PostgreSQL 16.4, Redis 7.4, Next.js web (port 3007 external), BullMQ worker, migration runner. CI/CD via GitHub Actions: lint → audit → test → build multi-arch Docker images → SSH deploy. Health check: `GET /api/health`.

## Environment

Copy `.env.example` to `.env`. Required: `POSTGRES_*`, `REDIS_PASSWORD`, `NEXTAUTH_SECRET`, `ENCRYPTION_SECRET`. Optional per feature: `RESEND_API_KEY`, `GOOGLE_CLIENT_*`, `STRIPE_*`, `ANTHROPIC_API_KEY`, `VAPID_*` keys. Changes to `.env` require `docker compose up -d` to take effect.
