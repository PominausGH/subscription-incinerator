// Load environment variables and modify for seeding BEFORE any Prisma imports
import { config } from 'dotenv'
config()

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { toAlternativeRows } from '../lib/open-source/db-rows'

// For seeding, extract TCP URL from Prisma Accelerate URL
// This avoids compatibility issues with Prisma Client 7.2.0 and `prisma dev` HTTP connections
let connectionString = process.env.DATABASE_URL

if (connectionString?.startsWith('prisma+postgres://')) {
  const match = connectionString.match(/api_key=([^&]+)/)
  if (match) {
    try {
      const apiKey = match[1]
      const decoded = JSON.parse(Buffer.from(apiKey, 'base64').toString())
      connectionString = decoded.databaseUrl
      console.log('Using TCP connection for seeding')
    } catch (e) {
      console.error('Failed to extract TCP URL from api_key:', e)
    }
  }
}

// Create connection pool and adapter for direct TCP connection
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

// Create a fresh client with the adapter
const db = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
})

// Rows come from lib/open-source/alternatives.ts (the same data the public /open-source
// page renders), so the dashboard list can't drift from it again.
const ALTERNATIVES = toAlternativeRows()

const pairKey = (serviceName: string, alternativeName: string) => `${serviceName}\u0000${alternativeName}`

async function main() {
  for (const alt of ALTERNATIVES) {
    await db.openSourceAlternative.upsert({
      where: {
        serviceName_alternativeName: {
          serviceName: alt.serviceName,
          alternativeName: alt.alternativeName,
        },
      },
      update: {
        description: alt.description,
        websiteUrl: alt.websiteUrl,
        sourceCodeUrl: alt.sourceCodeUrl,
        stars: alt.stars,
        license: alt.license,
        category: alt.category,
      },
      create: alt,
    })
  }

  console.log(`Seeded ${ALTERNATIVES.length} open-source alternatives`)

  // Upserting never removes rows, so entries dropped from the list (or renamed, e.g.
  // "Duolingo" -> "Duolingo Plus") would linger. Report them; delete only when asked.
  const keep = new Set(ALTERNATIVES.map(a => pairKey(a.serviceName, a.alternativeName)))
  const existing = await db.openSourceAlternative.findMany({
    select: { id: true, serviceName: true, alternativeName: true },
  })
  const stale = existing.filter(r => !keep.has(pairKey(r.serviceName, r.alternativeName)))

  if (stale.length === 0) return

  if (process.argv.includes('--prune')) {
    await db.openSourceAlternative.deleteMany({ where: { id: { in: stale.map(r => r.id) } } })
    console.log(`Pruned ${stale.length} stale rows`)
  } else {
    console.log(
      `${stale.length} stale rows are no longer in the list (re-run with --prune to delete them): ` +
        stale.map(r => `${r.serviceName} -> ${r.alternativeName}`).join(', ')
    )
  }
}

main()
  .then(async () => {
    await db.$disconnect()
    await pool.end()
    process.exit(0)
  })
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    await pool.end()
    process.exit(1)
  })
