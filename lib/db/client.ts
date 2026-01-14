// Load env vars if not in a Next.js runtime (e.g., when running scripts with tsx)
if (typeof process !== 'undefined' && !process.env.NEXT_RUNTIME) {
  try {
    require('dotenv').config()
  } catch {
    // dotenv might not be available in all contexts
  }
}

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const isEdge = process.env.NEXT_RUNTIME === 'edge'

  // Use Accelerate connection when available
  const accelerateUrl = process.env.DATABASE_URL_ACCELERATE

  // In Prisma 7, when using prisma+postgres:// URLs (Prisma Accelerate/Postgres),
  // pass it as accelerateUrl instead of the datasource url
  if (accelerateUrl?.startsWith('prisma+')) {
    return new PrismaClient({
      log: !isEdge && process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      accelerateUrl: accelerateUrl,
    }).$extends(require('@prisma/extension-accelerate').withAccelerate()) as PrismaClient
  }

  // Use pg adapter for direct PostgreSQL connection
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    log: !isEdge && process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    adapter,
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
