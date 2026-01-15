# Notification Reminders Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add user-configurable notification reminders for subscription renewals with email and Web Push support.

**Architecture:** Extend existing reminder infrastructure with user preferences stored in JSON fields. Global settings in `/settings` page, per-subscription overrides via popover on subscription cards. Web Push via service worker and VAPID keys.

**Tech Stack:** Next.js 14, Prisma, BullMQ, Resend (email), Web Push API, Radix UI (popover)

---

## Task 1: Add reminderSettings to Subscription Schema

**Files:**
- Modify: `prisma/schema.prisma:110-146`

**Step 1: Add the field**

Add `reminderSettings` JSON field to Subscription model after `bankTransactionData`:

```prisma
  bankTransactionData Json? @map("bank_transaction_data")
  reminderSettings    Json? @map("reminder_settings")
  externalId    String? @map("external_id")
```

**Step 2: Generate migration**

Run: `npx prisma migrate dev --name add-reminder-settings`
Expected: Migration created successfully

**Step 3: Verify schema**

Run: `npx prisma generate`
Expected: Prisma Client generated

**Step 4: Commit**

```bash
git add prisma/
git commit -m "feat(db): add reminderSettings field to Subscription"
```

---

## Task 2: Create TypeScript Types for Preferences

**Files:**
- Create: `lib/notifications/types.ts`

**Step 1: Create the types file**

```typescript
export type TrialTiming = '24h' | '12h' | '1h'
export type BillingTiming = '14d' | '7d' | '3d' | '1d'

export interface NotificationChannels {
  email: boolean
  push: boolean
}

export interface NotificationDefaults {
  trial: TrialTiming[]
  billing: BillingTiming[]
}

export interface NotificationPreferences {
  channels: NotificationChannels
  defaults: NotificationDefaults
}

export interface ReminderSettings {
  enabled: boolean
  timings: BillingTiming[] | TrialTiming[] | null
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  channels: {
    email: true,
    push: false,
  },
  defaults: {
    trial: ['24h', '1h'],
    billing: ['7d', '1d'],
  },
}

export const TRIAL_TIMING_OPTIONS: { value: TrialTiming; label: string }[] = [
  { value: '24h', label: '24 hours before' },
  { value: '12h', label: '12 hours before' },
  { value: '1h', label: '1 hour before' },
]

export const BILLING_TIMING_OPTIONS: { value: BillingTiming; label: string }[] = [
  { value: '14d', label: '14 days before' },
  { value: '7d', label: '7 days before' },
  { value: '3d', label: '3 days before' },
  { value: '1d', label: '1 day before' },
]
```

**Step 2: Commit**

```bash
git add lib/notifications/types.ts
git commit -m "feat: add notification preference types"
```

---

## Task 3: Create Notification Settings API Endpoint

**Files:**
- Create: `app/api/settings/notifications/route.ts`
- Test: `__tests__/api/settings/notifications.test.ts`

**Step 1: Write the failing test**

```typescript
import { GET, PUT } from '@/app/api/settings/notifications/route'
import { db } from '@/lib/db/client'
import { auth } from '@/lib/auth'
import { NextRequest } from 'next/server'

jest.mock('@/lib/auth')
jest.mock('@/lib/db/client', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockDb = db as jest.Mocked<typeof db>

describe('GET /api/settings/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 if not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const response = await GET()

    expect(response.status).toBe(401)
  })

  it('returns notification preferences for authenticated user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)
    mockDb.user.findUnique.mockResolvedValue({
      notificationPreferences: {
        channels: { email: true, push: false },
        defaults: { trial: ['24h'], billing: ['7d', '1d'] },
      },
    } as any)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.channels.email).toBe(true)
    expect(data.defaults.trial).toContain('24h')
  })
})

describe('PUT /api/settings/notifications', () => {
  it('updates notification preferences', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any)
    mockDb.user.update.mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost/api/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify({
        channels: { email: true, push: true },
        defaults: { trial: ['24h', '12h'], billing: ['14d', '7d'] },
      }),
    })

    const response = await PUT(request)

    expect(response.status).toBe(200)
    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        notificationPreferences: {
          channels: { email: true, push: true },
          defaults: { trial: ['24h', '12h'], billing: ['14d', '7d'] },
        },
      },
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/api/settings/notifications.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write the implementation**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/lib/notifications/types'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPreferences: true },
  })

  const preferences = (user?.notificationPreferences as NotificationPreferences) ||
    DEFAULT_NOTIFICATION_PREFERENCES

  return NextResponse.json(preferences)
}

export async function PUT(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const preferences: NotificationPreferences = {
    channels: {
      email: Boolean(body.channels?.email),
      push: Boolean(body.channels?.push),
    },
    defaults: {
      trial: body.defaults?.trial || ['24h', '1h'],
      billing: body.defaults?.billing || ['7d', '1d'],
    },
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { notificationPreferences: preferences },
  })

  return NextResponse.json({ success: true })
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/api/settings/notifications.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/settings/notifications/route.ts __tests__/api/settings/notifications.test.ts
git commit -m "feat(api): add notification settings endpoint"
```

---

## Task 4: Create Notification Settings UI Component

**Files:**
- Create: `components/settings/notification-settings.tsx`

**Step 1: Create the component**

```tsx
'use client'

import { useState, useEffect } from 'react'
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  TRIAL_TIMING_OPTIONS,
  BILLING_TIMING_OPTIONS,
  TrialTiming,
  BillingTiming,
} from '@/lib/notifications/types'

interface NotificationSettingsProps {
  initialPreferences?: NotificationPreferences
}

export function NotificationSettings({ initialPreferences }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    initialPreferences || DEFAULT_NOTIFICATION_PREFERENCES
  )
  const [saving, setSaving] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)

  useEffect(() => {
    setPushSupported('Notification' in window && 'serviceWorker' in navigator)
  }, [])

  const handleChannelToggle = (channel: 'email' | 'push') => {
    setPreferences((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: !prev.channels[channel],
      },
    }))
  }

  const handleTrialToggle = (timing: TrialTiming) => {
    setPreferences((prev) => ({
      ...prev,
      defaults: {
        ...prev.defaults,
        trial: prev.defaults.trial.includes(timing)
          ? prev.defaults.trial.filter((t) => t !== timing)
          : [...prev.defaults.trial, timing],
      },
    }))
  }

  const handleBillingToggle = (timing: BillingTiming) => {
    setPreferences((prev) => ({
      ...prev,
      defaults: {
        ...prev.defaults,
        billing: prev.defaults.billing.includes(timing)
          ? prev.defaults.billing.filter((t) => t !== timing)
          : [...prev.defaults.billing, timing],
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }
    } catch (error) {
      console.error('Failed to save notification preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          How would you like to be notified?
        </h3>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.channels.email}
              onChange={() => handleChannelToggle('email')}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Email</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.channels.push}
              onChange={() => handleChannelToggle('push')}
              disabled={!pushSupported}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 disabled:opacity-50"
            />
            <span className="text-sm text-gray-700">
              Browser notifications
              {!pushSupported && ' (not supported)'}
            </span>
          </label>
        </div>
      </div>

      <hr className="border-gray-200" />

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Trial ending reminders
        </h3>
        <div className="flex flex-wrap gap-4">
          {TRIAL_TIMING_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.defaults.trial.includes(option.value)}
                onChange={() => handleTrialToggle(option.value)}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Billing reminders
        </h3>
        <div className="flex flex-wrap gap-4">
          {BILLING_TIMING_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.defaults.billing.includes(option.value)}
                onChange={() => handleBillingToggle(option.value)}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/settings/notification-settings.tsx
git commit -m "feat(ui): add notification settings component"
```

---

## Task 5: Add Notification Settings to Settings Page

**Files:**
- Modify: `app/settings/page.tsx`

**Step 1: Update the settings page**

Add import at top:
```tsx
import { NotificationSettings } from '@/components/settings/notification-settings'
```

Add to user select query:
```tsx
    select: {
      email: true,
      emailProvider: true,
      oauthTokens: true,
      homeCurrency: true,
      notificationPreferences: true,  // Add this line
    },
```

Add new section after Currency section (before closing `</div>` of space-y-6):
```tsx
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
          <p className="text-gray-600 mb-6">
            Choose when and how you want to be reminded about upcoming renewals.
          </p>
          <NotificationSettings
            initialPreferences={user?.notificationPreferences as any}
          />
        </section>
```

**Step 2: Verify page loads**

Run: `npm run dev`
Navigate to: `http://localhost:3000/settings`
Expected: Notification Preferences section visible with checkboxes

**Step 3: Commit**

```bash
git add app/settings/page.tsx
git commit -m "feat(ui): add notification settings to settings page"
```

---

## Task 6: Create Reminder Popover Component

**Files:**
- Create: `components/subscriptions/reminder-popover.tsx`

**Step 1: Create the component**

```tsx
'use client'

import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Bell, BellOff, X } from 'lucide-react'
import {
  ReminderSettings,
  BILLING_TIMING_OPTIONS,
  TRIAL_TIMING_OPTIONS,
  BillingTiming,
  TrialTiming,
} from '@/lib/notifications/types'

interface ReminderPopoverProps {
  subscriptionId: string
  subscriptionName: string
  isTrialSubscription: boolean
  currentSettings: ReminderSettings | null
  defaultTimings: string[]
  onUpdate: (settings: ReminderSettings | null) => Promise<void>
}

type SettingsMode = 'default' | 'custom' | 'none'

export function ReminderPopover({
  subscriptionId,
  subscriptionName,
  isTrialSubscription,
  currentSettings,
  defaultTimings,
  onUpdate,
}: ReminderPopoverProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const getInitialMode = (): SettingsMode => {
    if (!currentSettings) return 'default'
    if (currentSettings.enabled === false) return 'none'
    if (currentSettings.timings) return 'custom'
    return 'default'
  }

  const [mode, setMode] = useState<SettingsMode>(getInitialMode())
  const [customTimings, setCustomTimings] = useState<string[]>(
    currentSettings?.timings || defaultTimings
  )

  const timingOptions = isTrialSubscription ? TRIAL_TIMING_OPTIONS : BILLING_TIMING_OPTIONS

  const handleModeChange = async (newMode: SettingsMode) => {
    setMode(newMode)
    setSaving(true)

    try {
      let settings: ReminderSettings | null = null

      switch (newMode) {
        case 'default':
          settings = { enabled: true, timings: null }
          break
        case 'custom':
          settings = { enabled: true, timings: customTimings as any }
          break
        case 'none':
          settings = { enabled: false, timings: null }
          break
      }

      await onUpdate(settings)
    } finally {
      setSaving(false)
    }
  }

  const handleTimingToggle = async (timing: string) => {
    const newTimings = customTimings.includes(timing)
      ? customTimings.filter((t) => t !== timing)
      : [...customTimings, timing]

    setCustomTimings(newTimings)

    if (mode === 'custom') {
      setSaving(true)
      try {
        await onUpdate({ enabled: true, timings: newTimings as any })
      } finally {
        setSaving(false)
      }
    }
  }

  const isDisabled = currentSettings?.enabled === false

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Reminder settings"
        >
          {isDisabled ? (
            <BellOff className="w-4 h-4" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="bg-white rounded-lg shadow-lg border border-gray-200 w-72 z-50"
          sideOffset={5}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 text-sm">
                Reminders for {subscriptionName}
              </h3>
              <Popover.Close asChild>
                <button className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </Popover.Close>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="reminderMode"
                  checked={mode === 'default'}
                  onChange={() => handleModeChange('default')}
                  disabled={saving}
                  className="mt-1 text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <span className="text-sm text-gray-700">Use default settings</span>
                  <p className="text-xs text-gray-500">
                    ({defaultTimings.join(', ')} before)
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="reminderMode"
                  checked={mode === 'custom'}
                  onChange={() => handleModeChange('custom')}
                  disabled={saving}
                  className="mt-1 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Custom for this subscription</span>
              </label>

              {mode === 'custom' && (
                <div className="ml-6 space-y-2">
                  {timingOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customTimings.includes(option.value)}
                        onChange={() => handleTimingToggle(option.value)}
                        disabled={saving}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-600">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="reminderMode"
                  checked={mode === 'none'}
                  onChange={() => handleModeChange('none')}
                  disabled={saving}
                  className="text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">No reminders</span>
              </label>
            </div>
          </div>

          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
```

**Step 2: Install Radix popover if needed**

Run: `npm install @radix-ui/react-popover`

**Step 3: Commit**

```bash
git add components/subscriptions/reminder-popover.tsx package.json package-lock.json
git commit -m "feat(ui): add reminder popover component"
```

---

## Task 7: Add Reminder Popover to Subscription Card

**Files:**
- Modify: `components/subscriptions/subscription-card.tsx`

**Step 1: Read the current file structure**

First examine the subscription card to understand its structure.

**Step 2: Add import**

```tsx
import { ReminderPopover } from './reminder-popover'
import { ReminderSettings } from '@/lib/notifications/types'
```

**Step 3: Add update handler**

Add function inside the component:
```tsx
  const handleReminderUpdate = async (settings: ReminderSettings | null) => {
    await fetch(`/api/subscriptions/${subscription.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderSettings: settings }),
    })
  }
```

**Step 4: Add popover to card header**

Add alongside edit/delete buttons:
```tsx
<ReminderPopover
  subscriptionId={subscription.id}
  subscriptionName={subscription.serviceName}
  isTrialSubscription={!!subscription.trialEndsAt}
  currentSettings={subscription.reminderSettings as ReminderSettings | null}
  defaultTimings={subscription.trialEndsAt ? ['24h', '1h'] : ['7d', '1d']}
  onUpdate={handleReminderUpdate}
/>
```

**Step 5: Commit**

```bash
git add components/subscriptions/subscription-card.tsx
git commit -m "feat(ui): add reminder popover to subscription card"
```

---

## Task 8: Update Subscription API for reminderSettings

**Files:**
- Modify: `app/api/subscriptions/[id]/route.ts`

**Step 1: Read current file to understand structure**

**Step 2: Add reminderSettings to PATCH handler**

In the PATCH handler, add `reminderSettings` to the allowed update fields and Prisma update:

```typescript
const { reminderSettings, ...otherFields } = await request.json()

// In the update call
await db.subscription.update({
  where: { id: params.id, userId: session.user.id },
  data: {
    ...otherFields,
    ...(reminderSettings !== undefined && { reminderSettings }),
  },
})
```

**Step 3: Commit**

```bash
git add app/api/subscriptions/[id]/route.ts
git commit -m "feat(api): support reminderSettings in subscription update"
```

---

## Task 9: Create Web Push Library

**Files:**
- Create: `lib/notifications/push.ts`

**Step 1: Install web-push**

Run: `npm install web-push`
Run: `npm install -D @types/web-push`

**Step 2: Create the library**

```typescript
import webpush from 'web-push'

// Configure VAPID
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    'mailto:support@subincinerator.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  url?: string
}

export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: PushPayload
): Promise<void> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
  } catch (error: any) {
    // Handle expired subscriptions
    if (error.statusCode === 410 || error.statusCode === 404) {
      throw new Error('SUBSCRIPTION_EXPIRED')
    }
    throw error
  }
}

export function generateVapidKeys() {
  return webpush.generateVAPIDKeys()
}
```

**Step 3: Commit**

```bash
git add lib/notifications/push.ts package.json package-lock.json
git commit -m "feat: add web push notification library"
```

---

## Task 10: Create Service Worker

**Files:**
- Create: `public/sw.js`

**Step 1: Create the service worker**

```javascript
self.addEventListener('push', function (event) {
  if (!event.data) return

  const data = event.data.json()

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: '/badge-72.png',
    data: {
      url: data.url || '/',
    },
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
```

**Step 2: Commit**

```bash
git add public/sw.js
git commit -m "feat: add push notification service worker"
```

---

## Task 11: Create Push Subscribe/Unsubscribe API

**Files:**
- Create: `app/api/push/subscribe/route.ts`
- Create: `app/api/push/unsubscribe/route.ts`

**Step 1: Create subscribe endpoint**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const subscription = await request.json()

  // Store the push subscription
  await db.pushSubscription.create({
    data: {
      userId: session.user.id,
      endpointData: subscription,
      active: true,
    },
  })

  return NextResponse.json({ success: true })
}
```

**Step 2: Create unsubscribe endpoint**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { endpoint } = await request.json()

  // Find and deactivate the subscription
  await db.pushSubscription.updateMany({
    where: {
      userId: session.user.id,
      endpointData: {
        path: ['endpoint'],
        equals: endpoint,
      },
    },
    data: { active: false },
  })

  return NextResponse.json({ success: true })
}
```

**Step 3: Commit**

```bash
git add app/api/push/subscribe/route.ts app/api/push/unsubscribe/route.ts
git commit -m "feat(api): add push subscribe/unsubscribe endpoints"
```

---

## Task 12: Add Push Enable Button to Notification Settings

**Files:**
- Modify: `components/settings/notification-settings.tsx`

**Step 1: Add push subscription logic**

Add these functions inside the component after the existing handlers:

```tsx
  const [pushEnabled, setPushEnabled] = useState(false)

  useEffect(() => {
    // Check if already subscribed
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setPushEnabled(!!subscription)
        })
      })
    }
  }, [])

  const handleEnablePush = async () => {
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Request permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        alert('Push notifications permission denied')
        return
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      setPushEnabled(true)
      handleChannelToggle('push')
    } catch (error) {
      console.error('Failed to enable push notifications:', error)
    }
  }
```

**Step 2: Update the push checkbox to show Enable button**

Replace the push checkbox label with:

```tsx
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    checked={preferences.channels.push}
    onChange={() => handleChannelToggle('push')}
    disabled={!pushSupported || !pushEnabled}
    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 disabled:opacity-50"
  />
  <span className="text-sm text-gray-700">Browser notifications</span>
  {pushSupported && !pushEnabled && (
    <button
      onClick={handleEnablePush}
      className="ml-2 text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
    >
      Enable
    </button>
  )}
  {!pushSupported && (
    <span className="text-xs text-gray-400">(not supported)</span>
  )}
</label>
```

**Step 3: Commit**

```bash
git add components/settings/notification-settings.tsx
git commit -m "feat(ui): add push notification enable button"
```

---

## Task 13: Update Scheduler to Respect Preferences

**Files:**
- Modify: `lib/reminders/scheduler.ts`
- Test: `__tests__/lib/reminders/scheduler.test.ts`

**Step 1: Write failing test for preference handling**

Add to existing test file:

```typescript
describe('scheduleReminders with preferences', () => {
  it('skips scheduling when subscription reminders are disabled', async () => {
    const subscription = {
      id: 'sub-1',
      nextBillingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      reminderSettings: { enabled: false, timings: null },
      user: {
        notificationPreferences: {
          channels: { email: true, push: false },
          defaults: { trial: ['24h'], billing: ['7d', '1d'] },
        },
      },
    }

    await scheduleReminders(subscription as any)

    expect(mockQueues.reminders.add).not.toHaveBeenCalled()
  })

  it('uses custom timings when set', async () => {
    const subscription = {
      id: 'sub-1',
      nextBillingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      reminderSettings: { enabled: true, timings: ['14d', '3d'] },
      user: {
        notificationPreferences: {
          channels: { email: true, push: false },
          defaults: { trial: ['24h'], billing: ['7d', '1d'] },
        },
      },
    }

    await scheduleReminders(subscription as any)

    // Should create 2 reminders for 14d and 3d, not the default 7d and 1d
    expect(mockDb.reminder.create).toHaveBeenCalledTimes(2)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/lib/reminders/scheduler.test.ts`
Expected: FAIL

**Step 3: Update scheduler implementation**

Refactor `lib/reminders/scheduler.ts` to add a unified `scheduleReminders` function that respects preferences. See design doc for implementation details.

**Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/lib/reminders/scheduler.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/reminders/scheduler.ts __tests__/lib/reminders/scheduler.test.ts
git commit -m "feat: update scheduler to respect user preferences"
```

---

## Task 14: Update Worker to Send Multi-Channel

**Files:**
- Modify: `workers/processors/reminder-sender.ts`

**Step 1: Add push sending capability**

Add import:
```typescript
import { sendPushNotification } from '@/lib/notifications/push'
```

**Step 2: Update processReminderJob**

Replace the try block content:

```typescript
try {
  await db.reminder.update({
    where: { id: reminderId },
    data: { status: 'processing' },
  })

  const prefs = reminder.subscription.user.notificationPreferences as NotificationPreferences
  const channelsUsed: string[] = []

  // Send email if enabled
  if (prefs?.channels?.email !== false) {
    await sendReminderEmail(reminder)
    channelsUsed.push('email')
  }

  // Send push if enabled
  if (prefs?.channels?.push) {
    const pushSubscriptions = await db.pushSubscription.findMany({
      where: { userId: reminder.subscription.user.id, active: true },
    })

    for (const sub of pushSubscriptions) {
      try {
        await sendPushNotification(sub.endpointData as any, {
          title: `Renewal Reminder: ${reminder.subscription.serviceName}`,
          body: `Your subscription renews soon`,
          url: '/dashboard',
        })
        if (!channelsUsed.includes('push')) {
          channelsUsed.push('push')
        }
      } catch (error: any) {
        if (error.message === 'SUBSCRIPTION_EXPIRED') {
          await db.pushSubscription.update({
            where: { id: sub.id },
            data: { active: false },
          })
        }
      }
    }
  }

  await db.reminder.update({
    where: { id: reminderId },
    data: {
      status: 'sent',
      sentAt: new Date(),
      channelsUsed,
    },
  })

  console.log(`Reminder ${reminderId} sent via: ${channelsUsed.join(', ')}`)
}
```

**Step 3: Commit**

```bash
git add workers/processors/reminder-sender.ts
git commit -m "feat(worker): send reminders via multiple channels"
```

---

## Task 15: Add Environment Variables to Example

**Files:**
- Modify: `.env.example`

**Step 1: Add VAPID keys**

```
# Push Notifications (generate with: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add VAPID environment variables to example"
```

---

## Task 16: Run Full Test Suite

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit any fixes if needed**

---

## Task 17: Final Integration Test

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Manual verification checklist**

- [ ] Navigate to /settings
- [ ] Notification Preferences section displays
- [ ] Channel checkboxes work
- [ ] Timing checkboxes work
- [ ] Save button updates preferences
- [ ] Navigate to /dashboard
- [ ] Bell icon appears on subscription cards
- [ ] Clicking bell opens popover
- [ ] Popover radio buttons work
- [ ] Custom timing checkboxes work

**Step 3: Final commit if needed**

```bash
git add -A
git commit -m "fix: integration fixes for notification reminders"
```

---

## Summary

17 tasks covering:
- Database schema (1 task)
- TypeScript types (1 task)
- API endpoints (3 tasks)
- UI components (4 tasks)
- Web Push infrastructure (3 tasks)
- Scheduler/Worker updates (2 tasks)
- Environment/testing (3 tasks)
