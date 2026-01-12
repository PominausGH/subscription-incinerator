// Load environment variables and modify for seeding BEFORE any Prisma imports
import { config } from 'dotenv'
config()

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

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

const PRESET_CATEGORIES = [
  'Entertainment',
  'Software',
  'Utilities',
  'Health & Fitness',
  'Finance',
  'Education',
  'Food & Delivery',
  'Other',
]

async function seedCategories() {
  console.log('Seeding preset categories...')

  for (const name of PRESET_CATEGORIES) {
    // Check if preset category already exists (userId is null for presets)
    const existing = await db.category.findFirst({
      where: {
        name,
        userId: null,
        isPreset: true,
      },
    })

    if (!existing) {
      await db.category.create({
        data: {
          name,
          isPreset: true,
          userId: null,
        },
      })
      console.log(`Created preset category: ${name}`)
    } else {
      console.log(`Preset category already exists: ${name}`)
    }
  }

  console.log('Preset categories seeded successfully')
}

seedCategories()
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
