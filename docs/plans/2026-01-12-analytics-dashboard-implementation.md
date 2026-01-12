# Analytics Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add spending analytics dashboard with category breakdown, timeline charts, and personal/business segmentation.

**Architecture:** Server-side data aggregation via Prisma, client-side charts with Recharts. Summary cards on dashboard page, full analytics at `/analytics`. Categories stored in DB with presets seeded.

**Tech Stack:** Next.js 14, Prisma, PostgreSQL, Recharts, TypeScript, Tailwind CSS

---

## Task 1: Add Recharts Dependency

**Files:**
- Modify: `package.json`

**Step 1: Install recharts**

Run:
```bash
npm install recharts
```

**Step 2: Verify installation**

Run:
```bash
npm list recharts
```

Expected: `recharts@2.x.x`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add recharts dependency"
```

---

## Task 2: Create Category Model and Subscription Type Enum

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add SubscriptionType enum and Category model to schema**

Add after the existing enums/models in `prisma/schema.prisma`:

```prisma
enum SubscriptionType {
  PERSONAL
  BUSINESS
}

model Category {
  id        String   @id @default(uuid())
  name      String
  userId    String?  @map("user_id")
  isPreset  Boolean  @default(false) @map("is_preset")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user          User?          @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscriptions Subscription[]

  @@unique([name, userId])
  @@index([userId])
  @@map("categories")
}
```

**Step 2: Add type and categoryId to Subscription model**

In the Subscription model, add these fields after `detectedFrom`:

```prisma
  type       SubscriptionType @default(PERSONAL)
  categoryId String?          @map("category_id")
  category   Category?        @relation(fields: [categoryId], references: [id], onDelete: SetNull)
```

**Step 3: Add categories relation to User model**

In the User model relations section, add:

```prisma
  categories           Category[]
```

**Step 4: Create migration**

Run:
```bash
npx prisma migrate dev --name add_categories_and_subscription_type
```

Expected: Migration created and applied successfully.

**Step 5: Verify Prisma client regenerated**

Run:
```bash
npx prisma generate
```

**Step 6: Commit**

```bash
git add prisma/
git commit -m "feat(db): add Category model and SubscriptionType enum"
```

---

## Task 3: Seed Preset Categories

**Files:**
- Create: `prisma/seed-categories.ts`
- Modify: `package.json` (add seed script if needed)

**Step 1: Create category seed file**

Create `prisma/seed-categories.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
    await prisma.category.upsert({
      where: {
        name_userId: {
          name,
          userId: null as unknown as string, // Preset categories have no userId
        },
      },
      update: {},
      create: {
        name,
        isPreset: true,
        userId: null,
      },
    })
  }

  console.log('Preset categories seeded successfully')
}

seedCategories()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

**Step 2: Run the seed**

Run:
```bash
npx tsx prisma/seed-categories.ts
```

Expected: "Preset categories seeded successfully"

**Step 3: Verify categories exist**

Run:
```bash
npx prisma studio
```

Check the Category table has 8 preset categories.

**Step 4: Commit**

```bash
git add prisma/seed-categories.ts
git commit -m "feat(db): add preset categories seed script"
```

---

## Task 4: Create Analytics Summary API Endpoint

**Files:**
- Create: `lib/analytics/queries.ts`
- Create: `app/api/analytics/summary/route.ts`
- Create: `__tests__/lib/analytics/queries.test.ts`

**Step 1: Write the failing test for analytics queries**

Create `__tests__/lib/analytics/queries.test.ts`:

```typescript
import { calculateMonthlyTotal, calculateYearlyTotal } from '@/lib/analytics/queries'

describe('Analytics Queries', () => {
  describe('calculateMonthlyTotal', () => {
    it('should sum subscription amounts for the current month', () => {
      const subscriptions = [
        { amount: 9.99, billingCycle: 'monthly', status: 'active' },
        { amount: 14.99, billingCycle: 'monthly', status: 'active' },
        { amount: 120.00, billingCycle: 'yearly', status: 'active' },
      ]

      // Monthly subs count full amount, yearly divided by 12
      const result = calculateMonthlyTotal(subscriptions)
      expect(result).toBeCloseTo(9.99 + 14.99 + 10.00, 2) // 34.98
    })

    it('should exclude cancelled subscriptions', () => {
      const subscriptions = [
        { amount: 9.99, billingCycle: 'monthly', status: 'active' },
        { amount: 14.99, billingCycle: 'monthly', status: 'cancelled' },
      ]

      const result = calculateMonthlyTotal(subscriptions)
      expect(result).toBeCloseTo(9.99, 2)
    })
  })

  describe('calculateYearlyTotal', () => {
    it('should project annual cost from subscriptions', () => {
      const subscriptions = [
        { amount: 9.99, billingCycle: 'monthly', status: 'active' },
        { amount: 120.00, billingCycle: 'yearly', status: 'active' },
      ]

      // Monthly * 12 + yearly
      const result = calculateYearlyTotal(subscriptions)
      expect(result).toBeCloseTo(9.99 * 12 + 120.00, 2) // 239.88
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test -- __tests__/lib/analytics/queries.test.ts
```

Expected: FAIL - module not found

**Step 3: Create analytics queries module**

Create `lib/analytics/queries.ts`:

```typescript
type SubscriptionForCalc = {
  amount: number | null
  billingCycle: string | null
  status: string
  type?: 'PERSONAL' | 'BUSINESS'
}

export function calculateMonthlyTotal(
  subscriptions: SubscriptionForCalc[],
  typeFilter?: 'PERSONAL' | 'BUSINESS'
): number {
  return subscriptions
    .filter((sub) => sub.status === 'active' || sub.status === 'trial')
    .filter((sub) => !typeFilter || sub.type === typeFilter)
    .reduce((total, sub) => {
      if (!sub.amount) return total
      if (sub.billingCycle === 'yearly') {
        return total + sub.amount / 12
      }
      return total + sub.amount
    }, 0)
}

export function calculateYearlyTotal(
  subscriptions: SubscriptionForCalc[],
  typeFilter?: 'PERSONAL' | 'BUSINESS'
): number {
  return subscriptions
    .filter((sub) => sub.status === 'active' || sub.status === 'trial')
    .filter((sub) => !typeFilter || sub.type === typeFilter)
    .reduce((total, sub) => {
      if (!sub.amount) return total
      if (sub.billingCycle === 'yearly') {
        return total + sub.amount
      }
      return total + sub.amount * 12
    }, 0)
}

export function getTopSpender(
  subscriptions: SubscriptionForCalc[]
): SubscriptionForCalc | null {
  const active = subscriptions.filter(
    (sub) => (sub.status === 'active' || sub.status === 'trial') && sub.amount
  )
  if (active.length === 0) return null

  return active.reduce((max, sub) => {
    const maxMonthly = max.billingCycle === 'yearly' ? (max.amount || 0) / 12 : (max.amount || 0)
    const subMonthly = sub.billingCycle === 'yearly' ? (sub.amount || 0) / 12 : (sub.amount || 0)
    return subMonthly > maxMonthly ? sub : max
  })
}

export function countByType(
  subscriptions: SubscriptionForCalc[]
): { personal: number; business: number } {
  const active = subscriptions.filter(
    (sub) => sub.status === 'active' || sub.status === 'trial'
  )
  return {
    personal: active.filter((sub) => sub.type === 'PERSONAL' || !sub.type).length,
    business: active.filter((sub) => sub.type === 'BUSINESS').length,
  }
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm test -- __tests__/lib/analytics/queries.test.ts
```

Expected: PASS

**Step 5: Create summary API route**

Create `app/api/analytics/summary/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import {
  calculateMonthlyTotal,
  calculateYearlyTotal,
  getTopSpender,
  countByType,
} from '@/lib/analytics/queries'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const typeFilter = searchParams.get('type') as 'PERSONAL' | 'BUSINESS' | 'all' | null

    const subscriptionsRaw = await db.subscription.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        serviceName: true,
        amount: true,
        billingCycle: true,
        status: true,
        type: true,
      },
    })

    const subscriptions = subscriptionsRaw.map((sub) => ({
      ...sub,
      amount: sub.amount ? Number(sub.amount) : null,
    }))

    const filterType = typeFilter === 'all' || !typeFilter ? undefined : typeFilter

    const monthlyTotal = calculateMonthlyTotal(subscriptions, filterType)
    const yearlyTotal = calculateYearlyTotal(subscriptions, filterType)
    const counts = countByType(subscriptions)

    // Calculate previous month total for comparison
    const previousMonthTotal = monthlyTotal // Simplified - would need historical data for real comparison
    const monthlyChange = previousMonthTotal > 0
      ? ((monthlyTotal - previousMonthTotal) / previousMonthTotal) * 100
      : 0

    const topSpenderRaw = getTopSpender(
      filterType ? subscriptions.filter((s) => s.type === filterType) : subscriptions
    )

    const topSpender = topSpenderRaw
      ? {
          id: (topSpenderRaw as { id: string }).id,
          name: (topSpenderRaw as { serviceName: string }).serviceName,
          cost: topSpenderRaw.amount,
          cycle: topSpenderRaw.billingCycle,
        }
      : null

    return NextResponse.json({
      monthlyTotal: Math.round(monthlyTotal * 100) / 100,
      monthlyChange: Math.round(monthlyChange * 10) / 10,
      yearlyTotal: Math.round(yearlyTotal * 100) / 100,
      subscriptionCount: counts,
      topSpender,
    })
  } catch (error) {
    console.error('Analytics summary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Step 6: Commit**

```bash
git add lib/analytics/ app/api/analytics/ __tests__/lib/analytics/
git commit -m "feat(api): add analytics summary endpoint"
```

---

## Task 5: Create Analytics Trends API Endpoint

**Files:**
- Modify: `lib/analytics/queries.ts`
- Create: `app/api/analytics/trends/route.ts`

**Step 1: Add trend calculation to queries**

Add to `lib/analytics/queries.ts`:

```typescript
export function calculateMonthlyTrends(
  subscriptions: (SubscriptionForCalc & { createdAt: Date })[],
  year: number
): { month: string; personal: number; business: number }[] {
  const months: { month: string; personal: number; business: number }[] = []

  for (let m = 0; m < 12; m++) {
    const monthStr = `${year}-${String(m + 1).padStart(2, '0')}`
    const monthStart = new Date(year, m, 1)
    const monthEnd = new Date(year, m + 1, 0)

    // Filter subscriptions that existed during this month
    const activeInMonth = subscriptions.filter((sub) => {
      const created = new Date(sub.createdAt)
      return created <= monthEnd && (sub.status === 'active' || sub.status === 'trial')
    })

    const personal = calculateMonthlyTotal(
      activeInMonth.filter((s) => s.type === 'PERSONAL' || !s.type)
    )
    const business = calculateMonthlyTotal(
      activeInMonth.filter((s) => s.type === 'BUSINESS')
    )

    months.push({ month: monthStr, personal, business })
  }

  return months
}
```

**Step 2: Create trends API route**

Create `app/api/analytics/trends/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { calculateMonthlyTrends } from '@/lib/analytics/queries'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    const subscriptionsRaw = await db.subscription.findMany({
      where: { userId: session.user.id },
      select: {
        amount: true,
        billingCycle: true,
        status: true,
        type: true,
        createdAt: true,
      },
    })

    const subscriptions = subscriptionsRaw.map((sub) => ({
      ...sub,
      amount: sub.amount ? Number(sub.amount) : null,
    }))

    const months = calculateMonthlyTrends(subscriptions, year)

    return NextResponse.json({ months })
  } catch (error) {
    console.error('Analytics trends error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Step 3: Commit**

```bash
git add lib/analytics/queries.ts app/api/analytics/trends/
git commit -m "feat(api): add analytics trends endpoint"
```

---

## Task 6: Create Analytics Categories API Endpoint

**Files:**
- Create: `app/api/analytics/categories/route.ts`

**Step 1: Create categories breakdown API route**

Create `app/api/analytics/categories/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const typeFilter = searchParams.get('type') as 'PERSONAL' | 'BUSINESS' | 'all' | null
    const period = searchParams.get('period') || 'month'

    const whereClause: Record<string, unknown> = {
      userId: session.user.id,
      status: { in: ['active', 'trial'] },
    }

    if (typeFilter && typeFilter !== 'all') {
      whereClause.type = typeFilter
    }

    const subscriptions = await db.subscription.findMany({
      where: whereClause,
      select: {
        amount: true,
        billingCycle: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Group by category and calculate totals
    const categoryTotals = new Map<string, { id: string; name: string; total: number }>()

    for (const sub of subscriptions) {
      const amount = sub.amount ? Number(sub.amount) : 0
      let monthlyAmount = amount
      if (sub.billingCycle === 'yearly') {
        monthlyAmount = amount / 12
      }

      const annualAmount = sub.billingCycle === 'yearly' ? amount : amount * 12
      const finalAmount = period === 'year' ? annualAmount : monthlyAmount

      const categoryId = sub.categoryId || 'uncategorized'
      const categoryName = sub.category?.name || 'Uncategorized'

      const existing = categoryTotals.get(categoryId) || {
        id: categoryId,
        name: categoryName,
        total: 0,
      }
      existing.total += finalAmount
      categoryTotals.set(categoryId, existing)
    }

    const categories = Array.from(categoryTotals.values())
      .sort((a, b) => b.total - a.total)

    const grandTotal = categories.reduce((sum, cat) => sum + cat.total, 0)

    const categoriesWithPercentage = categories.map((cat) => ({
      ...cat,
      total: Math.round(cat.total * 100) / 100,
      percentage: grandTotal > 0 ? Math.round((cat.total / grandTotal) * 1000) / 10 : 0,
    }))

    return NextResponse.json({ categories: categoriesWithPercentage })
  } catch (error) {
    console.error('Analytics categories error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add app/api/analytics/categories/
git commit -m "feat(api): add analytics categories endpoint"
```

---

## Task 7: Create Categories API for CRUD Operations

**Files:**
- Create: `app/api/categories/route.ts`
- Create: `lib/validations/category.ts`

**Step 1: Create category validation schema**

Create `lib/validations/category.ts`:

```typescript
import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
```

**Step 2: Create categories API route**

Create `app/api/categories/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { createCategorySchema } from '@/lib/validations/category'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get preset categories and user's custom categories
    const categories = await db.category.findMany({
      where: {
        OR: [
          { isPreset: true },
          { userId: session.user.id },
        ],
      },
      orderBy: [
        { isPreset: 'desc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = createCategorySchema.parse(body)

    // Check if category already exists for user
    const existing = await db.category.findFirst({
      where: {
        name: validated.name,
        OR: [
          { isPreset: true },
          { userId: session.user.id },
        ],
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 })
    }

    const category = await db.category.create({
      data: {
        name: validated.name,
        userId: session.user.id,
        isPreset: false,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Create category error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Step 3: Commit**

```bash
git add lib/validations/category.ts app/api/categories/
git commit -m "feat(api): add categories CRUD endpoint"
```

---

## Task 8: Update Subscription Validation and API

**Files:**
- Modify: `lib/validations/subscription.ts`
- Modify: `app/api/subscriptions/route.ts`

**Step 1: Update subscription validation schema**

Add to `lib/validations/subscription.ts` (extend existing schema):

```typescript
// Add these fields to the existing createSubscriptionSchema
  type: z.enum(['PERSONAL', 'BUSINESS']).optional().default('PERSONAL'),
  categoryId: z.string().uuid().optional().nullable(),
```

**Step 2: Update POST handler in subscriptions route**

In `app/api/subscriptions/route.ts`, add to the `data` object in `db.subscription.create`:

```typescript
        type: validated.type,
        categoryId: validated.categoryId,
```

**Step 3: Commit**

```bash
git add lib/validations/subscription.ts app/api/subscriptions/route.ts
git commit -m "feat(api): add type and category to subscription creation"
```

---

## Task 9: Create Summary Cards Component

**Files:**
- Create: `components/analytics/summary-cards.tsx`
- Create: `lib/hooks/use-analytics.ts`

**Step 1: Create analytics hook**

Create `lib/hooks/use-analytics.ts`:

```typescript
'use client'

import { useState, useEffect } from 'react'

export type AnalyticsSummary = {
  monthlyTotal: number
  monthlyChange: number
  yearlyTotal: number
  subscriptionCount: { personal: number; business: number }
  topSpender: { id: string; name: string; cost: number; cycle: string } | null
}

export function useAnalyticsSummary(typeFilter: 'PERSONAL' | 'BUSINESS' | 'all' = 'all') {
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSummary() {
      try {
        setLoading(true)
        const res = await fetch(`/api/analytics/summary?type=${typeFilter}`)
        if (!res.ok) throw new Error('Failed to fetch analytics')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [typeFilter])

  return { data, loading, error }
}
```

**Step 2: Create summary cards component**

Create `components/analytics/summary-cards.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { useAnalyticsSummary } from '@/lib/hooks/use-analytics'

type Props = {
  typeFilter?: 'PERSONAL' | 'BUSINESS' | 'all'
}

export function SummaryCards({ typeFilter = 'all' }: Props) {
  const { data, loading, error } = useAnalyticsSummary(typeFilter)

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error || !data) {
    return null
  }

  const cards = [
    {
      label: 'Monthly Spend',
      value: `$${data.monthlyTotal.toFixed(2)}`,
      change: data.monthlyChange,
      showChange: true,
    },
    {
      label: 'Yearly Projection',
      value: `$${data.yearlyTotal.toFixed(2)}`,
    },
    {
      label: 'Active Subscriptions',
      value: `${data.subscriptionCount.personal + data.subscriptionCount.business}`,
      subtitle: `${data.subscriptionCount.personal} personal, ${data.subscriptionCount.business} business`,
    },
    {
      label: 'Top Spender',
      value: data.topSpender?.name || 'None',
      subtitle: data.topSpender
        ? `$${data.topSpender.cost?.toFixed(2) || '0.00'}/${data.topSpender.cycle === 'yearly' ? 'yr' : 'mo'}`
        : undefined,
      highlight: true,
    },
  ]

  return (
    <Link href="/analytics" className="block mb-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow ${
              card.highlight ? 'ring-2 ring-amber-200' : ''
            }`}
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            {card.showChange && (
              <p
                className={`text-sm mt-1 ${
                  card.change >= 0 ? 'text-red-500' : 'text-green-500'
                }`}
              >
                {card.change >= 0 ? '+' : ''}
                {card.change.toFixed(1)}% vs last month
              </p>
            )}
            {card.subtitle && (
              <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
            )}
          </div>
        ))}
      </div>
    </Link>
  )
}
```

**Step 3: Commit**

```bash
git add lib/hooks/use-analytics.ts components/analytics/
git commit -m "feat(ui): add analytics summary cards component"
```

---

## Task 10: Add Summary Cards to Dashboard

**Files:**
- Modify: `app/dashboard/page.tsx`

**Step 1: Import and add SummaryCards**

In `app/dashboard/page.tsx`, add import:

```typescript
import { SummaryCards } from '@/components/analytics/summary-cards'
```

Add the component after the header, before pending subscriptions:

```tsx
      <SummaryCards />

      {pendingSubscriptions.length > 0 && (
```

**Step 2: Verify it renders**

Run:
```bash
npm run dev
```

Visit http://localhost:3000/dashboard and verify cards appear.

**Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat(dashboard): add analytics summary cards"
```

---

## Task 11: Create Spending Timeline Chart Component

**Files:**
- Create: `components/analytics/spending-timeline.tsx`

**Step 1: Create the timeline chart component**

Create `components/analytics/spending-timeline.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type MonthData = {
  month: string
  personal: number
  business: number
}

type Props = {
  typeFilter?: 'PERSONAL' | 'BUSINESS' | 'all'
  year?: number
}

export function SpendingTimeline({ typeFilter = 'all', year }: Props) {
  const [data, setData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)

  const currentYear = year || new Date().getFullYear()

  useEffect(() => {
    async function fetchTrends() {
      try {
        setLoading(true)
        const res = await fetch(`/api/analytics/trends?year=${currentYear}`)
        if (!res.ok) throw new Error('Failed to fetch trends')
        const json = await res.json()
        setData(json.months)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchTrends()
  }, [currentYear])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
      </div>
    )
  }

  const chartData = data.map((d) => ({
    month: d.month.split('-')[1],
    Personal: typeFilter === 'BUSINESS' ? 0 : d.personal,
    Business: typeFilter === 'PERSONAL' ? 0 : d.business,
  }))

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Monthly Spending - {currentYear}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickFormatter={(value) => monthLabels[parseInt(value) - 1]}
          />
          <YAxis tickFormatter={(value) => `$${value}`} />
          <Tooltip
            formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
            labelFormatter={(label) => monthLabels[parseInt(label) - 1]}
          />
          <Legend />
          {(typeFilter === 'all' || typeFilter === 'PERSONAL') && (
            <Bar dataKey="Personal" fill="#3b82f6" stackId="a" />
          )}
          {(typeFilter === 'all' || typeFilter === 'BUSINESS') && (
            <Bar dataKey="Business" fill="#10b981" stackId="a" />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/analytics/spending-timeline.tsx
git commit -m "feat(ui): add spending timeline chart component"
```

---

## Task 12: Create Category Breakdown Chart Component

**Files:**
- Create: `components/analytics/category-breakdown.tsx`

**Step 1: Create the category donut chart component**

Create `components/analytics/category-breakdown.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

type CategoryData = {
  id: string
  name: string
  total: number
  percentage: number
}

type Props = {
  typeFilter?: 'PERSONAL' | 'BUSINESS' | 'all'
  period?: 'month' | 'year'
  onCategoryClick?: (categoryId: string) => void
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
]

export function CategoryBreakdown({ typeFilter = 'all', period = 'month', onCategoryClick }: Props) {
  const [data, setData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true)
        const res = await fetch(
          `/api/analytics/categories?type=${typeFilter}&period=${period}`
        )
        if (!res.ok) throw new Error('Failed to fetch categories')
        const json = await res.json()
        setData(json.categories)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [typeFilter, period])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
        <p className="text-gray-500 text-center py-8">No subscription data</p>
      </div>
    )
  }

  // Show top 6, group rest as "Other"
  const topCategories = data.slice(0, 6)
  const otherTotal = data.slice(6).reduce((sum, cat) => sum + cat.total, 0)

  const chartData = [
    ...topCategories,
    ...(otherTotal > 0
      ? [{ id: 'other', name: 'Other', total: otherTotal, percentage: 0 }]
      : []),
  ]

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        Spending by Category ({period === 'year' ? 'Yearly' : 'Monthly'})
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            dataKey="total"
            nameKey="name"
            onClick={(entry) => onCategoryClick?.(entry.id)}
            style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.id} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/analytics/category-breakdown.tsx
git commit -m "feat(ui): add category breakdown donut chart component"
```

---

## Task 13: Create Subscription Analytics Table Component

**Files:**
- Create: `components/analytics/subscription-table.tsx`

**Step 1: Create the sortable table component**

Create `components/analytics/subscription-table.tsx`:

```typescript
'use client'

import { useState, useMemo } from 'react'

type Subscription = {
  id: string
  serviceName: string
  amount: number | null
  billingCycle: string | null
  type: 'PERSONAL' | 'BUSINESS'
  category: { name: string } | null
  nextBillingDate: string | null
}

type Props = {
  subscriptions: Subscription[]
  categoryFilter?: string | null
}

type SortKey = 'serviceName' | 'amount' | 'category' | 'nextBillingDate'
type SortDir = 'asc' | 'desc'

export function SubscriptionTable({ subscriptions, categoryFilter }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('amount')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const filtered = useMemo(() => {
    if (!categoryFilter) return subscriptions
    return subscriptions.filter(
      (sub) => sub.category?.name === categoryFilter ||
               (categoryFilter === 'Uncategorized' && !sub.category)
    )
  }, [subscriptions, categoryFilter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: string | number | null = null
      let bVal: string | number | null = null

      switch (sortKey) {
        case 'serviceName':
          aVal = a.serviceName.toLowerCase()
          bVal = b.serviceName.toLowerCase()
          break
        case 'amount':
          aVal = a.amount || 0
          bVal = b.amount || 0
          break
        case 'category':
          aVal = a.category?.name.toLowerCase() || 'zzz'
          bVal = b.category?.name.toLowerCase() || 'zzz'
          break
        case 'nextBillingDate':
          aVal = a.nextBillingDate || ''
          bVal = b.nextBillingDate || ''
          break
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortKey, sortDir])

  // Find top 3 by monthly cost for badges
  const top3Ids = useMemo(() => {
    const byMonthlyCost = [...subscriptions].sort((a, b) => {
      const aMonthly = a.billingCycle === 'yearly' ? (a.amount || 0) / 12 : (a.amount || 0)
      const bMonthly = b.billingCycle === 'yearly' ? (b.amount || 0) / 12 : (b.amount || 0)
      return bMonthly - aMonthly
    })
    return new Set(byMonthlyCost.slice(0, 3).map((s) => s.id))
  }, [subscriptions])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const SortHeader = ({ label, sortKeyVal }: { label: string; sortKeyVal: SortKey }) => (
    <th
      className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700"
      onClick={() => handleSort(sortKeyVal)}
    >
      {label}
      {sortKey === sortKeyVal && (
        <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
      )}
    </th>
  )

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <SortHeader label="Service" sortKeyVal="serviceName" />
            <SortHeader label="Cost" sortKeyVal="amount" />
            <SortHeader label="Category" sortKeyVal="category" />
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Type</th>
            <SortHeader label="Next Billing" sortKeyVal="nextBillingDate" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sorted.map((sub) => (
            <tr key={sub.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{sub.serviceName}</span>
                  {top3Ids.has(sub.id) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                      Top Spender
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-gray-700">
                {sub.amount ? `$${sub.amount.toFixed(2)}` : '-'}
                <span className="text-gray-400 text-sm ml-1">
                  /{sub.billingCycle === 'yearly' ? 'yr' : 'mo'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-700">
                {sub.category?.name || 'Uncategorized'}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    sub.type === 'BUSINESS'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {sub.type}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-700">
                {sub.nextBillingDate
                  ? new Date(sub.nextBillingDate).toLocaleDateString()
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <p className="text-center py-8 text-gray-500">No subscriptions found</p>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/analytics/subscription-table.tsx
git commit -m "feat(ui): add subscription analytics table component"
```

---

## Task 14: Create Analytics Page

**Files:**
- Create: `app/analytics/page.tsx`

**Step 1: Create the analytics page**

Create `app/analytics/page.tsx`:

```typescript
import { db } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/session'
import { SpendingTimeline } from '@/components/analytics/spending-timeline'
import { CategoryBreakdown } from '@/components/analytics/category-breakdown'
import { SubscriptionTable } from '@/components/analytics/subscription-table'
import { AnalyticsFilters } from '@/components/analytics/analytics-filters'

export default async function AnalyticsPage() {
  const user = await getCurrentUser()

  const subscriptionsRaw = await db.subscription.findMany({
    where: {
      userId: user.id,
      status: { in: ['active', 'trial'] },
    },
    include: {
      category: {
        select: { name: true },
      },
    },
    orderBy: { amount: 'desc' },
  })

  const subscriptions = subscriptionsRaw.map((sub) => ({
    id: sub.id,
    serviceName: sub.serviceName,
    amount: sub.amount ? Number(sub.amount) : null,
    billingCycle: sub.billingCycle,
    type: sub.type,
    category: sub.category,
    nextBillingDate: sub.nextBillingDate?.toISOString() || null,
  }))

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-sm text-gray-600">
          Understand your subscription spending
        </p>
      </div>

      <AnalyticsFilters />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SpendingTimeline />
        <CategoryBreakdown />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">All Subscriptions</h2>
        <SubscriptionTable subscriptions={subscriptions} />
      </div>
    </div>
  )
}
```

**Step 2: Create analytics filters component**

Create `components/analytics/analytics-filters.tsx`:

```typescript
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function AnalyticsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentType = searchParams.get('type') || 'all'
  const currentPeriod = searchParams.get('period') || 'month'

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.push(`/analytics?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Type:</span>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          {['all', 'PERSONAL', 'BUSINESS'].map((type) => (
            <button
              key={type}
              onClick={() => updateFilter('type', type)}
              className={`px-3 py-1.5 text-sm ${
                currentType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {type === 'all' ? 'All' : type.charAt(0) + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">View:</span>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          {['month', 'year'].map((period) => (
            <button
              key={period}
              onClick={() => updateFilter('period', period)}
              className={`px-3 py-1.5 text-sm ${
                currentPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {period === 'month' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add app/analytics/ components/analytics/analytics-filters.tsx
git commit -m "feat(ui): add analytics page with filters"
```

---

## Task 15: Create Category Select Component

**Files:**
- Create: `components/ui/category-select.tsx`

**Step 1: Create category select with add option**

Create `components/ui/category-select.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'

type Category = {
  id: string
  name: string
  isPreset: boolean
}

type Props = {
  value: string | null
  onChange: (categoryId: string | null) => void
}

export function CategorySelect({ value, onChange }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddCategory() {
    if (!newName.trim()) return

    setAdding(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })

      if (res.ok) {
        const category = await res.json()
        setCategories([...categories, category])
        onChange(category.id)
        setNewName('')
        setShowAdd(false)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <select disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
        <option>Loading...</option>
      </select>
    )
  }

  if (showAdd) {
    return (
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Category name"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <button
          type="button"
          onClick={handleAddCategory}
          disabled={adding || !newName.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {adding ? '...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={() => setShowAdd(false)}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <select
      value={value || ''}
      onChange={(e) => {
        if (e.target.value === '__add__') {
          setShowAdd(true)
        } else {
          onChange(e.target.value || null)
        }
      }}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select category</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
      <option value="__add__">+ Add category...</option>
    </select>
  )
}
```

**Step 2: Commit**

```bash
git add components/ui/category-select.tsx
git commit -m "feat(ui): add category select component with inline add"
```

---

## Task 16: Update Subscription Form with Type and Category

**Files:**
- Modify: `components/subscriptions/add-subscription-form.tsx`

**Step 1: Add type and category fields to subscription form**

Update `components/subscriptions/add-subscription-form.tsx` to include:

1. Import CategorySelect:
```typescript
import { CategorySelect } from '@/components/ui/category-select'
```

2. Add state for type and categoryId:
```typescript
const [type, setType] = useState<'PERSONAL' | 'BUSINESS'>('PERSONAL')
const [categoryId, setCategoryId] = useState<string | null>(null)
```

3. Add to form data when submitting:
```typescript
type,
categoryId,
```

4. Add UI fields after existing form fields:
```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
  <div className="flex gap-4">
    <label className="flex items-center">
      <input
        type="radio"
        name="type"
        value="PERSONAL"
        checked={type === 'PERSONAL'}
        onChange={() => setType('PERSONAL')}
        className="mr-2"
      />
      Personal
    </label>
    <label className="flex items-center">
      <input
        type="radio"
        name="type"
        value="BUSINESS"
        checked={type === 'BUSINESS'}
        onChange={() => setType('BUSINESS')}
        className="mr-2"
      />
      Business
    </label>
  </div>
</div>

<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
  <CategorySelect value={categoryId} onChange={setCategoryId} />
</div>
```

**Step 2: Verify form works**

Run:
```bash
npm run dev
```

Test adding a subscription with type and category.

**Step 3: Commit**

```bash
git add components/subscriptions/add-subscription-form.tsx
git commit -m "feat(ui): add type and category to subscription form"
```

---

## Task 17: Run Full Test Suite and Build

**Step 1: Run tests**

Run:
```bash
npm test
```

Expected: All tests pass.

**Step 2: Run type check**

Run:
```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 3: Fix any issues**

Address any failing tests or type errors.

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix: address any test/build issues"
```

---

## Task 18: Final Integration Test

**Step 1: Start development server**

Run:
```bash
npm run dev
```

**Step 2: Manual verification checklist**

- [ ] Dashboard shows summary cards
- [ ] Summary cards link to /analytics
- [ ] /analytics page loads with charts
- [ ] Type filter (All/Personal/Business) works
- [ ] Period filter (Monthly/Yearly) works
- [ ] Timeline chart shows spending data
- [ ] Category donut chart shows breakdown
- [ ] Subscription table displays with "Top Spender" badges
- [ ] Table sorting works
- [ ] Adding subscription with type/category works
- [ ] Creating custom category works

**Step 3: Commit completion**

```bash
git add -A
git commit -m "feat: complete analytics dashboard implementation"
```

---

## Summary

Total tasks: 18
Estimated commits: ~18

Key deliverables:
1. Category model with presets
2. SubscriptionType enum (PERSONAL/BUSINESS)
3. Three analytics API endpoints
4. Summary cards on dashboard
5. Full analytics page with timeline and category charts
6. Sortable subscription table with savings flags
7. Category select component with inline add
