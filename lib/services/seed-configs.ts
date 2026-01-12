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

const serviceConfigs = [
  {
    serviceName: 'Netflix',
    cancellationUrl: 'https://www.netflix.com/cancelplan',
    supportUrl: 'https://help.netflix.com/contactus',
    logoUrl: 'https://logo.clearbit.com/netflix.com',
    cancellationInstructions: [
      'Go to netflix.com and sign in',
      'Click on your profile icon in the top right',
      'Select "Account" from the dropdown menu',
      'Under "Membership & Billing", click "Cancel Membership"',
      'Confirm cancellation on the next page',
      'You will receive a confirmation email'
    ]
  },
  {
    serviceName: 'Spotify',
    cancellationUrl: 'https://www.spotify.com/account/subscription/',
    supportUrl: 'https://support.spotify.com/contact-spotify-support/',
    logoUrl: 'https://logo.clearbit.com/spotify.com',
    cancellationInstructions: [
      'Log in to spotify.com/account',
      'Click on "Manage Plan" or "Change Plan"',
      'Scroll down and click "Cancel Premium"',
      'Follow the on-screen instructions',
      'Confirm your cancellation',
      'Your premium features will remain active until the end of the billing period'
    ]
  },
  {
    serviceName: 'Disney+',
    cancellationUrl: 'https://www.disneyplus.com/account',
    supportUrl: 'https://help.disneyplus.com/csp',
    logoUrl: 'https://logo.clearbit.com/disneyplus.com',
    cancellationInstructions: [
      'Go to disneyplus.com and log in',
      'Click on your profile in the top right',
      'Select "Account"',
      'Under "Subscription", click "Cancel Subscription"',
      'Select a reason for cancellation',
      'Click "Complete Cancellation"',
      'You will retain access until the end of your billing period'
    ]
  },
  {
    serviceName: 'HBO Max',
    cancellationUrl: 'https://www.max.com/account',
    supportUrl: 'https://help.max.com/contact',
    logoUrl: 'https://logo.clearbit.com/max.com',
    cancellationInstructions: [
      'Visit max.com and sign in',
      'Click on your profile icon',
      'Select "Settings"',
      'Go to "Subscription" section',
      'Click "Manage Subscription"',
      'Select "Cancel Subscription"',
      'Confirm cancellation'
    ]
  },
  {
    serviceName: 'Amazon Prime',
    cancellationUrl: 'https://www.amazon.com/mc/manageyourmembership',
    supportUrl: 'https://www.amazon.com/gp/help/customer/contact-us',
    logoUrl: 'https://logo.clearbit.com/amazon.com',
    cancellationInstructions: [
      'Go to amazon.com/prime and sign in',
      'Click on "Account & Lists" in the top right',
      'Select "Prime Membership"',
      'Click "Update, cancel and more"',
      'Select "End Membership"',
      'Follow the prompts to confirm cancellation',
      'You may be offered a refund if you have not used any Prime benefits'
    ]
  }
]

export async function seedServiceConfigs() {
  console.log('Starting service config seeding...')

  for (const config of serviceConfigs) {
    await db.serviceConfig.upsert({
      where: { serviceName: config.serviceName },
      update: config,
      create: config
    })
    console.log(`Upserted config for ${config.serviceName}`)
  }

  console.log(`Seeded ${serviceConfigs.length} service configs`)
}

// Allow running directly via tsx
if (require.main === module) {
  seedServiceConfigs()
    .then(async () => {
      console.log('Seeding complete')
      await db.$disconnect()
      await pool.end()
      process.exit(0)
    })
    .catch(async (error) => {
      console.error('Seeding failed:', error)
      await db.$disconnect()
      await pool.end()
      process.exit(1)
    })
}
