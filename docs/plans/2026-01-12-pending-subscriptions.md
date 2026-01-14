# Pending Subscriptions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a pending subscriptions feature that shows medium-confidence (40-80%) email scan detections for manual user review and approval.

**Architecture:** Add new `PendingSubscription` database table to store detections requiring review. Modify email scanner worker to create pending records for 40-80% confidence detections. Add dashboard UI section showing pending items with approve/dismiss actions. Include cleanup worker to auto-remove expired items after 30 days.

**Tech Stack:** Next.js 14, Prisma, BullMQ, React Server Components, Tailwind CSS

---

## Task 1: Add PendingSubscription Database Schema

**Files:**
- Modify: `prisma/schema.prisma` (add new model after Subscription model)

**Step 1: Add PendingSubscription model to schema**

Add after the Subscription model (after line 115):

```prisma
model PendingSubscription {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")

  // Detection data
  serviceName String   @map("service_name")
  confidence  Decimal  @db.Decimal(3, 2)
  amount      Decimal? @db.Decimal(10, 2)
  currency    String   @default("USD")

  isTrial         Boolean   @default(false) @map("is_trial")
  trialEndsAt     DateTime? @map("trial_ends_at")
  nextBillingDate DateTime? @map("next_billing_date")

  // Source email data
  emailId      String   @map("email_id")
  emailSubject String   @map("email_subject")
  emailFrom    String   @map("email_from")
  emailDate    DateTime @map("email_date")
  rawEmailData Json?    @map("raw_email_data")

  // Lifecycle
  status    String   @default("pending")
  createdAt DateTime @default(now()) @map("created_at")
  expiresAt DateTime @map("expires_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
  @@index([expiresAt])
  @@map("pending_subscriptions")
}
```

**Step 2: Add relation to User model**

In the User model (around line 35), add to the relations section:

```prisma
pendingSubscriptions PendingSubscription[]
```

**Step 3: Generate migration**

Run: `npx prisma migrate dev --name add_pending_subscriptions`
Expected: Migration created successfully

**Step 4: Generate Prisma client**

Run: `npx prisma generate`
Expected: Client generated with new PendingSubscription model

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add PendingSubscription database schema"
```

---

## Task 2: Update Email Scanner Worker to Create Pending Subscriptions

**Files:**
- Modify: `workers/processors/email-scanner.ts:101-106`

**Step 1: Update medium confidence logic**

Replace the existing medium confidence block (lines 101-106):

```typescript
} else if (detection.confidence >= 0.4) {
  // Medium confidence - create as pending (could add a PendingSubscription table)
  // For now, just log it
  console.log('Pending subscription detection:', detection.service, detection.confidence)
  pendingCount++
}
```

With:

```typescript
} else if (detection.confidence >= 0.4) {
  // Medium confidence (40-80%) - create pending for review
  const existingPending = await db.pendingSubscription.findFirst({
    where: {
      userId,
      emailId: detection.rawData.emailId,
      status: 'pending'
    }
  })

  if (!existingPending) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now

    await db.pendingSubscription.create({
      data: {
        userId,
        serviceName: detection.service,
        confidence: detection.confidence,
        amount: detection.amount,
        currency: detection.currency,
        isTrial: detection.isTrial,
        trialEndsAt: detection.trialEndsAt,
        nextBillingDate: detection.nextBillingDate,
        emailId: detection.rawData.emailId,
        emailSubject: detection.rawData.subject,
        emailFrom: detection.rawData.from,
        emailDate: detection.rawData.date,
        rawEmailData: detection.rawData,
        expiresAt
      }
    })
    pendingCount++
  }
}
```

**Step 2: Update console log message**

Update the final console.log (line 109) from:

```typescript
console.log(`Scan complete for user ${userId}: ${createdCount} created, ${pendingCount} pending`)
```

To:

```typescript
console.log(`Scan complete for user ${userId}: ${createdCount} auto-created, ${pendingCount} pending review`)
```

**Step 3: Test the scanner**

Run: `npx tsx test-scan.ts`
Expected: Scan completes with pending count showing created records

**Step 4: Verify pending records created**

Run: `npx tsx -e "import { db } from './lib/db/client'; const pending = await db.pendingSubscription.findMany({ take: 5 }); console.log('Pending:', pending.length); await db.\$disconnect(); process.exit(0);"`
Expected: Shows count of pending subscriptions

**Step 5: Commit**

```bash
git add workers/processors/email-scanner.ts
git commit -m "feat: create pending subscriptions for medium confidence detections"
```

---

## Task 3: Create Cleanup Worker for Expired Pending Subscriptions

**Files:**
- Create: `workers/processors/cleanup-pending.ts`

**Step 1: Create cleanup processor**

```typescript
import { db } from '@/lib/db/client'

export async function cleanupExpiredPending() {
  try {
    const now = new Date()

    const result = await db.pendingSubscription.deleteMany({
      where: {
        status: 'pending',
        expiresAt: {
          lt: now
        }
      }
    })

    console.log(`Cleaned up ${result.count} expired pending subscriptions`)

    return {
      deletedCount: result.count
    }
  } catch (error) {
    console.error('Cleanup job error:', error)
    throw error
  }
}
```

**Step 2: Add cleanup queue**

Modify: `lib/queue/scan-queue.ts`

Add export at the end of the file:

```typescript
export async function scheduleCleanupJob() {
  return await scanQueue.add(
    'cleanup-pending',
    {},
    {
      jobId: 'cleanup-pending-daily',
      repeat: {
        every: 24 * 60 * 60 * 1000 // Daily
      },
      removeOnComplete: true,
    }
  )
}
```

**Step 3: Update job types**

Modify: `lib/queue/jobs.ts`

Add to JobType enum:

```typescript
export enum JobType {
  SEND_REMINDER = 'send_reminder',
  SCAN_INBOX = 'scan_inbox',
  CLEANUP_PENDING = 'cleanup_pending',
}
```

**Step 4: Register cleanup worker**

Modify: `workers/index.ts`

Add import:

```typescript
import { cleanupExpiredPending } from './processors/cleanup-pending'
```

Add worker registration after scanWorker:

```typescript
// Cleanup worker
scanWorker.on('completed', async (job) => {
  if (job.name === 'cleanup-pending') {
    console.log('Cleanup job completed')
  } else {
    console.log(`Scan job ${job.id} completed`)
  }
})
```

Update the processor in scanWorker to handle both job types:

```typescript
const scanWorker = new Worker<ScanInboxJob | {}>(
  'email-scanning',
  async (job) => {
    if (job.name === 'cleanup-pending') {
      await cleanupExpiredPending()
    } else {
      await processScanJob(job as Job<ScanInboxJob>)
    }
  },
  { connection }
)
```

**Step 5: Schedule cleanup on worker startup**

Add at the bottom of `workers/index.ts` before the graceful shutdown:

```typescript
// Schedule cleanup job on startup
import { scheduleCleanupJob } from '@/lib/queue/scan-queue'
scheduleCleanupJob().then(() => {
  console.log('Cleanup job scheduled')
}).catch(console.error)
```

**Step 6: Commit**

```bash
git add workers/processors/cleanup-pending.ts lib/queue/scan-queue.ts lib/queue/jobs.ts workers/index.ts
git commit -m "feat: add cleanup worker for expired pending subscriptions"
```

---

## Task 4: Create API Routes for Approve and Dismiss Actions

**Files:**
- Create: `app/api/pending-subscriptions/approve/route.ts`
- Create: `app/api/pending-subscriptions/dismiss/route.ts`

**Step 1: Create approve API route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { scheduleTrialReminders, scheduleBillingReminders } from '@/lib/notifications/schedule-reminders'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pendingId } = await req.json()

    if (!pendingId) {
      return NextResponse.json({ error: 'Missing pendingId' }, { status: 400 })
    }

    // Get pending subscription
    const pending = await db.pendingSubscription.findUnique({
      where: { id: pendingId }
    })

    if (!pending || pending.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (pending.status !== 'pending') {
      return NextResponse.json({ error: 'Already processed' }, { status: 400 })
    }

    // Create subscription from pending
    const subscription = await db.subscription.create({
      data: {
        userId: pending.userId,
        serviceName: pending.serviceName,
        status: pending.isTrial ? 'trial' : 'active',
        amount: pending.amount,
        currency: pending.currency,
        trialEndsAt: pending.trialEndsAt,
        nextBillingDate: pending.nextBillingDate,
        detectedFrom: 'email_scan',
        rawEmailData: pending.rawEmailData,
      }
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
    }

    // Mark pending as approved
    await db.pendingSubscription.update({
      where: { id: pendingId },
      data: { status: 'approved' }
    })

    return NextResponse.json({ success: true, subscriptionId: subscription.id })
  } catch (error) {
    console.error('Approve pending subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to approve subscription' },
      { status: 500 }
    )
  }
}
```

**Step 2: Create dismiss API route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pendingId } = await req.json()

    if (!pendingId) {
      return NextResponse.json({ error: 'Missing pendingId' }, { status: 400 })
    }

    // Get pending subscription
    const pending = await db.pendingSubscription.findUnique({
      where: { id: pendingId }
    })

    if (!pending || pending.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (pending.status !== 'pending') {
      return NextResponse.json({ error: 'Already processed' }, { status: 400 })
    }

    // Mark as dismissed
    await db.pendingSubscription.update({
      where: { id: pendingId },
      data: { status: 'dismissed' }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Dismiss pending subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to dismiss subscription' },
      { status: 500 }
    )
  }
}
```

**Step 3: Test API routes**

Create test file: `test-pending-api.ts`

```typescript
// Test approve endpoint
const approveRes = await fetch('http://localhost:3000/api/pending-subscriptions/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pendingId: 'test-id' })
})
console.log('Approve:', approveRes.status)

// Test dismiss endpoint
const dismissRes = await fetch('http://localhost:3000/api/pending-subscriptions/dismiss', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pendingId: 'test-id' })
})
console.log('Dismiss:', dismissRes.status)
```

Run: `npx tsx test-pending-api.ts`
Expected: Both return 401 (unauthorized - expected without session)

**Step 4: Commit**

```bash
git add app/api/pending-subscriptions
git commit -m "feat: add approve and dismiss API routes for pending subscriptions"
```

---

## Task 5: Create Pending Subscription Card Component

**Files:**
- Create: `components/pending/pending-subscription-card.tsx`

**Step 1: Create card component**

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface PendingSubscriptionCardProps {
  item: {
    id: string
    serviceName: string
    confidence: number
    amount: number | null
    currency: string
    nextBillingDate: Date | null
    emailFrom: string
    emailDate: Date
  }
}

export function PendingSubscriptionCard({ item }: PendingSubscriptionCardProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  async function handleApprove() {
    setIsProcessing(true)

    try {
      const response = await fetch('/api/pending-subscriptions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingId: item.id })
      })

      if (response.ok) {
        window.location.reload()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to approve subscription')
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Approve error:', error)
      alert('Failed to approve subscription')
      setIsProcessing(false)
    }
  }

  async function handleDismiss() {
    setIsProcessing(true)

    try {
      const response = await fetch('/api/pending-subscriptions/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingId: item.id })
      })

      if (response.ok) {
        window.location.reload()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to dismiss subscription')
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Dismiss error:', error)
      alert('Failed to dismiss subscription')
      setIsProcessing(false)
    }
  }

  const confidencePercent = Math.round((item.confidence as any) * 100)
  const formattedDate = new Date(item.emailDate).toLocaleDateString()
  const formattedBillingDate = item.nextBillingDate
    ? new Date(item.nextBillingDate).toLocaleDateString()
    : null

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-blue-300 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-gray-900">{item.serviceName}</h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
            {confidencePercent}% match
          </span>
        </div>

        {item.amount && (
          <div className="mt-1 text-sm text-gray-600">
            {item.currency}{item.amount.toString()}
            {formattedBillingDate && (
              <> · Next billing: {formattedBillingDate}</>
            )}
          </div>
        )}

        <div className="mt-1 text-xs text-gray-500">
          From: {item.emailFrom} · {formattedDate}
        </div>
      </div>

      <div className="flex gap-2 ml-4">
        <Button
          onClick={handleApprove}
          disabled={isProcessing}
          size="sm"
          variant="default"
        >
          {isProcessing ? 'Adding...' : 'Add This'}
        </Button>
        <Button
          onClick={handleDismiss}
          disabled={isProcessing}
          size="sm"
          variant="ghost"
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/pending/pending-subscription-card.tsx
git commit -m "feat: add pending subscription card component"
```

---

## Task 6: Create Pending Subscriptions Section Component

**Files:**
- Create: `components/pending/pending-subscriptions-section.tsx`

**Step 1: Create section component**

```typescript
'use client'

import { PendingSubscriptionCard } from './pending-subscription-card'

interface PendingSubscriptionsSectionProps {
  pending: Array<{
    id: string
    serviceName: string
    confidence: number
    amount: number | null
    currency: string
    nextBillingDate: Date | null
    emailFrom: string
    emailDate: Date
  }>
}

export function PendingSubscriptionsSection({ pending }: PendingSubscriptionsSectionProps) {
  if (pending.length === 0) {
    return null
  }

  return (
    <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <h2 className="text-lg font-semibold text-blue-900">
          Review Detected Subscriptions ({pending.length})
        </h2>
      </div>

      <p className="text-sm text-blue-700 mb-4">
        We found these potential subscriptions in your emails. Review and add the ones you want to track.
      </p>

      <div className="space-y-3">
        {pending.map(item => (
          <PendingSubscriptionCard key={item.id} item={item} />
        ))}
      </div>

      <p className="mt-4 text-xs text-blue-600">
        These detections will auto-dismiss after 30 days if not reviewed.
      </p>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/pending/pending-subscriptions-section.tsx
git commit -m "feat: add pending subscriptions section component"
```

---

## Task 7: Integrate Pending Subscriptions into Dashboard

**Files:**
- Modify: `app/dashboard/page.tsx`

**Step 1: Add pending subscriptions query**

After the userWithEmail query (around line 13), add:

```typescript
const pendingSubscriptions = await db.pendingSubscription.findMany({
  where: {
    userId: user.id,
    status: 'pending'
  },
  orderBy: { confidence: 'desc' },
  select: {
    id: true,
    serviceName: true,
    confidence: true,
    amount: true,
    currency: true,
    nextBillingDate: true,
    emailFrom: true,
    emailDate: true
  }
})
```

**Step 2: Add import for section component**

At the top of the file, add:

```typescript
import { PendingSubscriptionsSection } from '@/components/pending/pending-subscriptions-section'
```

**Step 3: Add section to JSX**

After the header section (around line 34), before the AddSubscriptionForm, add:

```typescript
{pendingSubscriptions.length > 0 && (
  <PendingSubscriptionsSection pending={pendingSubscriptions} />
)}
```

**Step 4: Test the dashboard**

Run dev server and visit: http://localhost:3000/dashboard
Expected: Pending subscriptions section appears if any exist

**Step 5: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: integrate pending subscriptions into dashboard"
```

---

## Task 8: Test Complete Feature End-to-End

**Files:**
- Create: `test-pending-flow.ts`

**Step 1: Create comprehensive test script**

```typescript
import { db } from './lib/db/client'

async function testPendingFlow() {
  console.log('=== Testing Pending Subscriptions Feature ===\n')

  // 1. Check for pending subscriptions
  console.log('Step 1: Checking pending subscriptions...')
  const pending = await db.pendingSubscription.findMany({
    where: { status: 'pending' },
    take: 3
  })
  console.log(`Found ${pending.length} pending subscriptions`)

  if (pending.length > 0) {
    console.log('\nSample pending subscription:')
    console.log('- Service:', pending[0].serviceName)
    console.log('- Confidence:', pending[0].confidence)
    console.log('- Amount:', `${pending[0].currency}${pending[0].amount}`)
    console.log('- Email From:', pending[0].emailFrom)
    console.log('- Expires:', pending[0].expiresAt)
  }

  // 2. Check active subscriptions count
  console.log('\nStep 2: Checking active subscriptions...')
  const activeCount = await db.subscription.count()
  console.log(`Active subscriptions: ${activeCount}`)

  // 3. Check expired pending subscriptions
  console.log('\nStep 3: Checking for expired items...')
  const expired = await db.pendingSubscription.count({
    where: {
      status: 'pending',
      expiresAt: { lt: new Date() }
    }
  })
  console.log(`Expired pending items: ${expired}`)

  console.log('\n✅ Test complete!')

  await db.$disconnect()
  process.exit(0)
}

testPendingFlow()
```

**Step 2: Run test**

Run: `npx tsx test-pending-flow.ts`
Expected: Shows pending subscriptions statistics

**Step 3: Test approve flow manually**

1. Visit http://localhost:3000/dashboard
2. Click "Add This" on a pending subscription
3. Verify it appears in active subscriptions
4. Check that pending item is marked as 'approved'

**Step 4: Test dismiss flow manually**

1. Visit http://localhost:3000/dashboard
2. Click "Dismiss" on a pending subscription
3. Verify it disappears from pending list
4. Check that pending item is marked as 'dismissed'

**Step 5: Test cleanup worker**

Run: `npx tsx -e "import { cleanupExpiredPending } from './workers/processors/cleanup-pending'; await cleanupExpiredPending(); process.exit(0);"`
Expected: Shows count of cleaned up items

**Step 6: Commit test script**

```bash
git add test-pending-flow.ts
git commit -m "test: add pending subscriptions flow test"
```

---

## Task 9: Update Documentation

**Files:**
- Modify: `README.md` (add pending subscriptions section)
- Create: `docs/plans/2026-01-12-pending-subscriptions-design.md`

**Step 1: Create design document**

Write the design document capturing the architecture and decisions made during brainstorming.

**Step 2: Update README**

Add section about pending subscriptions feature under features list.

**Step 3: Commit**

```bash
git add README.md docs/plans/2026-01-12-pending-subscriptions-design.md
git commit -m "docs: document pending subscriptions feature"
```

---

## Testing Checklist

After implementation, verify:

- [ ] Database migration runs successfully
- [ ] Email scanner creates pending subscriptions for 40-80% confidence
- [ ] Pending subscriptions appear on dashboard
- [ ] "Add This" button creates subscription and marks pending as approved
- [ ] "Dismiss" button marks pending as dismissed and removes from view
- [ ] Cleanup worker deletes expired pending items (30+ days old)
- [ ] Confidence percentage displays correctly
- [ ] Email source information shows in card
- [ ] Page refreshes after approve/dismiss actions
- [ ] Authorization checks work (can't approve others' pending items)

---

## Notes

- The feature uses optimistic UI with page reload after actions
- Consider adding optimistic UI updates later to avoid full page reload
- Cleanup worker runs daily to remove expired items
- Medium confidence range is 0.40-0.80 (inclusive)
- High confidence (0.80+) still auto-creates subscriptions
- Pending items expire after exactly 30 days from creation
