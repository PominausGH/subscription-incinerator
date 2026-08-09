# Open Source Money Savers Page — Design

**Goal:** Add a dedicated `/dashboard/open-source` page that shows open source alternatives grouped by category, highlights matches against the user's actual subscriptions, and lets users search for alternatives before buying a new paid tool.

**Architecture:** Reuses the existing `openSourceAlternative` DB table and `OpenSourceAlternatives` component. No new data model needed. Server-side page fetches all alternatives + user subscriptions, cross-references them. A search panel at the top calls the DB first, falls back to Claude AI if no match found.

**Tech Stack:** Next.js App Router (server component for data, client component for search), Prisma, existing `claude-haiku` pattern, Tailwind CSS.

---

## Components

### 1. Page — `/app/dashboard/open-source/page.tsx` (server component)
- Fetches all `openSourceAlternative` records, grouped by `category`
- Fetches user's active subscriptions (just `serviceName`)
- Builds a set of matched service names for badge rendering
- Passes data to client components

### 2. `OpenSourcePage` client component
- Renders the "Thinking of buying?" search panel at the top
- Renders categories in order: matched categories first, then alphabetical
- Each category shows a section heading + alternative cards

### 3. Alternative card
- Reuses existing card style from `OpenSourceAlternatives` component
- Adds "You have this" badge when user's subscription matches
- Adds "Save ~$X/yr" banner when coming from the search panel with a price entered

### 4. "Thinking of buying?" search panel
- Inputs: service name (text), monthly cost (number, optional)
- On submit: POST to `/api/open-source/search`
- Shows alternatives inline below the form
- Results from DB show immediately; AI fallback shows with "AI suggestion" label

### 5. Dashboard widget (in `page.tsx`)
- Small card showing: "💡 N of your subscriptions have open source alternatives"
- Links to `/dashboard/open-source`
- N calculated server-side by intersecting subscription names with `openSourceAlternative` service names

### 6. Nav link
- Add "Open Source" to the navigation in `components/navigation/index.tsx`

---

## API

### `POST /api/open-source/search`
- Body: `{ serviceName: string, monthlyPrice?: number }`
- Step 1: query `openSourceAlternative` where `serviceName` ilike input
- Step 2: if empty, call Claude to suggest alternatives (returns same shape)
- Returns: `{ alternatives: Alternative[], source: 'db' | 'ai', yearlySaving?: number }`

---

## Data Flow

```
Page load:
  server → db.openSourceAlternative.findMany()
  server → db.subscription.findMany({ where: { userId, status: 'active' } })
  server → group alternatives by category
  server → mark matched services
  → render page with pre-matched data

Search panel:
  user types → POST /api/open-source/search
  → DB lookup (case-insensitive)
  → if empty → Claude haiku fallback
  → return alternatives + yearly saving estimate
  → render inline result cards
```

---

## Key Decisions
- **No new DB table** — AI-generated search results are not persisted, shown inline only
- **Money saved = monthlyPrice × 12** — simple, shown only when user enters a price
- **Matched categories float to top** — user sees relevant alternatives first
- **"AI suggestion" label** on Claude-generated results so users know it's not curated data
