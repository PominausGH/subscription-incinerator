# 🔥 Subscription Incinerator

A modern subscription tracking application built with Next.js 14, helping users manage and monitor their recurring subscriptions.

## 🎯 MVP Features

- **Subscription Management**: Add, edit, and delete subscription entries with full CRUD operations
- **Cost Tracking**: Monitor subscription costs with categorization and date tracking
- **Email Notifications**: Automated reminder emails 3 days before subscription renewals using BullMQ workers
- **Authentication**: Secure user authentication powered by NextAuth v5
- **Responsive UI**: Modern, mobile-first design with Tailwind CSS
- **Database**: Robust data persistence with Prisma ORM and PostgreSQL

### Email Scanning & Pending Subscriptions

- Connect Gmail to automatically scan for subscription emails
- High-confidence detections (80%+) auto-create subscriptions
- Medium-confidence detections (40-80%) appear as pending subscriptions for manual review
- Approve or dismiss pending subscriptions from the dashboard
- Automatic cleanup of pending items after 30 days
- Background scanning runs every 3 days

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: NextAuth v5
- **Queue System**: BullMQ + Redis
- **Email Service**: Brevo (SMTP)
- **Styling**: Tailwind CSS
- **Development**: Docker Compose for local services

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Setup Instructions

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start Docker services**
   ```bash
   docker-compose up -d
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and fill in:
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `BREVO_SMTP_USER` / `BREVO_SMTP_KEY`: Get from [Brevo](https://www.brevo.com) (SMTP & API settings)
   - Other variables are pre-configured for local development

4. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

5. **Seed the database (optional)**
   ```bash
   npm run db:seed
   ```

6. **Start development servers**
   ```bash
   # Terminal 1: Next.js dev server
   npm run dev

   # Terminal 2: BullMQ worker
   npm run worker

   # Or run both concurrently:
   npm run dev:all
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Available Scripts

### Development
- `npm run dev` - Start Next.js development server
- `npm run worker` - Start BullMQ background worker
- `npm run dev:all` - Run both dev server and worker concurrently
- `npm run build` - Build for production
- `npm start` - Start production server

### Database
- `npm run db:studio` - Open Prisma Studio GUI
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Reset database (destructive)

### Code Quality
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## 📁 Project Structure

```
subscription/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # NextAuth endpoints
│   │   └── subscriptions/ # Subscription CRUD API
│   ├── subscriptions/     # Subscription pages
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── subscriptions/    # Subscription-specific components
├── lib/                   # Utility libraries
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # NextAuth configuration
│   └── queue.ts          # BullMQ setup
├── prisma/               # Prisma schema and migrations
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Migration files
│   └── seed.ts           # Database seeder
├── workers/              # Background job processors
│   └── email-worker.ts   # Email notification worker
├── docker-compose.yml    # Local development services
└── README.md            # This file
```

## 🤝 Contributing

This is an MVP project. Contributions, issues, and feature requests are welcome!

## 📄 License

This project is open source and available under the MIT License.
