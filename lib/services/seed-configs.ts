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
  },
  {
    serviceName: 'LinkedIn Premium',
    cancellationUrl: 'https://www.linkedin.com/premium/products/',
    supportUrl: 'https://www.linkedin.com/help/linkedin',
    logoUrl: 'https://logo.clearbit.com/linkedin.com',
    cancellationInstructions: [
      'Log in to linkedin.com and click your profile photo in the top right',
      'Select "Access My Premium" (or go to linkedin.com/premium/products)',
      'Click "Manage subscription"',
      'Select "Cancel subscription" and choose a reason when prompted',
      'Confirm the cancellation',
      'You will keep Premium features until the end of the current billing period'
    ]
  },
  {
    serviceName: 'Semrush',
    cancellationUrl: 'https://www.semrush.com/subscription-info/',
    supportUrl: 'https://www.semrush.com/company/contacts/',
    logoUrl: 'https://logo.clearbit.com/semrush.com',
    cancellationInstructions: [
      'Log in to semrush.com and go to Subscription info (semrush.com/subscription-info)',
      'Click "Cancel subscription" next to your plan',
      'Select a reason for cancelling when prompted',
      'Review any retention offers, then confirm you want to proceed',
      'You will receive an email confirming the subscription has been cancelled',
      'If no self-serve option appears for your plan, contact Semrush support to request cancellation'
    ]
  },
  {
    serviceName: 'GoDaddy',
    cancellationUrl: 'https://account.godaddy.com/products',
    supportUrl: 'https://www.godaddy.com/help',
    logoUrl: 'https://logo.clearbit.com/godaddy.com',
    cancellationInstructions: [
      'Log in to godaddy.com and go to Account Settings > My Products',
      'Find the product or subscription you want to cancel',
      'Click "Manage" (or the three-dot menu) next to it and select "Cancel"',
      'Choose whether to cancel immediately or let it run until expiration, then confirm',
      'Check your email for a cancellation confirmation',
      'Domains and hosting cancelled within the refund window may qualify for a partial refund — check the specific product\'s refund policy'
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
