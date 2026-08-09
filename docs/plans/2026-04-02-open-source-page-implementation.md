# Open Source Money Savers Page — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/dashboard/open-source` page that shows all open source alternatives grouped by category, highlights matches against the user's subscriptions, adds a dashboard widget teaser, and provides a "thinking of buying?" search panel with DB + AI fallback.

**Architecture:** Server component fetches all `openSourceAlternative` DB records + user's active subscription names, cross-references them. Client component handles the search panel (POST to new `/api/open-source/search`). Navigation gets a new "Open Source" link. Dashboard gets a small teaser widget. No new DB tables — AI search results are ephemeral.

**Tech Stack:** Next.js App Router (server + client components), Prisma, Anthropic SDK (`claude-haiku-4-5-20251001`), Tailwind CSS, Lucide icons.

---

### Task 1: Search API route

**Files:**
- Create: `src/app/api/open-source/search/route.ts`

**Context:** The existing `openSourceAlternative` Prisma model has fields: `id`, `serviceName`, `alternativeName`, `description`, `websiteUrl`, `sourceCodeUrl`, `stars`, `license`, `category`. The existing AI pattern uses `new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })` and `client.messages.create({ model: 'claude-haiku-4-5-20251001', ... })`. Auth uses `await auth()` from `@/lib/auth`.

**Step 1: Create the file**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { serviceName, monthlyPrice } = await req.json()
  if (!serviceName || typeof serviceName !== 'string') {
    return NextResponse.json({ error: 'serviceName required' }, { status: 400 })
  }

  const yearlySaving = monthlyPrice ? Math.round(Number(monthlyPrice) * 12) : null

  // Step 1: DB lookup (case-insensitive)
  const dbResults = await db.openSourceAlternative.findMany({
    where: {
      serviceName: {
        mode: 'insensitive',
        contains: serviceName.trim(),
      },
    },
    orderBy: { stars: 'desc' },
  })

  if (dbResults.length > 0) {
    return NextResponse.json({ alternatives: dbResults, source: 'db', yearlySaving })
  }

  // Step 2: AI fallback
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: `Suggest up to 3 open source alternatives to "${serviceName}". For each, reply with a JSON array (no markdown, just raw JSON) with objects containing these exact keys: alternativeName, description (1 sentence), websiteUrl, sourceCodeUrl (GitHub URL), stars (estimated GitHub stars as integer), license (e.g. MIT, GPL-2.0), category (e.g. Productivity, Design, Communication). Only include actively maintained projects.`,
        },
      ],
    })

    const text = (message.content[0] as { type: string; text: string }).text.trim()
    const parsed = JSON.parse(text)
    const alternatives = (Array.isArray(parsed) ? parsed : []).map((a: Record<string, unknown>, i: number) => ({
      id: `ai-${i}`,
      serviceName,
      alternativeName: String(a.alternativeName || ''),
      description: String(a.description || ''),
      websiteUrl: a.websiteUrl ? String(a.websiteUrl) : null,
      sourceCodeUrl: a.sourceCodeUrl ? String(a.sourceCodeUrl) : null,
      stars: Number(a.stars) || 0,
      license: a.license ? String(a.license) : null,
      category: a.category ? String(a.category) : null,
    }))

    return NextResponse.json({ alternatives, source: 'ai', yearlySaving })
  } catch {
    return NextResponse.json({ alternatives: [], source: 'ai', yearlySaving })
  }
}
```

**Step 2: Commit**

```bash
cd /opt/docker/subscription
git add src/app/api/open-source/search/route.ts
git commit -m "feat: add open-source search API with DB lookup and AI fallback"
```

---

### Task 2: Open Source page (server component)

**Files:**
- Create: `src/app/dashboard/open-source/page.tsx`

**Context:** Server components use `await getCurrentUser()` from `@/lib/session` and `db` from `@/lib/db/client`. The `openSourceAlternative` model's `category` field groups alternatives. Active subscription names come from `db.subscription.findMany({ where: { userId, status: 'active' } })`.

**Step 1: Create the page**

```typescript
import { db } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/session'
import { OpenSourcePageClient } from '@/components/open-source/open-source-page-client'

export const metadata = {
  title: 'Open Source Alternatives — Subscription Incinerator',
  description: 'Save money by switching to free open source tools',
}

export default async function OpenSourcePage() {
  const user = await getCurrentUser()

  // Fetch all alternatives grouped by category
  const allAlternatives = await db.openSourceAlternative.findMany({
    orderBy: [{ category: 'asc' }, { stars: 'desc' }],
  })

  // Get user's active subscription service names for matching
  const activeSubs = await db.subscription.findMany({
    where: { userId: user.id, status: { in: ['active', 'trial'] } },
    select: { serviceName: true },
  })
  const userServiceNames = new Set(
    activeSubs.map(s => s.serviceName.toLowerCase())
  )

  // Group by category
  const grouped: Record<string, typeof allAlternatives> = {}
  for (const alt of allAlternatives) {
    const cat = alt.category || 'Other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(alt)
  }

  // Mark which categories have matched user subscriptions
  const matchedServiceNames = new Set<string>()
  for (const alt of allAlternatives) {
    if (userServiceNames.has(alt.serviceName.toLowerCase())) {
      matchedServiceNames.add(alt.serviceName)
    }
  }

  return (
    <OpenSourcePageClient
      grouped={grouped}
      matchedServiceNames={Array.from(matchedServiceNames)}
    />
  )
}
```

**Step 2: Commit**

```bash
git add src/app/dashboard/open-source/page.tsx
git commit -m "feat: add open-source page server component"
```

---

### Task 3: Open Source page client component

**Files:**
- Create: `src/components/open-source/open-source-page-client.tsx`

**Context:** The existing `Alternative` type shape from `open-source-alternatives.tsx`: `{ id, alternativeName, description, websiteUrl, sourceCodeUrl, stars, license, category }`. Reuse the card rendering style from that component. Dark mode classes: `dark:bg-gray-900`, `dark:text-white`, `dark:border-gray-700`. Lucide icons used: `Leaf`, `Star`, `ExternalLink`, `Code2`, `Search`, `Sparkles`.

**Step 1: Create the component**

```typescript
'use client'

import { useState } from 'react'
import { Leaf, Star, ExternalLink, Code2, Search, Sparkles } from 'lucide-react'

type Alternative = {
  id: string
  serviceName: string
  alternativeName: string
  description: string
  websiteUrl: string | null
  sourceCodeUrl: string | null
  stars: number
  license: string | null
  category: string | null
}

type Props = {
  grouped: Record<string, Alternative[]>
  matchedServiceNames: string[]
}

function formatStars(stars: number): string {
  return stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars.toString()
}

function AlternativeCard({ alt, isMatched, yearlySaving, isAI }: {
  alt: Alternative
  isMatched: boolean
  yearlySaving?: number | null
  isAI?: boolean
}) {
  return (
    <div className={`border rounded-lg p-4 ${
      isMatched
        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
        : 'border-emerald-100 dark:border-gray-700 bg-emerald-50/50 dark:bg-gray-800'
    }`}>
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-gray-900 dark:text-white">
            {alt.alternativeName}
          </span>
          {alt.stars > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-amber-600">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {formatStars(alt.stars)}
            </span>
          )}
          {alt.license && (
            <span className="px-1.5 py-0.5 text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded font-medium">
              {alt.license}
            </span>
          )}
          {isMatched && (
            <span className="px-1.5 py-0.5 text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 rounded font-medium">
              You have {alt.serviceName}
            </span>
          )}
          {isAI && (
            <span className="px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 rounded font-medium flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" /> AI suggestion
            </span>
          )}
        </div>
        {yearlySaving && yearlySaving > 0 && (
          <span className="text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
            Save ~${yearlySaving}/yr
          </span>
        )}
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5">{alt.description}</p>
      <div className="flex items-center gap-3 mt-2">
        {alt.websiteUrl && (
          <a href={alt.websiteUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 hover:underline">
            <ExternalLink className="h-3 w-3" /> Website
          </a>
        )}
        {alt.sourceCodeUrl && (
          <a href={alt.sourceCodeUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 hover:underline">
            <Code2 className="h-3 w-3" /> Source
          </a>
        )}
      </div>
    </div>
  )
}

export function OpenSourcePageClient({ grouped, matchedServiceNames }: Props) {
  const [query, setQuery] = useState('')
  const [monthlyPrice, setMonthlyPrice] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Alternative[] | null>(null)
  const [searchSource, setSearchSource] = useState<'db' | 'ai' | null>(null)
  const [yearlySaving, setYearlySaving] = useState<number | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)

  const matchedSet = new Set(matchedServiceNames.map(n => n.toLowerCase()))

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setIsSearching(true)
    setSearchError(null)
    setSearchResults(null)
    try {
      const res = await fetch('/api/open-source/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: query.trim(),
          monthlyPrice: monthlyPrice ? parseFloat(monthlyPrice) : undefined,
        }),
      })
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setSearchResults(data.alternatives)
      setSearchSource(data.source)
      setYearlySaving(data.yearlySaving)
    } catch {
      setSearchError('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  // Sort categories: matched first, then alphabetical
  const categories = Object.keys(grouped).sort((a, b) => {
    const aMatched = grouped[a].some(alt => matchedSet.has(alt.serviceName.toLowerCase()))
    const bMatched = grouped[b].some(alt => matchedSet.has(alt.serviceName.toLowerCase()))
    if (aMatched && !bMatched) return -1
    if (!aMatched && bMatched) return 1
    return a.localeCompare(b)
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Leaf className="h-8 w-8 text-emerald-500" />
          Open Source Alternatives
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Switch to these free open source tools and keep more money in your pocket.
          Many are self-hostable or have generous free tiers.
        </p>
      </div>

      {/* Search panel */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
          Thinking of subscribing to something?
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Enter the service name and we'll find free alternatives before you spend a penny.
        </p>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. Notion, Figma, Slack..."
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
          <div className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={monthlyPrice}
              onChange={e => setMonthlyPrice(e.target.value)}
              placeholder="0.00"
              className="w-20 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none"
            />
            <span className="text-gray-400 text-xs">/mo</span>
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Search className="h-4 w-4" />
            {isSearching ? 'Searching...' : 'Find alternatives'}
          </button>
        </form>

        {searchError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{searchError}</p>
        )}

        {searchResults !== null && (
          <div className="mt-4">
            {searchResults.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No open source alternatives found for &ldquo;{query}&rdquo;.
              </p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {searchResults.length} alternative{searchResults.length !== 1 ? 's' : ''} found for &ldquo;{query}&rdquo;
                  {yearlySaving && yearlySaving > 0 ? ` — switch and save up to $${yearlySaving}/yr` : ''}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map(alt => (
                    <AlternativeCard
                      key={alt.id}
                      alt={alt}
                      isMatched={false}
                      yearlySaving={yearlySaving}
                      isAI={searchSource === 'ai'}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Category sections */}
      {categories.map(category => {
        const alts = grouped[category]
        const hasMatch = alts.some(alt => matchedSet.has(alt.serviceName.toLowerCase()))
        return (
          <div key={category}>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              {category}
              {hasMatch && (
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400 normal-case tracking-normal">
                  — you have a subscription here
                </span>
              )}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {alts.map(alt => (
                <AlternativeCard
                  key={alt.id}
                  alt={alt}
                  isMatched={matchedSet.has(alt.serviceName.toLowerCase())}
                />
              ))}
            </div>
          </div>
        )
      })}

      {categories.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No alternatives in the database yet. Use the search above to find options with AI.
        </p>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/open-source/open-source-page-client.tsx
git commit -m "feat: add open-source page client component with search panel and category grid"
```

---

### Task 4: Add nav link

**Files:**
- Modify: `src/components/navigation/index.tsx:69-86`

**Context:** The desktop nav links are in the `hidden md:flex` div. The pattern for each link is:
```tsx
<Link
  href="/dashboard"
  className={`text-sm font-medium transition-colors ${
    pathname === '/dashboard' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
  }`}
>
  Dashboard
</Link>
```

**Step 1: Add the nav link after the existing Import link (around line 85)**

Add this block after the Import `<Link>` closing tag:

```tsx
<Link
  href="/dashboard/open-source"
  className={`text-sm font-medium transition-colors ${
    pathname === '/dashboard/open-source' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
  }`}
>
  Open Source
</Link>
```

**Step 2: Add to mobile nav** — in the mobile nav section (the `md:hidden` div at the bottom), add another link entry following the same pattern as Dashboard and Import.

**Step 3: Commit**

```bash
git add src/components/navigation/index.tsx
git commit -m "feat: add Open Source link to navigation"
```

---

### Task 5: Dashboard teaser widget

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Context:** The page already fetches `db.subscription.findMany` for subscriptions and `db.openSourceAlternative` is available via `db`. Add a server-side count of how many of the user's active subscriptions have open source alternatives, then render a teaser widget.

**Step 1: Add the count query** — after the existing `savingsGoals` fetch block, add:

```typescript
// Count subscriptions that have open source alternatives
const activeSubNames = subscriptions
  .filter(s => s.status === 'active' || s.status === 'trial')
  .map(s => s.serviceName)

const matchedAltsCount = await db.openSourceAlternative.count({
  where: {
    serviceName: { in: activeSubNames },
  },
})
// Deduplicate: count unique service names matched, not total alternatives
const matchedSubCount = activeSubNames.filter(async () => true).length > 0
  ? (await db.openSourceAlternative.findMany({
      where: { serviceName: { in: activeSubNames } },
      select: { serviceName: true },
      distinct: ['serviceName'],
    })).length
  : 0
```

**Note:** The above is two queries — simplify to one by using `distinct`:

```typescript
const matchedSubs = await db.openSourceAlternative.findMany({
  where: { serviceName: { in: activeSubNames } },
  select: { serviceName: true },
  distinct: ['serviceName'],
})
const matchedSubCount = matchedSubs.length
```

**Step 2: Add the widget** — in the JSX, after the `<SavingsGoals />` block and before the `<AddSubscriptionForm />` block, add:

```tsx
{/* Open Source Teaser */}
{matchedSubCount > 0 && (
  <div className="mb-8">
    <Link
      href="/dashboard/open-source"
      className="block bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌿</span>
          <div>
            <p className="font-semibold text-emerald-900 dark:text-emerald-300 text-sm">
              {matchedSubCount} of your subscription{matchedSubCount !== 1 ? 's have' : ' has'} a free open source alternative
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-0.5">
              Click to explore free replacements and save money
            </p>
          </div>
        </div>
        <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium group-hover:underline">
          View all →
        </span>
      </div>
    </Link>
  </div>
)}
```

**Step 3: Add the Link import** — `Link` is already imported at the top of the file.

**Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add open source teaser widget to dashboard"
```

---

### Task 6: Build and deploy

**Step 1: Build**

```bash
cd /opt/docker/subscription
docker compose build web worker
```

Expected: build succeeds with no TypeScript errors.

**Step 2: If build fails**, read the error carefully. Common issues:
- Missing `await` on async db calls
- Type mismatch on `Alternative` fields — check that `serviceName` is included in the type (the DB model has it, the existing `Alternative` type in `open-source-alternatives.tsx` does not — you may need to add it to the local type in the client component)

**Step 3: Deploy**

```bash
docker compose up -d --force-recreate web worker
```

**Step 4: Verify**
- Visit `/dashboard/open-source` — page loads, shows categories
- If user has Netflix/Spotify/etc., the category shows "you have a subscription here"
- Search for "Notion" — returns results
- Search for "something obscure" — AI fallback kicks in with "AI suggestion" label
- Dashboard widget shows if user has matched subscriptions
- Nav shows "Open Source" link
