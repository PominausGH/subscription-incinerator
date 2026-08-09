# Stripe Integration Design

**Date:** 2026-01-14
**Status:** Ready for implementation
**Estimated Effort:** 2-3 days

## Overview

Minimal Stripe integration for Subscription Incinerator to enable premium tier monetization.

### Pricing Model
- **Free tier:** Manual subscription entry, single reminder (24h), basic dashboard
- **Premium tier:** $10/month - Gmail scanning, bank import, full analytics, multiple reminders

### Approach
- Monthly billing only (no annual)
- Manual cancellation (users email to cancel)
- Stripe hosted checkout (no custom payment forms)
- Webhook-driven tier updates

---

## Section 1: User Flow

```
User clicks "Upgrade" → API creates Checkout Session →
Redirect to Stripe hosted checkout → User pays →
Stripe sends webhook → Update user tier to "premium"
```

**What Stripe handles:**
- Payment form & card validation
- Recurring billing each month
- Failed payment retries
- Receipt emails
- PCI compliance

**What we build:**
1. One API route to create checkout sessions
2. One webhook handler for payment events
3. Feature gating logic (check `user.tier`)
4. "Upgrade" button in UI

---

## Section 2: API Routes & Database

### Database Changes
None needed. Schema already has:
```prisma
model User {
  tier              String?   // 'free' or 'premium'
  stripeCustomerId  String?   // Store Stripe customer ID
}
```

### API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/stripe/checkout` | Creates checkout session, returns URL |
| `POST /api/stripe/webhook` | Receives Stripe events, updates user tier |

### Checkout Route Logic (`/api/stripe/checkout/route.ts`)
```typescript
import { stripe } from '@/lib/stripe'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db/client'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  // Create or retrieve Stripe customer
  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id }
    })
    customerId = customer.id
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId }
    })
  }

  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{
      price: process.env.STRIPE_PRICE_ID,
      quantity: 1
    }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
  })

  return Response.json({ url: checkoutSession.url })
}
```

### Webhook Route Logic (`/api/stripe/webhook/route.ts`)
```typescript
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db/client'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      await prisma.user.update({
        where: { stripeCustomerId: session.customer },
        data: { tier: 'premium' }
      })
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      await prisma.user.update({
        where: { stripeCustomerId: subscription.customer },
        data: { tier: 'free' }
      })
      break
    }
  }

  return Response.json({ received: true })
}

// Disable body parsing for webhook signature verification
export const config = {
  api: { bodyParser: false }
}
```

### Stripe Client (`/lib/stripe.ts`)
```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})
```

### Environment Variables
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
```

---

## Section 3: Feature Gating

### Helper Function
```typescript
// lib/auth.ts (add this)
export function isPremium(user: { tier?: string | null }): boolean {
  return user?.tier === 'premium'
}
```

### API Route Gating Pattern
```typescript
// At the top of premium API routes
import { isPremium } from '@/lib/auth'

const user = await getCurrentUser()

if (!isPremium(user)) {
  return Response.json(
    { error: 'Premium subscription required' },
    { status: 403 }
  )
}
```

### Routes to Gate

| Route | Gating |
|-------|--------|
| `/api/email/scan` | Full block - 403 for free users |
| `/api/bank-import` | Full block - 403 for free users |
| `/api/analytics/summary` | Return limited data for free users |

### Reminder Gating
```typescript
// In lib/notifications/schedule-reminders.ts
const reminderOffsets = isPremium(user)
  ? [24 * 60, 3 * 60, 1 * 60]  // 24h, 3h, 1h in minutes
  : [24 * 60]                   // 24h only for free users
```

### UI Gating Pattern
```typescript
// In dashboard or settings
{isPremium(user) ? (
  <GmailConnectionCard />
) : (
  <UpgradePrompt feature="Gmail scanning" />
)}
```

---

## Section 4: UI Components

### 1. Upgrade Button
```typescript
// components/upgrade-button.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function UpgradeButton() {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <Button onClick={handleUpgrade} disabled={loading}>
      {loading ? 'Loading...' : 'Upgrade to Premium - $10/mo'}
    </Button>
  )
}
```

### 2. Upgrade Prompt
```typescript
// components/upgrade-prompt.tsx
import { UpgradeButton } from './upgrade-button'
import { Lock } from 'lucide-react'

interface UpgradePromptProps {
  feature: string
  description: string
}

export function UpgradePrompt({ feature, description }: UpgradePromptProps) {
  return (
    <div className="border rounded-lg p-6 bg-muted/50">
      <div className="flex items-center gap-2 mb-2">
        <Lock className="h-5 w-5" />
        <h3 className="font-semibold">{feature}</h3>
      </div>
      <p className="text-muted-foreground mb-4">{description}</p>
      <UpgradeButton />
    </div>
  )
}
```

### 3. Success State
When user returns to `/dashboard?upgraded=true`:
```typescript
// In dashboard page
'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export function UpgradeSuccessToast() {
  const searchParams = useSearchParams()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      setShow(true)
      // Remove query param from URL
      window.history.replaceState({}, '', '/dashboard')
      // Auto-dismiss after 5 seconds
      setTimeout(() => setShow(false), 5000)
    }
  }, [searchParams])

  if (!show) return null

  return (
    <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg">
      <h4 className="font-semibold">Welcome to Premium!</h4>
      <p className="text-sm">You now have access to all features.</p>
    </div>
  )
}
```

### 4. UI Placement

| Location | What to add |
|----------|-------------|
| Navbar | Upgrade button (free users only) |
| Settings page | Current plan display, upgrade button |
| Dashboard | Upgrade prompts replacing gated sections |
| Gmail card | Lock icon + upgrade prompt if free |
| Bank import page | Redirect to upgrade if free |

---

## Section 5: Implementation Checklist

### One-time Stripe Dashboard Setup
- [ ] Create Product: "Subscription Incinerator Premium"
- [ ] Create Price: $10/month recurring, USD
- [ ] Copy the Price ID (starts with `price_`)
- [ ] Get API keys from Developers → API keys
- [ ] Set up webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
- [ ] Select events: `checkout.session.completed`, `customer.subscription.deleted`
- [ ] Copy webhook signing secret (starts with `whsec_`)

### Environment Variables
- [ ] Add `STRIPE_SECRET_KEY` to `.env.local`
- [ ] Add `STRIPE_WEBHOOK_SECRET` to `.env.local`
- [ ] Add `STRIPE_PRICE_ID` to `.env.local`
- [ ] Add same variables to production environment

### Backend Implementation
- [ ] Install Stripe SDK: `npm install stripe`
- [ ] Create `lib/stripe.ts` client
- [ ] Create `/api/stripe/checkout/route.ts`
- [ ] Create `/api/stripe/webhook/route.ts`
- [ ] Add `isPremium()` helper to `lib/auth.ts`
- [ ] Gate `/api/email/scan` route
- [ ] Gate `/api/bank-import` route
- [ ] Gate `/api/analytics/summary` (return limited data for free)
- [ ] Update `schedule-reminders.ts` for tier-based reminder times

### Frontend Implementation
- [ ] Create `components/upgrade-button.tsx`
- [ ] Create `components/upgrade-prompt.tsx`
- [ ] Create `components/upgrade-success-toast.tsx`
- [ ] Add upgrade button to navbar (free users)
- [ ] Add upgrade prompts to dashboard for gated features
- [ ] Handle `?upgraded=true` success state on dashboard
- [ ] Gate settings page Gmail section with upgrade prompt

### Testing
- [ ] Test checkout flow with Stripe test mode
- [ ] Test webhook with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] Verify tier updates after successful payment
- [ ] Verify feature gating works for free users
- [ ] Test upgrade prompts display correctly

### Go Live
- [ ] Switch to live Stripe keys
- [ ] Update webhook endpoint to production URL
- [ ] Test one real payment (refund yourself after)

---

## Order of Implementation

1. Stripe dashboard setup + env vars (30 min)
2. `lib/stripe.ts` client (10 min)
3. Checkout route (30 min)
4. Webhook route (45 min)
5. `isPremium()` helper (10 min)
6. Feature gating on API routes (1 hour)
7. UI components (2 hours)
8. Testing with Stripe CLI (1-2 hours)
9. Production deployment (30 min)

**Total: 2-3 days**

---

## Future Enhancements (Not in Scope)

- Stripe Customer Portal for self-service cancellation
- Annual billing option with discount
- Multiple pricing tiers
- Free trial period
- Usage-based billing
- Invoice history in app
