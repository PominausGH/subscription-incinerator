// Load env vars if not in a Next.js runtime (e.g., when running scripts with tsx)
if (typeof process !== 'undefined' && !process.env.NEXT_RUNTIME) {
  try {
    require('dotenv').config()
  } catch {
    // dotenv might not be available in all contexts
  }
}

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL

  // In Prisma 7, when using prisma+postgres:// URLs (Prisma Accelerate/Postgres),
  // pass it as accelerateUrl instead of the datasource url
  if (dbUrl?.startsWith('prisma+')) {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      accelerateUrl: dbUrl,
    })
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
