# Subscription Incinerator

Next.js application for subscription management.

## Tech Stack
- Framework: Next.js 14
- Language: TypeScript
- Database: PostgreSQL with Prisma ORM
- Auth: NextAuth.js v5
- Queue: BullMQ with Redis
- Email: Resend
- Payments: Stripe
- APIs: Google APIs

## Commands
- `npm run dev` - Start Next.js dev server
- `npm run worker` - Start background worker
- `npm run dev:all` - Run both dev server and worker
- `npm run build` - Production build
- `npm run test` - Run Jest tests
- `npm run test:watch` - Watch mode tests
- `npm run lint` - ESLint

## Structure
- `app/` - Next.js App Router pages
- `components/` - React components
- `workers/` - BullMQ background workers
- `docs/` - Documentation

## Environment
- Copy `.env.example` to `.env.local`
- Requires PostgreSQL, Redis
- Configure OAuth, Stripe, Resend keys

## Testing
- Jest for unit tests
- Config in `jest.config.js`

## Superpowers
Use these skills when working on this project:
- `/brainstorming` - Before creating new features or integrations
- `/writing-plans` - For multi-step implementations
- `/test-driven-development` - Write Jest tests first
- `/systematic-debugging` - When fixing Next.js/Prisma/BullMQ issues
- `/requesting-code-review` - After completing features
- `/verification-before-completion` - Run tests and build before done
- `/finishing-a-development-branch` - When ready to merge
