# Analytics Dashboard Design

## Overview

Add an analytics dashboard to help users understand their subscription spending and identify savings opportunities. Features monthly/yearly views, personal/business segmentation, and visual breakdowns by category.

## Goals

- Personal insight: help users understand where their money goes
- Spot savings opportunities via simple flags on highest-cost subscriptions
- Clean separation of personal vs business subscriptions

## Data Model Changes

### New Category Table

```prisma
model Category {
  id        String   @id @default(cuid())
  name      String
  userId    String?  // null for preset categories
  isPreset  Boolean  @default(false)
  user      User?    @relation(fields: [userId], references: [id])
  subscriptions Subscription[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Subscription Model Changes

```prisma
model Subscription {
  // ... existing fields
  type       SubscriptionType @default(PERSONAL)
  categoryId String?
  category   Category? @relation(fields: [categoryId], references: [id])
}

enum SubscriptionType {
  PERSONAL
  BUSINESS
}
```

### Preset Categories (Seeded)

- Entertainment
- Software
- Utilities
- Health & Fitness
- Finance
- Education
- Food & Delivery
- Other

### Migration Strategy

1. Add fields as optional
2. Existing subscriptions default to PERSONAL type
3. Existing subscriptions get "Other" category
4. Users recategorize via subscription edit form

## Dashboard Summary Cards

Location: Main dashboard page, above subscription list

### Cards

| Card | Content |
|------|---------|
| Monthly Total | Current month spend + % change from last month |
| Yearly Total | Year-to-date spend |
| Subscription Count | Active count, split by Personal/Business |
| Top Spender | Highest cost subscription (savings flag) |

### Behavior

- Personal/Business toggle filters all cards
- Cards link to `/analytics` for details
- Single API call fetches all summary data

## Analytics Page (`/analytics`)

### Header

- Personal / Business / All toggle
- Month / Year view switcher

### Layout

- Two-column on desktop (charts side by side)
- Stacked on mobile

### Timeline Chart (Left/Top)

- Bar chart showing monthly spend for the year
- Stacked bars for "All" view (Personal + Business colors)
- Hover tooltip shows exact amounts

### Category Breakdown (Right/Bottom)

- Donut chart with legend
- Top 5-6 categories displayed
- Remaining grouped as "Other"
- Click category to filter subscription table

### Subscription Table (Below Charts)

- Columns: Name, Cost, Category, Type, Renewal Date
- Sortable by any column
- "Highest cost" badge on top 3 subscriptions
- Filterable by category click from donut chart

## API Endpoints

### GET `/api/analytics/summary`

Returns dashboard summary card data.

**Query params:**
- `type`: `personal` | `business` | `all`

**Response:**
```json
{
  "monthlyTotal": 125.99,
  "monthlyChange": -5.2,
  "yearlyTotal": 1450.00,
  "subscriptionCount": { "personal": 8, "business": 3 },
  "topSpender": { "id": "...", "name": "Adobe CC", "cost": 54.99 }
}
```

### GET `/api/analytics/trends`

Returns monthly spend data for timeline chart.

**Query params:**
- `type`: `personal` | `business` | `all`
- `year`: number (e.g., 2026)

**Response:**
```json
{
  "months": [
    { "month": "2026-01", "personal": 89.99, "business": 45.00 },
    { "month": "2026-02", "personal": 95.99, "business": 45.00 }
  ]
}
```

### GET `/api/analytics/categories`

Returns spend breakdown by category.

**Query params:**
- `type`: `personal` | `business` | `all`
- `period`: `month` | `year`
- `date`: ISO date string

**Response:**
```json
{
  "categories": [
    { "id": "...", "name": "Software", "total": 120.00, "percentage": 35.5 },
    { "id": "...", "name": "Entertainment", "total": 85.00, "percentage": 25.1 }
  ]
}
```

## Category Management

### Custom Categories

- Created from subscription edit form
- "+ Add category" option in category dropdown
- Simple modal with name field only
- User-scoped (only visible to creator)
- Deletable when no subscriptions reference it

### Subscription Form Changes

- Add "Type" field: radio buttons for Personal / Business
- Add "Category" field: dropdown with presets + custom categories
- "+ Add category" option at bottom of dropdown opens modal

No separate category management page - keeps it simple.

## Technical Implementation

### Dependencies

- `recharts` - React charting library (~45kb gzipped)

### New Components

| Component | Purpose |
|-----------|---------|
| `components/analytics/SummaryCards.tsx` | Dashboard summary cards |
| `components/analytics/SpendingTimeline.tsx` | Monthly bar chart |
| `components/analytics/CategoryBreakdown.tsx` | Donut chart |
| `components/analytics/SubscriptionTable.tsx` | Sortable data table |
| `components/ui/CategorySelect.tsx` | Dropdown with add category option |

### Pages

- `app/analytics/page.tsx` - Full analytics page
- Modify `app/dashboard/page.tsx` - Add summary cards section

### Database

- Migration: Create Category table
- Migration: Add type, categoryId to Subscription
- Seed: Insert preset categories

## Out of Scope (Future)

- Usage tracking for unused subscription detection
- Duplicate service detection
- Price comparison / alternative suggestions
- Custom date range selection
- Export to CSV/PDF
- Budget tracking / spending limits
