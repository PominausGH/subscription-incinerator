# Competitor Feature Parity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add four features to match/exceed Rocket Money, Truebill, and YNAB: category spending breakdown, savings goals, automated cancellation tracking, and Plaid bank account linking.

**Architecture:** All features build on the existing Next.js 14 + Prisma + PostgreSQL + BullMQ stack. Two new Prisma models (SavingsGoal, PlaidItem/PlaidAccount), extensions to existing analytics queries, and a new Plaid integration layer. Category breakdown and savings goals are free-tier; auto-cancel tracking and Plaid linking are premium.

**Tech Stack:** Next.js 14 App Router, Prisma ORM, PostgreSQL (postgres-main), BullMQ + Redis, Recharts (charts already installed), Plaid Node SDK (`plaid` npm package), existing Stripe + NextAuth

---

## Task 1: Category Spending Breakdown

Add per-category monthly/yearly spend to analytics — pie chart on dashboard showing where money goes.

**Files:**
- Modify: `src/lib/analytics/queries.ts`
- Modify: `src/app/api/analytics/summary/route.ts`
- Modify: `src/components/dashboard/spending-analytics.tsx`

**Step 1: Write failing test for category breakdown**

Add to `src/__tests__/lib/analytics/queries.test.ts`:

```typescript
describe('calculateByCategory', () => {
  it('groups active subscriptions by category name', () => {
    const subs = [
      { amount: 10, billingCycle: 'monthly', status: 'active', categoryName: 'Entertainment' },
      { amount: 5,  billingCycle: 'monthly', status: 'active', categoryName: 'Entertainment' },
      { amount: 20, billingCycle: 'monthly', status: 'active', categoryName: 'Software' },
      { amount: 8,  billingCycle: 'monthly', status: 'cancelled', categoryName: 'Software' },
    ]
    const result = calculateByCategory(subs)
    expect(result).toEqual([
      { name: 'Software',      monthly: 20, yearly: 240 },
      { name: 'Entertainment', monthly: 15, yearly: 180 },
    ])
  })

  it('labels subscriptions with no category as Uncategorised', () => {
    const subs = [
      { amount: 10, billingCycle: 'monthly', status: 'active', categoryName: null },
    ]
    const result = calculateByCategory(subs)
    expect(result[0].name).toBe('Uncategorised')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd /opt/docker/subscription/src
npx jest __tests__/lib/analytics/queries.test.ts -t "calculateByCategory" --no-coverage
```
Expected: FAIL — `calculateByCategory is not a function`

**Step 3: Add `calculateByCategory` to queries.ts**

Append to `src/lib/analytics/queries.ts`:

```typescript
export type SubscriptionForCategoryCalc = SubscriptionForCalc & {
  categoryName: string | null
}

export function calculateByCategory(
  subscriptions: SubscriptionForCategoryCalc[]
): { name: string; monthly: number; yearly: number }[] {
  const active = subscriptions.filter(
    (s) => s.status === 'active' || s.status === 'trial'
  )

  const map = new Map<string, number>()
  for (const sub of active) {
    if (!sub.amount) continue
    const key = sub.categoryName ?? 'Uncategorised'
    const current = map.get(key) ?? 0
    map.set(key, current + toMonthlyAmount(sub.amount, sub.billingCycle))
  }

  return Array.from(map.entries())
    .map(([name, monthly]) => ({
      name,
      monthly: Math.round(monthly * 100) / 100,
      yearly:  Math.round(monthly * 12 * 100) / 100,
    }))
    .sort((a, b) => b.monthly - a.monthly)
}
```

**Step 4: Run test to verify it passes**

```bash
npx jest __tests__/lib/analytics/queries.test.ts --no-coverage
```
Expected: PASS

**Step 5: Update analytics summary API to include category breakdown**

In `src/app/api/analytics/summary/route.ts`, update the `db.subscription.findMany` select to include category name:

```typescript
// Change the select block to include category:
select: {
  id: true,
  serviceName: true,
  amount: true,
  billingCycle: true,
  status: true,
  type: true,
  category: { select: { name: true } },   // ADD THIS
},
```

Then map the result and call `calculateByCategory`:

```typescript
// After the existing subscriptions map:
const subscriptionsWithCategory = subscriptions.map((sub, i) => ({
  ...sub,
  categoryName: (subscriptionsRaw[i] as any).category?.name ?? null,
}))

const byCategory = calculateByCategory(subscriptionsWithCategory)
```

Add `byCategory` to the return JSON:

```typescript
return NextResponse.json({
  monthlyTotal: ...,
  monthlyChange: ...,
  yearlyTotal: ...,
  subscriptionCount: counts,
  topSpender,
  byCategory,   // ADD THIS
})
```

**Step 6: Add category pie chart to dashboard**

In `src/components/dashboard/spending-analytics.tsx`, add a new chart section using Recharts `PieChart` (already installed). Add below the existing charts:

```tsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Inside the component, after existing charts:
{data.byCategory && data.byCategory.length > 0 && (
  <div className="mt-6">
    <h3 className="text-sm font-medium text-gray-400 mb-3">Spending by Category</h3>
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data.byCategory}
          dataKey="monthly"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {data.byCategory.map((_: unknown, index: number) => (
            <Cell
              key={index}
              fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}/mo`} />
      </PieChart>
    </ResponsiveContainer>
  </div>
)}
```

Add color palette constant above the component:

```typescript
const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#0ea5e9', '#64748b',
]
```

**Step 7: Commit**

```bash
git add src/lib/analytics/queries.ts \
        src/app/api/analytics/summary/route.ts \
        src/components/dashboard/spending-analytics.tsx \
        src/__tests__/lib/analytics/queries.test.ts
git commit -m "feat: add category spending breakdown to analytics dashboard"
```

---

## Task 2: Savings Goals

Track money saved from cancelled subscriptions and let users set savings targets.

**Files:**
- Modify: `src/prisma/schema.prisma`
- Create migration
- Create: `src/app/api/savings-goals/route.ts`
- Create: `src/app/api/savings-goals/[id]/route.ts`
- Modify: `src/app/api/subscriptions/[id]/route.ts` (record savings on cancel)
- Create: `src/components/dashboard/savings-goals.tsx`
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Add SavingsGoal model and cancelledAt to Subscription**

In `src/prisma/schema.prisma`, add to `Subscription` model:

```prisma
cancelledAt  DateTime? @map("cancelled_at")
savedAmount  Decimal?  @db.Decimal(10, 2) @map("saved_amount")
```

Add new model after `Session`:

```prisma
model SavingsGoal {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  name        String
  targetAmount Decimal @db.Decimal(10, 2) @map("target_amount")
  currency    String   @default("USD")
  deadline    DateTime?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("savings_goals")
}
```

Add relation to `User` model:

```prisma
savingsGoals SavingsGoal[]
```

**Step 2: Create and run migration**

```bash
cd /opt/docker/subscription/src
npx prisma migrate dev --name add_savings_goals
```
Expected: Migration created and applied, Prisma client regenerated.

**Step 3: Write failing tests for savings goals API**

Create `src/__tests__/api/savings-goals.test.ts`:

```typescript
import { POST, GET } from '@/app/api/savings-goals/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({ user: { id: 'user-1' } }),
}))
jest.mock('@/lib/db/client', () => ({
  db: {
    savingsGoal: {
      create: jest.fn().mockResolvedValue({
        id: 'goal-1', userId: 'user-1', name: 'Holiday Fund',
        targetAmount: '500.00', currency: 'USD', deadline: null,
        createdAt: new Date(), updatedAt: new Date(),
      }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}))

describe('POST /api/savings-goals', () => {
  it('creates a savings goal', async () => {
    const req = new NextRequest('http://localhost/api/savings-goals', {
      method: 'POST',
      body: JSON.stringify({ name: 'Holiday Fund', targetAmount: 500, currency: 'USD' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.name).toBe('Holiday Fund')
  })
})
```

**Step 4: Run test to verify it fails**

```bash
npx jest __tests__/api/savings-goals.test.ts --no-coverage
```
Expected: FAIL — module not found

**Step 5: Create savings goals API routes**

Create `src/app/api/savings-goals/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { z } from 'zod'

const CreateSchema = z.object({
  name:         z.string().min(1).max(100),
  targetAmount: z.number().positive(),
  currency:     z.string().length(3).default('USD'),
  deadline:     z.string().datetime().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const goals = await db.savingsGoal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(goals)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const goal = await db.savingsGoal.create({
    data: {
      userId:       session.user.id,
      name:         parsed.data.name,
      targetAmount: parsed.data.targetAmount,
      currency:     parsed.data.currency,
      deadline:     parsed.data.deadline ? new Date(parsed.data.deadline) : null,
    },
  })
  return NextResponse.json(goal, { status: 201 })
}
```

Create `src/app/api/savings-goals/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const goal = await db.savingsGoal.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.savingsGoal.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
```

**Step 6: Record savings when subscription is cancelled**

In `src/app/api/subscriptions/[id]/route.ts`, find the PATCH handler. When `status` is being set to `'cancelled'`, record the cancellation:

```typescript
// Inside the PATCH handler, before db.subscription.update:
const cancelData: Record<string, unknown> = {}
if (body.status === 'cancelled') {
  const existing = await db.subscription.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { amount: true, billingCycle: true, status: true },
  })
  if (existing && existing.status !== 'cancelled' && existing.amount) {
    // Calculate yearly savings
    const { toMonthlyAmount } = await import('@/lib/analytics/queries')
    const monthly = toMonthlyAmount(Number(existing.amount), existing.billingCycle ?? null)
    cancelData.cancelledAt = new Date()
    cancelData.savedAmount = Math.round(monthly * 12 * 100) / 100
  }
}

// Then merge cancelData into the update:
await db.subscription.update({
  where: { id: params.id },
  data: { ...updateData, ...cancelData },
})
```

**Step 7: Run tests**

```bash
npx jest __tests__/api/savings-goals.test.ts --no-coverage
```
Expected: PASS

**Step 8: Create savings goals dashboard component**

Create `src/components/dashboard/savings-goals.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Target, Plus, Trash2 } from 'lucide-react'

type SavingsGoal = {
  id: string
  name: string
  targetAmount: string
  currency: string
  deadline: string | null
}

type Props = {
  totalSaved: number   // sum of savedAmount from cancelled subs
  currency: string
}

export function SavingsGoals({ totalSaved, currency }: Props) {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')

  useEffect(() => {
    fetch('/api/savings-goals')
      .then((r) => r.json())
      .then(setGoals)
  }, [])

  async function addGoal(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/savings-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, targetAmount: parseFloat(target), currency }),
    })
    if (res.ok) {
      const goal = await res.json()
      setGoals((prev) => [goal, ...prev])
      setName('')
      setTarget('')
      setShowForm(false)
    }
  }

  async function deleteGoal(id: string) {
    await fetch(`/api/savings-goals/${id}`, { method: 'DELETE' })
    setGoals((prev) => prev.filter((g) => g.id !== id))
  }

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-green-400" />
          <h3 className="text-sm font-medium text-gray-300">Savings Goals</h3>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add Goal
        </button>
      </div>

      <div className="mb-4 p-3 bg-green-900/20 rounded-lg border border-green-800/30">
        <p className="text-xs text-gray-400">Total saved by cancelling</p>
        <p className="text-2xl font-bold text-green-400">
          {currency} {totalSaved.toFixed(2)}
          <span className="text-xs text-gray-500 font-normal ml-1">/yr</span>
        </p>
      </div>

      {showForm && (
        <form onSubmit={addGoal} className="mb-4 space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Goal name (e.g. Holiday Fund)"
            className="w-full bg-gray-800 text-sm rounded-lg px-3 py-2 text-white border border-gray-700"
            required
          />
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Target amount"
            className="w-full bg-gray-800 text-sm rounded-lg px-3 py-2 text-white border border-gray-700"
            min="1"
            required
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg py-2"
          >
            Save Goal
          </button>
        </form>
      )}

      <div className="space-y-3">
        {goals.map((goal) => {
          const target = parseFloat(goal.targetAmount)
          const progress = Math.min((totalSaved / target) * 100, 100)
          return (
            <div key={goal.id}>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{goal.name}</span>
                <div className="flex items-center gap-2">
                  <span>{currency} {totalSaved.toFixed(0)} / {target.toFixed(0)}</span>
                  <button onClick={() => deleteGoal(goal.id)}>
                    <Trash2 className="w-3 h-3 text-gray-600 hover:text-red-400" />
                  </button>
                </div>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )
        })}
        {goals.length === 0 && !showForm && (
          <p className="text-xs text-gray-600 text-center py-2">
            No goals yet — add one to track progress
          </p>
        )}
      </div>
    </div>
  )
}
```

**Step 9: Add SavingsGoals to dashboard**

In `src/app/dashboard/page.tsx`, fetch total saved and render component. Add to the data fetching:

```typescript
// Add to dashboard data fetch:
const cancelledSubs = await db.subscription.findMany({
  where: { userId: session.user.id, status: 'cancelled' },
  select: { savedAmount: true },
})
const totalSaved = cancelledSubs.reduce(
  (sum, s) => sum + (s.savedAmount ? Number(s.savedAmount) : 0),
  0
)
```

Pass `totalSaved` to `<SavingsGoals totalSaved={totalSaved} currency={user.homeCurrency} />` in the dashboard JSX.

**Step 10: Commit**

```bash
git add src/prisma/schema.prisma \
        src/prisma/migrations/ \
        src/app/api/savings-goals/ \
        src/app/api/subscriptions/ \
        src/components/dashboard/savings-goals.tsx \
        src/app/dashboard/page.tsx \
        src/__tests__/api/savings-goals.test.ts
git commit -m "feat: add savings goals and track savings from cancelled subscriptions"
```

---

## Task 3: Enhanced Automated Cancellation

Improve the cancellation flow to use `ServiceConfig` data (already in schema), track attempts, and confirm + record savings. No browser automation — guided cancellation with outcome tracking.

**Files:**
- Create: `src/lib/services/cancellation.ts`
- Modify: `src/app/api/subscriptions/[id]/cancel-instructions/route.ts`
- Create: `src/app/api/subscriptions/[id]/confirm-cancelled/route.ts`
- Create: `src/prisma/seed-service-configs.ts`
- Modify: `src/components/subscriptions/cancellation-wizard.tsx`

**Step 1: Write failing test for cancellation service**

Create `src/__tests__/lib/services/cancellation.test.ts`:

```typescript
import { getCancellationSteps } from '@/lib/services/cancellation'

describe('getCancellationSteps', () => {
  it('returns steps from ServiceConfig when available', () => {
    const config = {
      cancellationUrl: 'https://netflix.com/cancel',
      cancellationInstructions: {
        steps: ['Go to Account', 'Click Cancel Membership', 'Confirm cancellation'],
      },
    }
    const steps = getCancellationSteps(config)
    expect(steps).toHaveLength(3)
    expect(steps[0]).toBe('Go to Account')
  })

  it('returns generic steps when no ServiceConfig', () => {
    const steps = getCancellationSteps(null)
    expect(steps.length).toBeGreaterThan(0)
    expect(steps[0]).toContain('website')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx jest __tests__/lib/services/cancellation.test.ts --no-coverage
```
Expected: FAIL

**Step 3: Create cancellation service**

Create `src/lib/services/cancellation.ts`:

```typescript
type ServiceConfig = {
  cancellationUrl: string | null
  cancellationInstructions: unknown
} | null

type Instructions = { steps?: string[] }

export function getCancellationSteps(config: ServiceConfig): string[] {
  if (config?.cancellationInstructions) {
    const instructions = config.cancellationInstructions as Instructions
    if (Array.isArray(instructions.steps) && instructions.steps.length > 0) {
      return instructions.steps
    }
  }
  return [
    'Go to the service\'s website and log in',
    'Navigate to Account Settings or Billing',
    'Find the subscription or membership section',
    'Click Cancel Subscription and follow the prompts',
    'Check your email for a cancellation confirmation',
  ]
}

export function getCancellationUrl(
  config: ServiceConfig,
  subscriptionCancellationUrl: string | null
): string | null {
  return config?.cancellationUrl ?? subscriptionCancellationUrl ?? null
}
```

**Step 4: Run test to verify it passes**

```bash
npx jest __tests__/lib/services/cancellation.test.ts --no-coverage
```
Expected: PASS

**Step 5: Update cancel-instructions route to use ServiceConfig**

Replace content of `src/app/api/subscriptions/[id]/cancel-instructions/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { getCancellationSteps, getCancellationUrl } from '@/lib/services/cancellation'

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sub = await db.subscription.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { serviceName: true, cancellationUrl: true },
  })
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const config = await db.serviceConfig.findFirst({
    where: { serviceName: { equals: sub.serviceName, mode: 'insensitive' } },
    select: { cancellationUrl: true, cancellationInstructions: true },
  })

  // Record cancellation attempt
  await db.cancellationAttempt.create({
    data: {
      subscriptionId: params.id,
      method: 'guided',
      status: 'in_progress',
    },
  })

  return NextResponse.json({
    steps: getCancellationSteps(config),
    cancellationUrl: getCancellationUrl(config, sub.cancellationUrl),
    hasServiceConfig: !!config,
  })
}
```

**Step 6: Create confirm-cancelled endpoint**

Create `src/app/api/subscriptions/[id]/confirm-cancelled/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { toMonthlyAmount } from '@/lib/analytics/queries'

export async function POST(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sub = await db.subscription.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { amount: true, billingCycle: true, status: true },
  })
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (sub.status === 'cancelled') return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })

  const monthly = sub.amount
    ? toMonthlyAmount(Number(sub.amount), sub.billingCycle ?? null)
    : 0
  const savedAmount = Math.round(monthly * 12 * 100) / 100

  // Mark subscription cancelled + record savings
  const updated = await db.subscription.update({
    where: { id: params.id },
    data: {
      status: 'cancelled',
      cancelledAt: new Date(),
      savedAmount,
    },
  })

  // Mark most recent attempt as completed
  const attempt = await db.cancellationAttempt.findFirst({
    where: { subscriptionId: params.id, status: 'in_progress' },
    orderBy: { attemptedAt: 'desc' },
  })
  if (attempt) {
    await db.cancellationAttempt.update({
      where: { id: attempt.id },
      data: { status: 'completed', completedAt: new Date() },
    })
  }

  return NextResponse.json({ success: true, savedAmount, subscription: updated })
}
```

**Step 7: Seed common service configs**

Create `src/prisma/seed-service-configs.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const configs = [
  {
    serviceName: 'Netflix',
    cancellationUrl: 'https://www.netflix.com/cancel',
    cancellationInstructions: {
      steps: [
        'Go to netflix.com and sign in',
        'Click your profile icon (top right)',
        'Select Account',
        'Scroll to Membership & Billing',
        'Click Cancel Membership',
        'Click Finish Cancellation to confirm',
      ],
    },
  },
  {
    serviceName: 'Spotify',
    cancellationUrl: 'https://www.spotify.com/account/subscription/',
    cancellationInstructions: {
      steps: [
        'Go to spotify.com/account and sign in',
        'Click Change Plan under Your Plan',
        'Scroll down and click Cancel Premium',
        'Follow the prompts to confirm',
      ],
    },
  },
  {
    serviceName: 'Amazon Prime',
    cancellationUrl: 'https://www.amazon.com/mc/pipeline/memberships',
    cancellationInstructions: {
      steps: [
        'Go to amazon.com and sign in',
        'Go to Account & Lists > Prime Membership',
        'Click Manage Membership',
        'Click End Membership',
        'Choose End on [date] and confirm',
      ],
    },
  },
  {
    serviceName: 'Adobe',
    cancellationUrl: 'https://account.adobe.com/plans',
    cancellationInstructions: {
      steps: [
        'Go to account.adobe.com/plans and sign in',
        'Click Manage Plan next to your subscription',
        'Click Cancel Plan',
        'Select a cancellation reason',
        'Review early termination fees if applicable',
        'Click Continue to Cancel',
      ],
    },
  },
  {
    serviceName: 'Disney+',
    cancellationUrl: 'https://www.disneyplus.com/account',
    cancellationInstructions: {
      steps: [
        'Go to disneyplus.com and sign in',
        'Click your profile icon',
        'Select Account',
        'Click Cancel Subscription',
        'Confirm cancellation',
      ],
    },
  },
  {
    serviceName: 'YouTube Premium',
    cancellationUrl: 'https://www.youtube.com/paid_memberships',
    cancellationInstructions: {
      steps: [
        'Go to youtube.com/paid_memberships',
        'Click Manage next to YouTube Premium',
        'Click Deactivate',
        'Confirm deactivation',
      ],
    },
  },
]

async function main() {
  for (const config of configs) {
    await prisma.serviceConfig.upsert({
      where: { serviceName: config.serviceName },
      update: config,
      create: config,
    })
  }
  console.log(`Seeded ${configs.length} service configs`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Add script to `package.json`:

```json
"seed:service-configs": "tsx prisma/seed-service-configs.ts"
```

Run: `npm run seed:service-configs`

**Step 8: Update cancellation wizard component**

In `src/components/subscriptions/cancellation-wizard.tsx`, update to:
1. Fetch steps from the updated `/cancel-instructions` endpoint
2. Show direct link button if `cancellationUrl` is provided
3. Add "I've cancelled it" confirmation button that calls `/confirm-cancelled`
4. Show savings amount after confirmation

The wizard should have 3 states: `steps` → `confirming` → `confirmed`.

**Step 9: Commit**

```bash
git add src/lib/services/cancellation.ts \
        src/app/api/subscriptions/ \
        src/prisma/seed-service-configs.ts \
        src/package.json \
        src/components/subscriptions/cancellation-wizard.tsx \
        src/__tests__/lib/services/
git commit -m "feat: enhanced cancellation flow with ServiceConfig steps and savings tracking"
```

---

## Task 4: Bank Account Linking (Plaid)

Replace CSV-only bank import with live Plaid bank feed. Plaid Link lets users connect their bank in 2 minutes; transactions sync automatically.

**Files:**
- Run: `npm install plaid` in `src/`
- Modify: `src/prisma/schema.prisma`
- Create migration
- Create: `src/lib/plaid/client.ts`
- Create: `src/lib/plaid/sync.ts`
- Create: `src/app/api/plaid/link-token/route.ts`
- Create: `src/app/api/plaid/exchange-token/route.ts`
- Create: `src/app/api/plaid/sync/route.ts`
- Create: `src/workers/processors/plaid-sync.ts`
- Modify: `src/workers/index.ts`
- Create: `src/components/settings/plaid-connection-card.tsx`
- Modify: `src/app/settings/page.tsx`

**Step 1: Install Plaid SDK**

```bash
cd /opt/docker/subscription/src
npm install plaid
```

**Step 2: Add Plaid models to schema**

Add to `src/prisma/schema.prisma`:

```prisma
model PlaidItem {
  id           String         @id @default(cuid())
  userId       String         @map("user_id")
  itemId       String         @unique @map("item_id")
  accessToken  String         @map("access_token")   // encrypted
  institutionName String?     @map("institution_name")
  cursor       String?        // Plaid sync cursor
  lastSyncedAt DateTime?      @map("last_synced_at")
  createdAt    DateTime       @default(now()) @map("created_at")
  updatedAt    DateTime       @updatedAt @map("updated_at")
  user         User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  accounts     PlaidAccount[]

  @@index([userId])
  @@map("plaid_items")
}

model PlaidAccount {
  id          String    @id @default(cuid())
  plaidItemId String    @map("plaid_item_id")
  accountId   String    @unique @map("account_id")
  name        String
  mask        String?   // last 4 digits
  type        String    // checking, savings, credit
  createdAt   DateTime  @default(now()) @map("created_at")
  plaidItem   PlaidItem @relation(fields: [plaidItemId], references: [id], onDelete: Cascade)

  @@map("plaid_accounts")
}
```

Add relations to `User`:

```prisma
plaidItems PlaidItem[]
```

**Step 3: Create and run migration**

```bash
npx prisma migrate dev --name add_plaid_integration
```
Expected: Migration applied, client regenerated.

**Step 4: Write failing test for Plaid sync logic**

Create `src/__tests__/lib/plaid/sync.test.ts`:

```typescript
import { filterRecurringTransactions } from '@/lib/plaid/sync'

describe('filterRecurringTransactions', () => {
  it('identifies recurring transactions by merchant name', () => {
    const transactions = [
      { merchantName: 'NETFLIX', amount: -15.99, date: '2026-01-01' },
      { merchantName: 'NETFLIX', amount: -15.99, date: '2026-02-01' },
      { merchantName: 'STARBUCKS', amount: -5.50, date: '2026-01-15' },
    ]
    const recurring = filterRecurringTransactions(transactions)
    expect(recurring.map((t) => t.merchantName)).toContain('NETFLIX')
    expect(recurring.map((t) => t.merchantName)).not.toContain('STARBUCKS')
  })
})
```

**Step 5: Run test to verify it fails**

```bash
npx jest __tests__/lib/plaid/sync.test.ts --no-coverage
```
Expected: FAIL

**Step 6: Create Plaid client**

Create `src/lib/plaid/client.ts`:

```typescript
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as 'sandbox' | 'production' ?? 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.PLAID_SECRET!,
    },
  },
})

export const plaidClient = new PlaidApi(config)
```

**Step 7: Create Plaid sync utilities**

Create `src/lib/plaid/sync.ts`:

```typescript
import { encrypt, decrypt } from '@/lib/crypto'

type RawTransaction = {
  merchantName: string | null
  amount: number
  date: string
}

// Keep only merchants that appear 2+ times (recurring pattern)
export function filterRecurringTransactions(
  transactions: RawTransaction[]
): RawTransaction[] {
  const counts = new Map<string, number>()
  for (const t of transactions) {
    if (!t.merchantName) continue
    counts.set(t.merchantName, (counts.get(t.merchantName) ?? 0) + 1)
  }
  return transactions.filter(
    (t) => t.merchantName && (counts.get(t.merchantName) ?? 0) >= 2
  )
}

export function encryptAccessToken(token: string): string {
  return encrypt(token)
}

export function decryptAccessToken(encrypted: string): string {
  return decrypt(encrypted)
}
```

**Step 8: Run test to verify it passes**

```bash
npx jest __tests__/lib/plaid/sync.test.ts --no-coverage
```
Expected: PASS

**Step 9: Create Plaid API routes**

Create `src/app/api/plaid/link-token/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { plaidClient } from '@/lib/plaid/client'
import { CountryCode, Products } from 'plaid'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.tier !== 'premium') {
    return NextResponse.json({ error: 'Premium required' }, { status: 403 })
  }

  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: session.user.id },
    client_name: 'Subscription Incinerator',
    products: [Products.Transactions],
    country_codes: [CountryCode.Us, CountryCode.Gb, CountryCode.Au],
    language: 'en',
  })

  return NextResponse.json({ linkToken: response.data.link_token })
}
```

Create `src/app/api/plaid/exchange-token/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { plaidClient } from '@/lib/plaid/client'
import { db } from '@/lib/db/client'
import { encryptAccessToken } from '@/lib/plaid/sync'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { publicToken, institutionName } = await req.json()

  const exchangeRes = await plaidClient.itemPublicTokenExchange({ public_token: publicToken })
  const { access_token, item_id } = exchangeRes.data

  // Get accounts for this item
  const accountsRes = await plaidClient.accountsGet({ access_token })

  const plaidItem = await db.plaidItem.create({
    data: {
      userId: session.user.id,
      itemId: item_id,
      accessToken: encryptAccessToken(access_token),
      institutionName,
      accounts: {
        create: accountsRes.data.accounts.map((a) => ({
          accountId: a.account_id,
          name: a.name,
          mask: a.mask ?? null,
          type: a.type,
        })),
      },
    },
  })

  // Queue initial transaction sync
  const { addPlaidSyncJob } = await import('@/lib/queue/scan-queue')
  await addPlaidSyncJob(plaidItem.id)

  return NextResponse.json({ success: true, institutionName })
}
```

Create `src/app/api/plaid/sync/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { addPlaidSyncJob } from '@/lib/queue/scan-queue'

export async function POST(_: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const items = await db.plaidItem.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  })

  for (const item of items) {
    await addPlaidSyncJob(item.id)
  }

  return NextResponse.json({ queued: items.length })
}
```

**Step 10: Add Plaid sync job type and queue function**

In `src/lib/queue/jobs.ts`, add:

```typescript
SYNC_PLAID = 'SYNC_PLAID',
```

In `src/lib/queue/scan-queue.ts`, add:

```typescript
export async function addPlaidSyncJob(plaidItemId: string) {
  const queue = getEmailScanQueue() // reuse same queue
  await queue.add(JobType.SYNC_PLAID, { plaidItemId }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  })
}
```

**Step 11: Create Plaid sync worker processor**

Create `src/workers/processors/plaid-sync.ts`:

```typescript
import { Job } from 'bullmq'
import { db } from '@/lib/db/client'
import { plaidClient } from '@/lib/plaid/client'
import { decryptAccessToken, filterRecurringTransactions } from '@/lib/plaid/sync'
import { RemovedTransaction, Transaction } from 'plaid'

export async function processSyncPlaid(job: Job<{ plaidItemId: string }>) {
  const { plaidItemId } = job.data

  const item = await db.plaidItem.findUnique({
    where: { id: plaidItemId },
    select: { id: true, userId: true, accessToken: true, cursor: true },
  })
  if (!item) throw new Error(`PlaidItem ${plaidItemId} not found`)

  const accessToken = decryptAccessToken(item.accessToken)
  let cursor = item.cursor ?? undefined
  let added: Transaction[] = []

  // Paginate through all new transactions
  let hasMore = true
  while (hasMore) {
    const res = await plaidClient.transactionsSync({
      access_token: accessToken,
      cursor,
    })
    added = added.concat(res.data.added)
    cursor = res.data.next_cursor
    hasMore = res.data.has_more
  }

  // Save cursor
  await db.plaidItem.update({
    where: { id: plaidItemId },
    data: { cursor, lastSyncedAt: new Date() },
  })

  // Filter to likely subscriptions (negative amount = debit, recurring merchant)
  const debits = added
    .filter((t) => t.amount > 0) // Plaid: positive = debit
    .map((t) => ({
      merchantName: t.merchant_name ?? t.name,
      amount: t.amount,
      date: t.date,
    }))

  const recurring = filterRecurringTransactions(debits)

  // Create pending subscriptions for review
  for (const t of recurring) {
    if (!t.merchantName) continue
    const exists = await db.pendingSubscription.findFirst({
      where: {
        userId: item.userId,
        serviceName: t.merchantName,
        status: 'pending',
      },
    })
    if (exists) continue

    await db.pendingSubscription.create({
      data: {
        userId: item.userId,
        serviceName: t.merchantName,
        confidence: 0.75,
        amount: t.amount,
        currency: 'USD',
        emailId: `plaid-${t.date}-${t.merchantName}`,
        emailSubject: `Recurring charge from ${t.merchantName}`,
        emailFrom: 'plaid-sync',
        emailDate: new Date(t.date),
        detectedFrom: 'bank_link',
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
  }
}
```

**Step 12: Register worker in workers/index.ts**

In `src/workers/index.ts`, add the SYNC_PLAID case to the worker switch:

```typescript
case JobType.SYNC_PLAID:
  await processSyncPlaid(job)
  break
```

Import `processSyncPlaid` at top of file.

**Step 13: Create Plaid connection settings card**

Create `src/components/settings/plaid-connection-card.tsx`:

```tsx
'use client'

import { useState, useCallback } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { Building2, CheckCircle, RefreshCw } from 'lucide-react'

// Install: npm install react-plaid-link
// Note: run `npm install react-plaid-link` before using this component

type Props = {
  connectedInstitutions: { id: string; institutionName: string | null }[]
}

export function PlaidConnectionCard({ connectedInstitutions }: Props) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [institutions, setInstitutions] = useState(connectedInstitutions)

  async function getLinkToken() {
    const res = await fetch('/api/plaid/link-token', { method: 'POST' })
    const data = await res.json()
    setLinkToken(data.linkToken)
  }

  const onSuccess = useCallback(async (publicToken: string, metadata: { institution: { name: string } }) => {
    await fetch('/api/plaid/exchange-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicToken,
        institutionName: metadata.institution.name,
      }),
    })
    setInstitutions((prev) => [...prev, { id: Date.now().toString(), institutionName: metadata.institution.name }])
    setLinkToken(null)
  }, [])

  const { open, ready } = usePlaidLink({ token: linkToken ?? '', onSuccess })

  async function syncAll() {
    setSyncing(true)
    await fetch('/api/plaid/sync', { method: 'POST' })
    setSyncing(false)
  }

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-medium text-gray-300">Bank Accounts</h3>
        </div>
        {institutions.length > 0 && (
          <button
            onClick={syncAll}
            disabled={syncing}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </button>
        )}
      </div>

      {institutions.length > 0 ? (
        <div className="space-y-2 mb-4">
          {institutions.map((inst) => (
            <div key={inst.id} className="flex items-center gap-2 text-sm text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-400" />
              {inst.institutionName ?? 'Unknown Bank'}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 mb-4">
          Connect your bank to auto-detect subscriptions from transactions
        </p>
      )}

      <button
        onClick={linkToken ? () => open() : getLinkToken}
        disabled={linkToken ? !ready : false}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg py-2"
      >
        {linkToken ? 'Open Bank Connection' : '+ Connect Bank Account'}
      </button>
    </div>
  )
}
```

Install react-plaid-link:

```bash
cd /opt/docker/subscription/src
npm install react-plaid-link
```

**Step 14: Add Plaid env vars to .env.example**

Add to `src/.env.example`:

```env
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox
```

**Step 15: Add PlaidConnectionCard to settings page**

In `src/app/settings/page.tsx`, fetch connected institutions and render `<PlaidConnectionCard>` alongside the existing Gmail connection card. Guard with premium tier check.

**Step 16: Run all tests**

```bash
npx jest --no-coverage
```
Expected: All tests pass.

**Step 17: Commit**

```bash
git add src/prisma/schema.prisma \
        src/prisma/migrations/ \
        src/lib/plaid/ \
        src/app/api/plaid/ \
        src/workers/processors/plaid-sync.ts \
        src/workers/index.ts \
        src/lib/queue/ \
        src/components/settings/plaid-connection-card.tsx \
        src/app/settings/page.tsx \
        src/.env.example \
        src/__tests__/lib/plaid/ \
        src/package.json \
        src/package-lock.json
git commit -m "feat: Plaid bank account linking for automatic subscription detection"
```

---

## Environment Variables to Add

Add to `/opt/docker/subscription/.env` (production):

```env
PLAID_CLIENT_ID=<from dashboard.plaid.com>
PLAID_SECRET=<from dashboard.plaid.com>
PLAID_ENV=production
```

For development/testing, use `PLAID_ENV=sandbox` with Plaid's sandbox credentials.

---

## Tier Gates Summary

| Feature | Free | Premium |
|---|---|---|
| Category spending breakdown | Yes | Yes |
| Savings goals | Yes | Yes |
| Enhanced cancellation wizard | Yes | Yes |
| Bank linking (Plaid) | No | Yes |

Plaid is gated at the link-token endpoint (`tier !== 'premium'` → 403). All other features are available on free tier.
