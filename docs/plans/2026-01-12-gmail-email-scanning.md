# Gmail Email Scanning Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable automatic subscription detection by scanning Gmail for subscription emails with manual and automatic (every 3 days) scanning.

**Architecture:** OAuth flow to get Gmail readonly access, pattern-based email detection stored as subscriptions, BullMQ jobs for scanning (manual trigger + recurring 3-day schedule).

**Tech Stack:** Google APIs Node.js Client, BullMQ, Next.js API routes, Prisma

---

## Task 1: Install Dependencies and Add Environment Variables

**Files:**
- Modify: `package.json`
- Modify: `.env.local`

**Step 1: Install googleapis package**

Run:
```bash
npm install googleapis@latest
npm install --save-dev @types/node
```

Expected: googleapis installed successfully

**Step 2: Add Gmail OAuth credentials to environment variables**

Add to `.env.local`:
```bash
# Gmail OAuth
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/oauth/gmail/callback"
```

Expected: Environment variables added

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add googleapis dependency for Gmail scanning"
```

---

## Task 2: Create Gmail API Client Utility

**Files:**
- Create: `lib/email/gmail-client.ts`

**Step 1: Create Gmail client utility file**

Create `lib/email/gmail-client.ts`:
```typescript
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

export interface GmailMessage {
  id: string
  threadId: string
  from: string
  subject: string
  body: string
  date: Date
  snippet: string
}

export function createGmailClient(accessToken: string, refreshToken: string): OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  return oauth2Client
}

export async function fetchGmailMessages(
  oauth2Client: OAuth2Client,
  options: {
    maxResults?: number
    afterDate?: Date
    query?: string
  } = {}
): Promise<GmailMessage[]> {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  // Build query
  let query = options.query || 'subscription OR trial OR "free trial" OR "billing" OR "payment"'

  if (options.afterDate) {
    const dateStr = Math.floor(options.afterDate.getTime() / 1000)
    query += ` after:${dateStr}`
  }

  // List messages
  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: options.maxResults || 50,
  })

  if (!listResponse.data.messages) {
    return []
  }

  // Fetch full message details
  const messages: GmailMessage[] = []

  for (const message of listResponse.data.messages) {
    if (!message.id) continue

    const msgResponse = await gmail.users.messages.get({
      userId: 'me',
      id: message.id,
      format: 'full',
    })

    const msg = msgResponse.data
    const headers = msg.payload?.headers || []

    const from = headers.find((h) => h.name === 'From')?.value || ''
    const subject = headers.find((h) => h.name === 'Subject')?.value || ''
    const dateStr = headers.find((h) => h.name === 'Date')?.value || ''

    // Get body
    let body = ''
    if (msg.payload?.body?.data) {
      body = Buffer.from(msg.payload.body.data, 'base64').toString('utf-8')
    } else if (msg.payload?.parts) {
      const textPart = msg.payload.parts.find((part) => part.mimeType === 'text/plain')
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8')
      }
    }

    messages.push({
      id: msg.id || '',
      threadId: msg.threadId || '',
      from,
      subject,
      body,
      date: dateStr ? new Date(dateStr) : new Date(),
      snippet: msg.snippet || '',
    })
  }

  return messages
}

export async function refreshGmailToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  })

  const { credentials } = await oauth2Client.refreshAccessToken()

  return {
    accessToken: credentials.access_token || '',
    refreshToken: credentials.refresh_token || refreshToken,
  }
}
```

Expected: File created

**Step 2: Commit**

```bash
git add lib/email/gmail-client.ts
git commit -m "feat: add Gmail API client utility"
```

---

## Task 3: Create Email Detection Patterns

**Files:**
- Create: `lib/email/patterns.ts`

**Step 1: Create detection patterns file**

Create `lib/email/patterns.ts`:
```typescript
export interface DetectionRule {
  service: string
  senderDomains: string[]
  subjectPatterns: RegExp[]
  bodyKeywords: string[]
  trialIndicators: string[]
  priceExtractor: RegExp
  dateExtractor: RegExp
  currencyExtractor?: RegExp
}

export const DETECTION_RULES: DetectionRule[] = [
  {
    service: 'Netflix',
    senderDomains: ['netflix.com', 'email.netflix.com'],
    subjectPatterns: [/netflix.*membership/i, /welcome to netflix/i, /your netflix/i],
    bodyKeywords: ['monthly charge', 'subscription', 'membership'],
    trialIndicators: ['free trial', 'trial period'],
    priceExtractor: /\$(\d+\.?\d{0,2})\s*(?:\/month|per month|monthly)/i,
    dateExtractor: /(?:on|starting)\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
    currencyExtractor: /(\$|USD|€|EUR|£|GBP)/i,
  },
  {
    service: 'Spotify',
    senderDomains: ['spotify.com', 'email.spotify.com'],
    subjectPatterns: [/spotify.*premium/i, /welcome to spotify/i],
    bodyKeywords: ['premium', 'subscription', 'billing'],
    trialIndicators: ['free trial', 'trial period', 'free for'],
    priceExtractor: /\$(\d+\.?\d{0,2})\s*(?:\/month|per month|monthly)/i,
    dateExtractor: /(?:on|starting)\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
    currencyExtractor: /(\$|USD|€|EUR|£|GBP)/i,
  },
  {
    service: 'Disney+',
    senderDomains: ['disneyplus.com', 'email.disneyplus.com'],
    subjectPatterns: [/disney.*subscription/i, /welcome to disney/i],
    bodyKeywords: ['subscription', 'billing', 'membership'],
    trialIndicators: ['free trial', 'trial period'],
    priceExtractor: /\$(\d+\.?\d{0,2})\s*(?:\/month|per month|monthly)/i,
    dateExtractor: /(?:on|starting)\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
    currencyExtractor: /(\$|USD|€|EUR|£|GBP)/i,
  },
  {
    service: 'Amazon Prime',
    senderDomains: ['amazon.com', 'email.amazon.com'],
    subjectPatterns: [/prime.*membership/i, /amazon prime/i],
    bodyKeywords: ['prime', 'membership', 'subscription'],
    trialIndicators: ['free trial', 'trial period'],
    priceExtractor: /\$(\d+\.?\d{0,2})\s*(?:\/month|per month|monthly|\/year|per year)/i,
    dateExtractor: /(?:on|starting)\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
    currencyExtractor: /(\$|USD|€|EUR|£|GBP)/i,
  },
  {
    service: 'YouTube Premium',
    senderDomains: ['youtube.com', 'email.youtube.com', 'google.com'],
    subjectPatterns: [/youtube.*premium/i, /youtube.*subscription/i],
    bodyKeywords: ['premium', 'subscription', 'membership'],
    trialIndicators: ['free trial', 'trial period'],
    priceExtractor: /\$(\d+\.?\d{0,2})\s*(?:\/month|per month|monthly)/i,
    dateExtractor: /(?:on|starting)\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
    currencyExtractor: /(\$|USD|€|EUR|£|GBP)/i,
  },
  // Generic pattern for unknown services
  {
    service: 'Unknown',
    senderDomains: [],
    subjectPatterns: [/subscription/i, /trial/i, /billing/i],
    bodyKeywords: ['subscription', 'trial', 'billing', 'monthly charge'],
    trialIndicators: ['free trial', 'trial period', 'trial ends'],
    priceExtractor: /\$(\d+\.?\d{0,2})\s*(?:\/month|per month|monthly)/i,
    dateExtractor: /(?:on|starting|ends)\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
    currencyExtractor: /(\$|USD|€|EUR|£|GBP)/i,
  },
]

export function getCurrencyCode(currencySymbol: string): string {
  const currencyMap: Record<string, string> = {
    '$': 'USD',
    'USD': 'USD',
    '€': 'EUR',
    'EUR': 'EUR',
    '£': 'GBP',
    'GBP': 'GBP',
  }
  return currencyMap[currencySymbol] || 'USD'
}
```

Expected: File created

**Step 2: Commit**

```bash
git add lib/email/patterns.ts
git commit -m "feat: add email detection patterns for subscriptions"
```

---

## Task 4: Create Email Scanner Logic

**Files:**
- Create: `lib/email/scanner.ts`

**Step 1: Create email scanner file**

Create `lib/email/scanner.ts`:
```typescript
import { GmailMessage } from './gmail-client'
import { DETECTION_RULES, getCurrencyCode } from './patterns'

export interface DetectionResult {
  service: string
  confidence: number
  isTrial: boolean
  amount: number | null
  currency: string
  trialEndsAt: Date | null
  nextBillingDate: Date | null
  rawData: {
    emailId: string
    subject: string
    from: string
    date: Date
  }
}

export function detectSubscription(message: GmailMessage): DetectionResult | null {
  let bestMatch: DetectionResult | null = null
  let highestConfidence = 0

  for (const rule of DETECTION_RULES) {
    const result = matchRule(message, rule)

    if (result && result.confidence > highestConfidence) {
      highestConfidence = result.confidence
      bestMatch = result
    }
  }

  // Only return if confidence is above threshold
  if (bestMatch && bestMatch.confidence > 0.4) {
    return bestMatch
  }

  return null
}

function matchRule(message: GmailMessage, rule: typeof DETECTION_RULES[0]): DetectionResult | null {
  let confidence = 0
  let matchCount = 0
  const maxMatches = 5

  // Check sender domain
  if (rule.senderDomains.length > 0) {
    const fromDomain = message.from.split('@')[1]?.toLowerCase() || ''
    if (rule.senderDomains.some(domain => fromDomain.includes(domain))) {
      confidence += 0.3
      matchCount++
    }
  }

  // Check subject patterns
  if (rule.subjectPatterns.some(pattern => pattern.test(message.subject))) {
    confidence += 0.25
    matchCount++
  }

  // Check body keywords
  const bodyLower = message.body.toLowerCase()
  const keywordMatches = rule.bodyKeywords.filter(keyword =>
    bodyLower.includes(keyword.toLowerCase())
  ).length

  if (keywordMatches > 0) {
    confidence += Math.min(0.2, keywordMatches * 0.1)
    matchCount++
  }

  // Must have at least 2 matches to be considered
  if (matchCount < 2) {
    return null
  }

  // Check for trial indicators
  const isTrial = rule.trialIndicators.some(indicator =>
    bodyLower.includes(indicator.toLowerCase())
  )

  // Extract price
  let amount: number | null = null
  const priceMatch = message.body.match(rule.priceExtractor)
  if (priceMatch && priceMatch[1]) {
    amount = parseFloat(priceMatch[1])
  }

  // Extract currency
  let currency = 'USD'
  if (rule.currencyExtractor) {
    const currencyMatch = message.body.match(rule.currencyExtractor)
    if (currencyMatch && currencyMatch[1]) {
      currency = getCurrencyCode(currencyMatch[1])
    }
  }

  // Extract dates
  let trialEndsAt: Date | null = null
  let nextBillingDate: Date | null = null

  const dateMatch = message.body.match(rule.dateExtractor)
  if (dateMatch && dateMatch[1]) {
    const extractedDate = new Date(dateMatch[1])
    if (!isNaN(extractedDate.getTime())) {
      if (isTrial) {
        trialEndsAt = extractedDate
      } else {
        nextBillingDate = extractedDate
      }
    }
  }

  // Normalize confidence (0-1 range)
  confidence = Math.min(1, confidence)

  return {
    service: rule.service,
    confidence,
    isTrial,
    amount,
    currency,
    trialEndsAt,
    nextBillingDate,
    rawData: {
      emailId: message.id,
      subject: message.subject,
      from: message.from,
      date: message.date,
    },
  }
}

export function deduplicateDetections(detections: DetectionResult[]): DetectionResult[] {
  const seen = new Set<string>()
  const unique: DetectionResult[] = []

  for (const detection of detections) {
    const key = `${detection.service}-${detection.amount}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(detection)
    }
  }

  return unique
}
```

Expected: File created

**Step 2: Commit**

```bash
git add lib/email/scanner.ts
git commit -m "feat: add email scanner with pattern matching"
```

---

## Task 5: Create Gmail OAuth Routes

**Files:**
- Create: `app/api/oauth/gmail/route.ts`
- Create: `app/api/oauth/gmail/callback/route.ts`

**Step 1: Create Gmail OAuth initiation route**

Create `app/api/oauth/gmail/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { google } from 'googleapis'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      state: session.user.id,
      prompt: 'consent', // Force consent to get refresh token
    })

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Gmail OAuth error:', error)
    return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 })
  }
}
```

Expected: File created

**Step 2: Create Gmail OAuth callback route**

Create `app/api/oauth/gmail/callback/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { db } from '@/lib/db/client'
import { addScanJob } from '@/lib/queue/scan-queue'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const userId = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent('Gmail connection failed')}`, req.url)
      )
    }

    if (!code || !userId) {
      return NextResponse.json({ error: 'Invalid callback parameters' }, { status: 400 })
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.json({ error: 'Failed to get tokens' }, { status: 500 })
    }

    // Store tokens (encrypted in production)
    await db.user.update({
      where: { id: userId },
      data: {
        oauthTokens: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: tokens.expiry_date,
        },
        emailProvider: 'gmail',
      },
    })

    // Queue initial full scan
    await addScanJob({
      userId,
      fullScan: true,
    })

    return NextResponse.redirect(
      new URL('/dashboard?connected=gmail', req.url)
    )
  } catch (error) {
    console.error('Gmail OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/settings?error=oauth_failed', req.url)
    )
  }
}
```

Expected: File created

**Step 3: Commit**

```bash
git add app/api/oauth/gmail/route.ts app/api/oauth/gmail/callback/route.ts
git commit -m "feat: add Gmail OAuth routes"
```

---

## Task 6: Create Scan Queue Client

**Files:**
- Create: `lib/queue/scan-queue.ts`
- Modify: `lib/queue/jobs.ts`

**Step 1: Add scan job types to jobs file**

Modify `lib/queue/jobs.ts`:
```typescript
// Add to existing file

export interface ScanInboxJob {
  userId: string
  fullScan: boolean // true = scan last 90 days, false = scan last 30 days
}

export enum JobType {
  SEND_REMINDER = 'send_reminder',
  SCAN_INBOX = 'scan_inbox',
  // ... other existing types
}
```

Expected: Types added

**Step 2: Create scan queue client**

Create `lib/queue/scan-queue.ts`:
```typescript
import { Queue } from 'bullmq'
import { connection } from './client'
import { ScanInboxJob } from './jobs'

export const scanQueue = new Queue<ScanInboxJob>('email-scanning', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
})

export async function addScanJob(data: ScanInboxJob) {
  return await scanQueue.add('scan-inbox', data, {
    jobId: `scan-${data.userId}-${Date.now()}`,
  })
}

export async function scheduleRecurringScan(userId: string) {
  // Schedule recurring scan every 3 days
  return await scanQueue.add(
    'scan-inbox',
    { userId, fullScan: false },
    {
      jobId: `recurring-scan-${userId}`,
      repeat: {
        every: 3 * 24 * 60 * 60 * 1000, // 3 days in milliseconds
      },
      removeOnComplete: true,
    }
  )
}

export async function removeRecurringScan(userId: string) {
  const jobId = `recurring-scan-${userId}`
  const job = await scanQueue.getJob(jobId)
  if (job) {
    await job.remove()
  }
}
```

Expected: File created

**Step 3: Commit**

```bash
git add lib/queue/scan-queue.ts lib/queue/jobs.ts
git commit -m "feat: add email scanning queue"
```

---

## Task 7: Create Email Scanner Processor

**Files:**
- Create: `workers/processors/email-scanner.ts`
- Modify: `workers/index.ts`

**Step 1: Create email scanner processor**

Create `workers/processors/email-scanner.ts`:
```typescript
import { Job } from 'bullmq'
import { ScanInboxJob } from '@/lib/queue/jobs'
import { db } from '@/lib/db/client'
import { createGmailClient, fetchGmailMessages } from '@/lib/email/gmail-client'
import { detectSubscription, deduplicateDetections } from '@/lib/email/scanner'
import { scheduleTrialReminders, scheduleBillingReminders } from '@/lib/notifications/schedule-reminders'

export async function processScanJob(job: Job<ScanInboxJob>) {
  const { userId, fullScan } = job.data

  console.log(`Processing scan job for user ${userId}, fullScan: ${fullScan}`)

  try {
    // Get user with OAuth tokens
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user || !user.oauthTokens) {
      throw new Error('User not found or Gmail not connected')
    }

    const tokens = user.oauthTokens as any

    // Create Gmail client
    const oauth2Client = createGmailClient(tokens.accessToken, tokens.refreshToken)

    // Determine date range
    const afterDate = new Date()
    afterDate.setDate(afterDate.getDate() - (fullScan ? 90 : 30))

    // Fetch messages
    const messages = await fetchGmailMessages(oauth2Client, {
      maxResults: fullScan ? 500 : 100,
      afterDate,
    })

    console.log(`Fetched ${messages.length} messages for user ${userId}`)

    // Detect subscriptions
    const detections = messages
      .map(msg => detectSubscription(msg))
      .filter(d => d !== null) as any[]

    console.log(`Found ${detections.length} potential subscriptions`)

    // Deduplicate
    const uniqueDetections = deduplicateDetections(detections)

    // Check for existing subscriptions to avoid duplicates
    const existingSubscriptions = await db.subscription.findMany({
      where: { userId },
      select: { serviceName: true, amount: true },
    })

    const existingKeys = new Set(
      existingSubscriptions.map(s => `${s.serviceName}-${s.amount}`)
    )

    let createdCount = 0
    let pendingCount = 0

    for (const detection of uniqueDetections) {
      const key = `${detection.service}-${detection.amount}`

      // Skip if already exists
      if (existingKeys.has(key)) {
        continue
      }

      // High confidence - auto-create
      if (detection.confidence >= 0.8) {
        const subscription = await db.subscription.create({
          data: {
            userId,
            serviceName: detection.service,
            status: detection.isTrial ? 'trial' : 'active',
            amount: detection.amount,
            currency: detection.currency,
            trialEndsAt: detection.trialEndsAt,
            nextBillingDate: detection.nextBillingDate,
            detectedFrom: 'email_scan',
            rawEmailData: detection.rawData,
          },
        })

        // Schedule reminders
        try {
          if (subscription.trialEndsAt) {
            await scheduleTrialReminders(subscription)
          }
          if (subscription.nextBillingDate) {
            await scheduleBillingReminders(subscription)
          }
        } catch (error) {
          console.error('Failed to schedule reminders:', error)
          // Don't fail the job if reminder scheduling fails
        }

        createdCount++
      } else if (detection.confidence >= 0.4) {
        // Medium confidence - create as pending (could add a PendingSubscription table)
        // For now, just log it
        console.log('Pending subscription detection:', detection.service, detection.confidence)
        pendingCount++
      }
    }

    console.log(`Scan complete for user ${userId}: ${createdCount} created, ${pendingCount} pending`)

    return {
      messagesScanned: messages.length,
      detectionsFound: detections.length,
      subscriptionsCreated: createdCount,
      subscriptionsPending: pendingCount,
    }
  } catch (error) {
    console.error('Scan job error:', error)
    throw error
  }
}
```

Expected: File created

**Step 2: Add scanner worker to workers index**

Modify `workers/index.ts`:
```typescript
import { Worker } from 'bullmq'
import { processReminderJob } from './processors/reminder-sender'
import { processScanJob } from './processors/email-scanner'
import { SendReminderJob, ScanInboxJob } from '@/lib/queue/jobs'
import { connection } from '@/lib/queue/client'

const reminderWorker = new Worker<SendReminderJob>(
  'reminders',
  async (job) => {
    await processReminderJob(job)
  },
  { connection }
)

const scanWorker = new Worker<ScanInboxJob>(
  'email-scanning',
  async (job) => {
    await processScanJob(job)
  },
  { connection }
)

reminderWorker.on('completed', (job) => {
  console.log(`Reminder job ${job.id} completed`)
})

reminderWorker.on('failed', (job, err) => {
  console.error(`Reminder job ${job?.id} failed:`, err)
})

scanWorker.on('completed', (job) => {
  console.log(`Scan job ${job.id} completed`)
})

scanWorker.on('failed', (job, err) => {
  console.error(`Scan job ${job?.id} failed:`, err)
})

console.log('Workers started successfully')

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`${signal} received, closing workers...`)
  await reminderWorker.close()
  await scanWorker.close()
  await connection.quit()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
```

Expected: Scanner worker added

**Step 3: Commit**

```bash
git add workers/processors/email-scanner.ts workers/index.ts
git commit -m "feat: add email scanner worker processor"
```

---

## Task 8: Create Manual Scan API Endpoint

**Files:**
- Create: `app/api/email/scan/route.ts`

**Step 1: Create manual scan endpoint**

Create `app/api/email/scan/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { addScanJob } from '@/lib/queue/scan-queue'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check if user has connected Gmail
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { emailProvider: true, oauthTokens: true },
    })

    if (!user || user.emailProvider !== 'gmail' || !user.oauthTokens) {
      return NextResponse.json(
        { error: 'Gmail not connected. Please connect Gmail first.' },
        { status: 400 }
      )
    }

    // Add scan job
    const job = await addScanJob({
      userId,
      fullScan: true, // Manual scans are full scans
    })

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Scan started. This may take a few minutes.',
    })
  } catch (error) {
    console.error('Manual scan error:', error)
    return NextResponse.json(
      { error: 'Failed to start scan' },
      { status: 500 }
    )
  }
}
```

Expected: File created

**Step 2: Commit**

```bash
git add app/api/email/scan/route.ts
git commit -m "feat: add manual email scan endpoint"
```

---

## Task 9: Create Gmail Disconnect Endpoint

**Files:**
- Create: `app/api/oauth/gmail/disconnect/route.ts`

**Step 1: Create disconnect endpoint**

Create `app/api/oauth/gmail/disconnect/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { removeRecurringScan } from '@/lib/queue/scan-queue'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Remove recurring scan job
    await removeRecurringScan(userId)

    // Clear OAuth tokens
    await db.user.update({
      where: { id: userId },
      data: {
        oauthTokens: null,
        emailProvider: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Gmail disconnect error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Gmail' },
      { status: 500 }
    )
  }
}
```

Expected: File created

**Step 2: Commit**

```bash
git add app/api/oauth/gmail/disconnect/route.ts
git commit -m "feat: add Gmail disconnect endpoint"
```

---

## Task 10: Update OAuth Callback to Schedule Recurring Scans

**Files:**
- Modify: `app/api/oauth/gmail/callback/route.ts`

**Step 1: Add recurring scan scheduling to OAuth callback**

Modify `app/api/oauth/gmail/callback/route.ts`, after the initial scan job:
```typescript
// Add after: await addScanJob({ userId, fullScan: true })

// Schedule recurring scan every 3 days
await scheduleRecurringScan(userId)
```

Import at the top:
```typescript
import { addScanJob, scheduleRecurringScan } from '@/lib/queue/scan-queue'
```

Expected: Recurring scan scheduled on connection

**Step 2: Commit**

```bash
git add app/api/oauth/gmail/callback/route.ts
git commit -m "feat: schedule recurring scans on Gmail connection"
```

---

## Task 11: Create Settings Page with Gmail Connection UI

**Files:**
- Modify: `app/settings/page.tsx` (or create if doesn't exist)

**Step 1: Check if settings page exists**

Run:
```bash
ls -la app/settings/
```

If it doesn't exist, create it. If it does, modify it.

**Step 2: Create/modify settings page**

Create or modify `app/settings/page.tsx`:
```typescript
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { GmailConnectionCard } from '@/components/settings/gmail-connection-card'

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      emailProvider: true,
      oauthTokens: true,
    },
  })

  const isGmailConnected = user?.emailProvider === 'gmail' && user?.oauthTokens !== null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Email Scanning</h2>
          <p className="text-gray-600 mb-6">
            Connect your Gmail to automatically detect subscriptions from your emails.
          </p>

          <GmailConnectionCard
            isConnected={isGmailConnected}
            userEmail={user?.email || ''}
          />
        </section>
      </div>
    </div>
  )
}
```

Expected: Settings page created/updated

**Step 3: Commit**

```bash
git add app/settings/page.tsx
git commit -m "feat: add settings page with Gmail connection"
```

---

## Task 12: Create Gmail Connection Card Component

**Files:**
- Create: `components/settings/gmail-connection-card.tsx`

**Step 1: Create Gmail connection card component**

Create `components/settings/gmail-connection-card.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface GmailConnectionCardProps {
  isConnected: boolean
  userEmail: string
}

export function GmailConnectionCard({ isConnected, userEmail }: GmailConnectionCardProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [scanMessage, setScanMessage] = useState('')

  async function handleConnect() {
    window.location.href = '/api/oauth/gmail'
  }

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect Gmail? Your existing subscriptions will not be deleted.')) {
      return
    }

    setIsDisconnecting(true)
    try {
      const response = await fetch('/api/oauth/gmail/disconnect', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect')
      }

      window.location.reload()
    } catch (error) {
      console.error('Disconnect error:', error)
      alert('Failed to disconnect Gmail. Please try again.')
    } finally {
      setIsDisconnecting(false)
    }
  }

  async function handleScanNow() {
    setIsScanning(true)
    setScanMessage('')

    try {
      const response = await fetch('/api/email/scan', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start scan')
      }

      setScanMessage('Scan started! Your subscriptions will appear in a few minutes.')

      // Refresh after 10 seconds
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 10000)
    } catch (error: any) {
      console.error('Scan error:', error)
      setScanMessage(error.message || 'Failed to start scan')
    } finally {
      setIsScanning(false)
    }
  }

  if (isConnected) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium text-green-900">Gmail Connected</p>
              <p className="text-sm text-green-700">{userEmail}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleScanNow}
            disabled={isScanning}
            variant="default"
            size="sm"
          >
            {isScanning ? 'Scanning...' : 'Scan Now'}
          </Button>

          <Button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            variant="outline"
            size="sm"
          >
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        </div>

        {scanMessage && (
          <p className="mt-3 text-sm text-green-700">{scanMessage}</p>
        )}

        <p className="mt-4 text-sm text-gray-600">
          Automatic scan runs every 3 days to detect new subscriptions.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <p className="text-gray-600 mb-4">
        Gmail is not connected. Connect to automatically detect subscriptions from your emails.
      </p>

      <Button onClick={handleConnect} variant="default">
        Connect Gmail
      </Button>

      <div className="mt-4 space-y-2 text-sm text-gray-500">
        <p>✓ Read-only access</p>
        <p>✓ Scans every 3 days automatically</p>
        <p>✓ Detects trials and billing dates</p>
      </div>
    </div>
  )
}
```

Expected: Component created

**Step 2: Commit**

```bash
git add components/settings/gmail-connection-card.tsx
git commit -m "feat: add Gmail connection card component"
```

---

## Task 13: Add Notification Helper (Missing Import)

**Files:**
- Create: `lib/notifications/schedule-reminders.ts`

**Step 1: Create reminder scheduling helper**

Create `lib/notifications/schedule-reminders.ts`:
```typescript
import { Subscription } from '@prisma/client'
import { reminderQueue } from '@/lib/queue/client'

export async function scheduleTrialReminders(subscription: Subscription) {
  if (!subscription.trialEndsAt) return

  const trialEnd = new Date(subscription.trialEndsAt)
  const now = new Date()

  const reminderTimes = [
    { offset: -24 * 60 * 60 * 1000, type: '24h' }, // 24 hours before
    { offset: -3 * 60 * 60 * 1000, type: '3h' },   // 3 hours before
    { offset: -1 * 60 * 60 * 1000, type: '1h' },   // 1 hour before
  ]

  for (const { offset, type } of reminderTimes) {
    const scheduledFor = new Date(trialEnd.getTime() + offset)

    // Only schedule future reminders
    if (scheduledFor > now) {
      await reminderQueue.add(
        'send_reminder',
        {
          subscriptionId: subscription.id,
          reminderType: 'trial_ending',
        },
        {
          delay: scheduledFor.getTime() - now.getTime(),
          jobId: `reminder-trial-${subscription.id}-${type}`,
        }
      )
    }
  }
}

export async function scheduleBillingReminders(subscription: Subscription) {
  if (!subscription.nextBillingDate) return

  const billingDate = new Date(subscription.nextBillingDate)
  const now = new Date()

  const reminderTimes = [
    { offset: -7 * 24 * 60 * 60 * 1000, type: '7d' }, // 7 days before
    { offset: -24 * 60 * 60 * 1000, type: '24h' },    // 24 hours before
  ]

  for (const { offset, type } of reminderTimes) {
    const scheduledFor = new Date(billingDate.getTime() + offset)

    // Only schedule future reminders
    if (scheduledFor > now) {
      await reminderQueue.add(
        'send_reminder',
        {
          subscriptionId: subscription.id,
          reminderType: 'billing_upcoming',
        },
        {
          delay: scheduledFor.getTime() - now.getTime(),
          jobId: `reminder-billing-${subscription.id}-${type}`,
        }
      )
    }
  }
}
```

Expected: File created

**Step 2: Commit**

```bash
git add lib/notifications/schedule-reminders.ts
git commit -m "feat: add reminder scheduling helper"
```

---

## Task 14: Test Gmail OAuth Flow

**Step 1: Ensure Redis is running**

Run:
```bash
redis-cli ping
```

Expected: PONG (if Redis is running, otherwise start it)

**Step 2: Start worker process**

Run in one terminal:
```bash
npm run worker
```

Expected: "Workers started successfully"

**Step 3: Start Next.js dev server**

Run in another terminal:
```bash
npm run dev
```

Expected: Server running on http://localhost:3000

**Step 4: Test OAuth flow**

1. Navigate to http://localhost:3000/settings
2. Click "Connect Gmail"
3. Authorize with Google (use test account)
4. Should redirect back to dashboard
5. Check worker logs for scan progress

Expected: Gmail connected, initial scan starts

**Step 5: Verify database**

Run:
```bash
npx prisma studio
```

Check:
- User has emailProvider = 'gmail'
- User has oauthTokens populated
- New subscriptions detected appear in Subscription table

Expected: Data correctly stored

---

## Task 15: Test Manual Scan

**Step 1: Test manual scan button**

1. Go to http://localhost:3000/settings
2. Click "Scan Now" button
3. Watch worker logs for scan progress

Expected: Scan job processes, subscriptions created

**Step 2: Check dashboard**

1. Navigate to http://localhost:3000/dashboard
2. Verify detected subscriptions appear

Expected: New subscriptions visible

---

## Task 16: Test Recurring Scan Scheduling

**Step 1: Check BullMQ recurring jobs**

Run:
```bash
npm install -g bull-board
# Or check Redis keys
redis-cli KEYS "*recurring-scan*"
```

Expected: Recurring scan job exists for connected user

**Step 2: Verify job scheduling**

Check worker logs over time (or manually trigger time):
- Scan should run every 3 days
- Only scans last 30 days (not full 90)

Expected: Recurring job executes on schedule

---

## Task 17: Add Dashboard Quick Scan Button

**Files:**
- Modify: `app/dashboard/page.tsx`

**Step 1: Add scan button to dashboard**

Modify `app/dashboard/page.tsx` to add a quick scan button in the header:
```typescript
// Add to imports
import { ScanEmailsButton } from '@/components/dashboard/scan-emails-button'

// Add to the dashboard header, after the description
<div className="mb-8">
  <div className="flex justify-between items-start">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">
        Track and manage your subscriptions
      </p>
    </div>
    <ScanEmailsButton
      isGmailConnected={user?.emailProvider === 'gmail' && user?.oauthTokens !== null}
    />
  </div>
</div>
```

Expected: Button added to dashboard

**Step 2: Create scan button component**

Create `components/dashboard/scan-emails-button.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ScanEmailsButtonProps {
  isGmailConnected: boolean
}

export function ScanEmailsButton({ isGmailConnected }: ScanEmailsButtonProps) {
  const [isScanning, setIsScanning] = useState(false)

  async function handleScan() {
    setIsScanning(true)

    try {
      const response = await fetch('/api/email/scan', { method: 'POST' })

      if (response.ok) {
        alert('Scan started! New subscriptions will appear in a few minutes.')
        setTimeout(() => window.location.reload(), 5000)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to start scan')
      }
    } catch (error) {
      console.error('Scan error:', error)
      alert('Failed to start scan')
    } finally {
      setIsScanning(false)
    }
  }

  if (!isGmailConnected) {
    return (
      <Button onClick={() => window.location.href = '/settings'} variant="outline" size="sm">
        Connect Gmail
      </Button>
    )
  }

  return (
    <Button onClick={handleScan} disabled={isScanning} variant="outline" size="sm">
      {isScanning ? 'Scanning...' : '🔍 Scan Emails'}
    </Button>
  )
}
```

Expected: Component created

**Step 3: Commit**

```bash
git add app/dashboard/page.tsx components/dashboard/scan-emails-button.tsx
git commit -m "feat: add email scan button to dashboard"
```

---

## Task 18: Final Testing and Documentation

**Step 1: Create .env.example with Gmail variables**

Create or modify `.env.example`:
```bash
# Add Gmail OAuth section
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/oauth/gmail/callback"
```

Expected: Example env file updated

**Step 2: Test complete flow end-to-end**

1. Fresh user signs up
2. Connects Gmail
3. Initial scan detects subscriptions
4. Manual scan works
5. Disconnect works
6. Recurring scan scheduled correctly

Expected: All features working

**Step 3: Commit**

```bash
git add .env.example
git commit -m "docs: add Gmail OAuth environment variables"
```

---

## Summary

This implementation adds Gmail email scanning with:

✅ Gmail OAuth flow (read-only access)
✅ Pattern-based subscription detection (Netflix, Spotify, Disney+, etc.)
✅ Manual "Scan Now" button
✅ Automatic scanning every 3 days
✅ BullMQ job processing
✅ Settings page for Gmail connection
✅ Dashboard quick scan button

**Next Steps:**
1. Add more detection patterns for additional services
2. Add pending subscription confirmation UI (medium confidence detections)
3. Improve date/price extraction accuracy
4. Add Outlook support
5. Add scan history/logs UI

**Testing Checklist:**
- [ ] OAuth flow connects successfully
- [ ] Initial scan detects subscriptions
- [ ] Manual scan works from settings
- [ ] Manual scan works from dashboard
- [ ] Disconnect removes tokens and stops recurring scans
- [ ] Recurring scan runs every 3 days
- [ ] Reminders scheduled for detected subscriptions
- [ ] No duplicate subscriptions created
