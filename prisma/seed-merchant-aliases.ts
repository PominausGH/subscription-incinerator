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

const MERCHANT_ALIASES = [
  { bankPattern: 'NETFLIX*', serviceName: 'Netflix' },
  { bankPattern: 'SPOTIFY*', serviceName: 'Spotify' },
  { bankPattern: 'AMAZON PRIME*', serviceName: 'Amazon Prime' },
  { bankPattern: 'AMZN PRIME*', serviceName: 'Amazon Prime' },
  { bankPattern: 'PRIME VIDEO*', serviceName: 'Amazon Prime Video' },
  { bankPattern: 'APPLE.COM/BILL*', serviceName: 'Apple Services' },
  { bankPattern: 'HULU*', serviceName: 'Hulu' },
  { bankPattern: 'HBO MAX*', serviceName: 'HBO Max' },
  { bankPattern: 'MAX.COM*', serviceName: 'Max' },
  { bankPattern: 'DISNEY PLUS*', serviceName: 'Disney+' },
  { bankPattern: 'DISNEYPLUS*', serviceName: 'Disney+' },
  { bankPattern: 'DROPBOX*', serviceName: 'Dropbox' },
  { bankPattern: 'GITHUB*', serviceName: 'GitHub' },
  { bankPattern: 'GOOGLE *STORAGE*', serviceName: 'Google One' },
  { bankPattern: 'GOOGLE*YOUTUBE*', serviceName: 'YouTube Premium' },
  { bankPattern: 'YOUTUBE PREMIUM*', serviceName: 'YouTube Premium' },
  { bankPattern: 'MICROSOFT*XBOX*', serviceName: 'Xbox Game Pass' },
  { bankPattern: 'XBOX*', serviceName: 'Xbox Game Pass' },
  { bankPattern: 'PLAYSTATION*', serviceName: 'PlayStation Plus' },
  { bankPattern: 'SONY PLAYSTATION*', serviceName: 'PlayStation Plus' },
  { bankPattern: 'ADOBE*', serviceName: 'Adobe Creative Cloud' },
  { bankPattern: 'CHATGPT*', serviceName: 'ChatGPT Plus' },
  { bankPattern: 'OPENAI*', serviceName: 'OpenAI' },
  { bankPattern: 'NOTION*', serviceName: 'Notion' },
  { bankPattern: 'SLACK*', serviceName: 'Slack' },
  { bankPattern: 'ZOOM.US*', serviceName: 'Zoom' },
  { bankPattern: 'LINKEDIN*PREMIUM*', serviceName: 'LinkedIn Premium' },
  { bankPattern: 'AUDIBLE*', serviceName: 'Audible' },
  { bankPattern: 'KINDLE*', serviceName: 'Kindle Unlimited' },
  { bankPattern: 'PARAMOUNT+*', serviceName: 'Paramount+' },
  { bankPattern: 'PARAMOUNTPLUS*', serviceName: 'Paramount+' },
  { bankPattern: 'PEACOCK*', serviceName: 'Peacock' },
  { bankPattern: 'CRUNCHYROLL*', serviceName: 'Crunchyroll' },
  { bankPattern: 'NORDVPN*', serviceName: 'NordVPN' },
  { bankPattern: 'EXPRESSVPN*', serviceName: 'ExpressVPN' },
  { bankPattern: 'SURFSHARK*', serviceName: 'Surfshark' },
  { bankPattern: '1PASSWORD*', serviceName: '1Password' },
  { bankPattern: 'LASTPASS*', serviceName: 'LastPass' },
  { bankPattern: 'BITWARDEN*', serviceName: 'Bitwarden' },
  { bankPattern: 'GRAMMARLY*', serviceName: 'Grammarly' },
  { bankPattern: 'CANVA*', serviceName: 'Canva' },
  { bankPattern: 'FIGMA*', serviceName: 'Figma' },
  { bankPattern: 'MAILCHIMP*', serviceName: 'Mailchimp' },
  { bankPattern: 'EVERNOTE*', serviceName: 'Evernote' },
  { bankPattern: 'TODOIST*', serviceName: 'Todoist' },
  { bankPattern: 'HEADSPACE*', serviceName: 'Headspace' },
  { bankPattern: 'CALM.COM*', serviceName: 'Calm' },
  { bankPattern: 'DUOLINGO*', serviceName: 'Duolingo' },
  { bankPattern: 'MASTERCLASS*', serviceName: 'MasterClass' },
  { bankPattern: 'SKILLSHARE*', serviceName: 'Skillshare' },
]

async function main() {
  console.log('Seeding merchant aliases...')

  for (const alias of MERCHANT_ALIASES) {
    await db.merchantAlias.upsert({
      where: { bankPattern: alias.bankPattern },
      update: { serviceName: alias.serviceName },
      create: alias,
    })
  }

  console.log(`Seeded ${MERCHANT_ALIASES.length} merchant aliases`)
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
