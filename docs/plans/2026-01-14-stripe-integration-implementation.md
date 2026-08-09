# Stripe Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Stripe subscription payments to enable premium tier monetization ($10/month).

**Architecture:** Stripe hosted checkout with webhook-driven tier updates. No custom payment forms - Stripe handles all payment UI, PCI compliance, and recurring billing. We store `stripeCustomerId` on User and update `tier` based on webhook events.

**Tech Stack:** Stripe SDK, Next.js API routes, Prisma

---

## Task 1: Install Stripe SDK

**Files:**
- Modify: `package.json`

**Step 1: Install stripe package**

Run: `npm install stripe`

**Step 2: Verify installation**

Run: `npm ls stripe`
Expected: `stripe@17.x.x` or similar

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install stripe sdk"
```

---

## Task 2: Create Stripe Client

**Files:**
- Create: `lib/stripe.ts`
- Test: `__tests__/lib/stripe.test.ts`

**Step 1: Write the test**

Create `__tests__/lib/stripe.test.ts`:

```typescript
import { stripe } from '@/lib/stripe'

describe('Stripe Client', () => {
  it('should export a configured stripe instance', () => {
    expect(stripe).toBeDefined()
    expect(typeof stripe.customers).toBe('object')
    expect(typeof stripe.checkout).toBe('object')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/lib/stripe.test.ts`
Expected: FAIL with "Cannot find module '@/lib/stripe'"

**Step 3: Write minimal implementation**

Create `lib/stripe.ts`:

```typescript
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
})
```

**Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/lib/stripe.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/stripe.ts __tests__/lib/stripe.test.ts
git commit -m "feat(stripe): add stripe client"
```

---

## Task 3: Add isPremium Helper

**Files:**
- Modify: `lib/auth.ts`
- Test: `__tests__/lib/auth.test.ts`

**Step 1: Write the test**

Create `__tests__/lib/auth.test.ts`:

```typescript
import { isPremium } from '@/lib/auth'

describe('isPremium', () => {
  it('should return true for premium users', () => {
    expect(isPremium({ tier: 'premium' })).toBe(true)
  })

  it('should return false for free users', () => {
    expect(isPremium({ tier: 'free' })).toBe(false)
  })

  it('should return false for null tier', () => {
    expect(isPremium({ tier: null })).toBe(false)
  })

  it('should return false for undefined tier', () => {
    expect(isPremium({})).toBe(false)
  })

  it('should return false for null user', () => {
    expect(isPremium(null)).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/lib/auth.test.ts`
Expected: FAIL with "isPremium is not a function" or similar

**Step 3: Write minimal implementation**

Add to end of `lib/auth.ts`:

```typescript
export function isPremium(user: { tier?: string | null } | null): boolean {
  return user?.tier === 'premium'
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/lib/auth.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/auth.ts __tests__/lib/auth.test.ts
git commit -m "feat(auth): add isPremium helper function"
```

---

## Task 4: Create Checkout API Route

**Files:**
- Create: `app/api/stripe/checkout/route.ts`

**Step 1: Create the route**

Create `app/api/stripe/checkout/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { stripe } from '@/lib/stripe'

export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, stripeCustomerId: true, tier: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.tier === 'premium') {
      return NextResponse.json(
        { error: 'Already subscribed to premium' },
        { status: 400 }
      )
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      })
      customerId = customer.id
      await db.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      })
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Checkout session error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
```

**Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors (or unrelated errors)

**Step 3: Commit**

```bash
git add app/api/stripe/checkout/route.ts
git commit -m "feat(stripe): add checkout session api route"
```

---

## Task 5: Create Webhook API Route

**Files:**
- Create: `app/api/stripe/webhook/route.ts`

**Step 1: Create the route**

Create `app/api/stripe/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.customer && session.mode === 'subscription') {
          await db.user.update({
            where: { stripeCustomerId: session.customer as string },
            data: { tier: 'premium' },
          })
          console.log(`User upgraded to premium: ${session.customer}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        if (subscription.customer) {
          await db.user.update({
            where: { stripeCustomerId: subscription.customer as string },
            data: { tier: 'free' },
          })
          console.log(`User downgraded to free: ${subscription.customer}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`Payment failed for customer: ${invoice.customer}`)
        // Could send email notification here
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
```

**Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors (or unrelated errors)

**Step 3: Commit**

```bash
git add app/api/stripe/webhook/route.ts
git commit -m "feat(stripe): add webhook handler for subscription events"
```

---

## Task 6: Add Feature Gating to Email Scan Route

**Files:**
- Modify: `app/api/email/scan/route.ts`

**Step 1: Add premium check**

Modify `app/api/email/scan/route.ts` - add import and check after auth:

Add import at top:
```typescript
import { auth, isPremium } from '@/lib/auth'
```

Add check after getting session (after line 13):
```typescript
    // Check premium tier
    if (!isPremium({ tier: session.user.tier })) {
      return NextResponse.json(
        { error: 'Premium subscription required for email scanning' },
        { status: 403 }
      )
    }
```

**Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/api/email/scan/route.ts
git commit -m "feat(stripe): gate email scanning to premium users"
```

---

## Task 7: Add Feature Gating to Bank Import Route

**Files:**
- Modify: `app/api/bank-import/route.ts`

**Step 1: Read current file**

Read `app/api/bank-import/route.ts` to understand structure.

**Step 2: Add premium check**

Add import:
```typescript
import { isPremium } from '@/lib/auth'
```

Add check after session validation:
```typescript
    // Check premium tier
    if (!isPremium({ tier: session.user.tier })) {
      return NextResponse.json(
        { error: 'Premium subscription required for bank import' },
        { status: 403 }
      )
    }
```

**Step 3: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add app/api/bank-import/route.ts
git commit -m "feat(stripe): gate bank import to premium users"
```

---

## Task 8: Create Upgrade Button Component

**Files:**
- Create: `components/upgrade-button.tsx`

**Step 1: Create the component**

Create `components/upgrade-button.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

interface UpgradeButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function UpgradeButton({
  variant = 'default',
  size = 'default',
  className,
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No checkout URL returned:', data.error)
        setLoading(false)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleUpgrade}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      <Sparkles className="h-4 w-4 mr-2" />
      {loading ? 'Loading...' : 'Upgrade to Premium'}
    </Button>
  )
}
```

**Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/upgrade-button.tsx
git commit -m "feat(stripe): add upgrade button component"
```

---

## Task 9: Create Upgrade Prompt Component

**Files:**
- Create: `components/upgrade-prompt.tsx`

**Step 1: Create the component**

Create `components/upgrade-prompt.tsx`:

```typescript
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
        <Lock className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">{feature}</h3>
      </div>
      <p className="text-muted-foreground mb-4">{description}</p>
      <UpgradeButton />
    </div>
  )
}
```

**Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/upgrade-prompt.tsx
git commit -m "feat(stripe): add upgrade prompt component"
```

---

## Task 10: Create Upgrade Success Toast Component

**Files:**
- Create: `components/upgrade-success-toast.tsx`

**Step 1: Create the component**

Create `components/upgrade-success-toast.tsx`:

```typescript
'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CheckCircle, X } from 'lucide-react'

export function UpgradeSuccessToast() {
  const searchParams = useSearchParams()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      setShow(true)
      // Remove query param from URL
      window.history.replaceState({}, '', '/dashboard')
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setShow(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  if (!show) return null

  return (
    <div className="fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg flex items-start gap-3 z-50">
      <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="font-semibold">Welcome to Premium!</h4>
        <p className="text-sm text-green-100">
          You now have access to all features.
        </p>
      </div>
      <button
        onClick={() => setShow(false)}
        className="text-green-200 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
```

**Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/upgrade-success-toast.tsx
git commit -m "feat(stripe): add upgrade success toast component"
```

---

## Task 11: Add Upgrade Button to Navbar

**Files:**
- Modify: `components/dashboard/navbar.tsx`

**Step 1: Update navbar**

Modify `components/dashboard/navbar.tsx`:

Add import at top:
```typescript
import { UpgradeButton } from '@/components/upgrade-button'
```

Update props interface and component:
```typescript
export function Navbar({ userEmail, userTier }: { userEmail: string; userTier: string }) {
```

Add upgrade button in the actions section (before the email span):
```typescript
          <div className="flex items-center space-x-4">
            {userTier !== 'premium' && (
              <UpgradeButton variant="outline" size="sm" />
            )}
            <span className="text-sm text-gray-600 hidden sm:inline">{userEmail}</span>
```

**Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: Errors about missing userTier prop (expected, will fix in dashboard)

**Step 3: Commit**

```bash
git add components/dashboard/navbar.tsx
git commit -m "feat(stripe): add upgrade button to navbar for free users"
```

---

## Task 12: Update Dashboard to Pass User Tier

**Files:**
- Modify: `app/dashboard/page.tsx`

**Step 1: Read current dashboard**

Read `app/dashboard/page.tsx` to understand structure.

**Step 2: Update dashboard to pass tier to Navbar**

Find where Navbar is rendered and add userTier prop:
```typescript
<Navbar userEmail={session.user.email!} userTier={session.user.tier} />
```

**Step 3: Add UpgradeSuccessToast**

Add import:
```typescript
import { UpgradeSuccessToast } from '@/components/upgrade-success-toast'
```

Add component (inside Suspense for searchParams):
```typescript
<Suspense fallback={null}>
  <UpgradeSuccessToast />
</Suspense>
```

**Step 4: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat(stripe): integrate upgrade toast and pass tier to navbar"
```

---

## Task 13: Add Upgrade Prompts for Gated Features

**Files:**
- Modify: `components/settings/gmail-connection-card.tsx`

**Step 1: Read current component**

Read `components/settings/gmail-connection-card.tsx` to understand structure.

**Step 2: Add conditional rendering**

Wrap the component content to show UpgradePrompt for free users:

Add import:
```typescript
import { UpgradePrompt } from '@/components/upgrade-prompt'
```

Add prop and conditional:
```typescript
interface GmailConnectionCardProps {
  // ... existing props
  userTier: string
}

export function GmailConnectionCard({ ..., userTier }: GmailConnectionCardProps) {
  if (userTier !== 'premium') {
    return (
      <UpgradePrompt
        feature="Gmail Scanning"
        description="Automatically detect subscriptions from your Gmail inbox. Upgrade to premium to unlock this feature."
      />
    )
  }

  // ... existing component content
}
```

**Step 3: Update settings page to pass tier**

Update the settings page to pass `userTier` to GmailConnectionCard.

**Step 4: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add components/settings/gmail-connection-card.tsx app/settings/page.tsx
git commit -m "feat(stripe): gate gmail connection card to premium users"
```

---

## Task 14: Update Environment Variables

**Files:**
- Modify: `.env.example`

**Step 1: Add Stripe variables to example**

Add to `.env.example`:

```bash
# Stripe (for premium subscriptions)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add stripe environment variables to example"
```

---

## Task 15: Test Integration Manually

**Step 1: Set up environment variables**

Add to `.env.local`:
- `STRIPE_SECRET_KEY` - from Stripe dashboard (use test key)
- `STRIPE_WEBHOOK_SECRET` - will get from Stripe CLI
- `STRIPE_PRICE_ID` - create test product/price in Stripe dashboard

**Step 2: Start Stripe CLI webhook forwarding**

Run: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
Copy the webhook signing secret and add to `.env.local`

**Step 3: Start dev server**

Run: `npm run dev`

**Step 4: Test checkout flow**

1. Log in as a free user
2. Click "Upgrade to Premium" button
3. Complete Stripe test checkout (card: 4242 4242 4242 4242)
4. Verify redirect back with success toast
5. Verify user tier updated in database

**Step 5: Test webhook**

Check Stripe CLI output for successful webhook delivery.

**Step 6: Test feature gating**

1. As free user, verify email scan returns 403
2. After upgrade, verify email scan works
3. Test bank import gating similarly

---

## Task 16: Run Full Test Suite

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address test/build issues"
```

---

## Environment Variables Summary

Add these to `.env.local` for development:

```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_ID=price_xxxxx
```

For production, add the same variables with live keys.

---

## Stripe Dashboard Setup (Manual Steps)

1. Create Product: "Subscription Incinerator Premium"
2. Create Price: $10/month recurring, USD
3. Copy the Price ID (starts with `price_`)
4. Set up webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
5. Select events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`
6. Copy webhook signing secret

---

## Files Created/Modified Summary

**Created:**
- `lib/stripe.ts`
- `__tests__/lib/stripe.test.ts`
- `__tests__/lib/auth.test.ts`
- `app/api/stripe/checkout/route.ts`
- `app/api/stripe/webhook/route.ts`
- `components/upgrade-button.tsx`
- `components/upgrade-prompt.tsx`
- `components/upgrade-success-toast.tsx`

**Modified:**
- `lib/auth.ts` (add isPremium)
- `app/api/email/scan/route.ts` (add premium check)
- `app/api/bank-import/route.ts` (add premium check)
- `components/dashboard/navbar.tsx` (add upgrade button)
- `app/dashboard/page.tsx` (pass tier, add toast)
- `components/settings/gmail-connection-card.tsx` (gate to premium)
- `.env.example` (add Stripe vars)
