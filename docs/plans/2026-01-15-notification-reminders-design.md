# Notification Reminders Design

## Overview

Add notification reminders for upcoming subscription renewals with user-configurable settings and Web Push support.

## Goals

- Let users choose notification channels (email, browser push)
- Provide sensible default timing with per-subscription overrides
- Separate timing options for trials (urgent) vs billing (planning)
- Keep all reminder features free for all users

## Data Model

### User Preferences

Extend existing `notificationPreferences` JSON field on User:

```typescript
{
  channels: {
    email: true,
    push: true
  },
  defaults: {
    trial: ["24h", "1h"],        // options: 24h, 12h, 1h
    billing: ["7d", "1d"]        // options: 14d, 7d, 3d, 1d
  }
}
```

### Per-Subscription Overrides

Add `reminderSettings` JSON field to Subscription model:

```typescript
{
  enabled: true,                 // false = no reminders for this subscription
  timings: ["14d", "7d", "1d"]   // null = use global defaults
}
```

### Schema Change

```prisma
model Subscription {
  // ... existing fields
  reminderSettings Json? @map("reminder_settings")
}
```

## UI Design

### Global Settings (`/settings`)

New "Notification Preferences" section:

```
┌─────────────────────────────────────────────────────────┐
│ Notification Preferences                                │
├─────────────────────────────────────────────────────────┤
│ How would you like to be notified?                      │
│                                                         │
│ ☑ Email          ☑ Browser notifications                │
│                  [Enable] ← if not subscribed yet       │
│                                                         │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│ Trial ending reminders                                  │
│ ☑ 24 hours before   ☑ 12 hours before   ☐ 1 hour before│
│                                                         │
│ Billing reminders                                       │
│ ☑ 14 days before   ☑ 7 days before                     │
│ ☐ 3 days before    ☑ 1 day before                      │
│                                                         │
│                                      [Save Preferences] │
└─────────────────────────────────────────────────────────┘
```

### Per-Subscription Popover

Bell icon on subscription cards opens popover:

```
┌────────────────────────────────────┐
│ Reminders for Netflix         ✕    │
├────────────────────────────────────┤
│ ○ Use default settings             │
│   (7 days, 1 day before)           │
│                                    │
│ ○ Custom for this subscription     │
│   ☑ 14 days   ☑ 7 days            │
│   ☐ 3 days    ☑ 1 day             │
│                                    │
│ ○ No reminders                     │
└────────────────────────────────────┘
```

Behavior:
- Radio selection: default / custom / none
- Custom expands timing checkboxes
- Auto-saves on selection
- Bell icon shows slash when disabled
- Detects trial vs billing based on subscription dates

## Web Push Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │     │   Next.js    │     │   BullMQ     │
│              │     │   API        │     │   Worker     │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ Service      │◄────│ Push send    │◄────│ reminder-    │
│ Worker       │     │ logic        │     │ sender.ts    │
│              │     │              │     │              │
│ Push         │────►│ POST /api/   │────►│ PushSub-     │
│ Subscription │     │ push/sub     │     │ scription DB │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Push Subscription Flow

1. User clicks "Enable" for browser notifications
2. Browser requests notification permission
3. Generate VAPID subscription via Push API
4. POST to `/api/push/subscribe` to store in `PushSubscription` table
5. Toggle shows enabled state

### Environment Variables

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=   # for browser subscription
VAPID_PRIVATE_KEY=              # for sending push messages
```

## Scheduler Changes

Update `lib/reminders/scheduler.ts`:

```typescript
export async function scheduleReminders(subscription: Subscription & { user: User }) {
  const { user } = subscription
  const prefs = user.notificationPreferences as NotificationPreferences
  const subSettings = subscription.reminderSettings as ReminderSettings | null

  // Check if reminders disabled for this subscription
  if (subSettings?.enabled === false) return

  // Determine which timings to use
  const isTrialReminder = !!subscription.trialEndsAt
  const defaultTimings = isTrialReminder ? prefs.defaults.trial : prefs.defaults.billing
  const timings = subSettings?.timings ?? defaultTimings

  // Schedule a reminder for each selected timing
  for (const timing of timings) {
    const scheduledFor = calculateScheduledTime(subscription, timing)
    if (scheduledFor <= new Date()) continue

    await createAndQueueReminder(subscription.id, scheduledFor, isTrialReminder)
  }
}
```

### Reschedule Triggers

- User updates global notification preferences → reschedule all subscriptions using defaults
- User updates per-subscription settings → reschedule that subscription
- Subscription billing date changes → reschedule that subscription

Cancel stale reminders first using stored `jobId` to remove from BullMQ queue.

## Worker Changes

Update `workers/processors/reminder-sender.ts`:

```typescript
const prefs = user.notificationPreferences
const channelsUsed: string[] = []

if (prefs.channels.email) {
  await sendReminderEmail(reminder)
  channelsUsed.push('email')
}

if (prefs.channels.push) {
  await sendReminderPush(reminder)
  channelsUsed.push('push')
}

await db.reminder.update({
  where: { id: reminderId },
  data: { status: 'sent', sentAt: new Date(), channelsUsed }
})
```

## Files to Create

| File | Purpose |
|------|---------|
| `components/settings/notification-settings.tsx` | Global settings card |
| `components/subscriptions/reminder-popover.tsx` | Per-subscription popover |
| `public/sw.js` | Service worker for push |
| `lib/notifications/push.ts` | VAPID, subscribe, send |
| `app/api/push/subscribe/route.ts` | Store subscription |
| `app/api/push/unsubscribe/route.ts` | Remove subscription |
| `app/api/settings/notifications/route.ts` | Update preferences |

## Files to Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `reminderSettings` to Subscription |
| `app/settings/page.tsx` | Add notification settings section |
| `components/subscriptions/subscription-card.tsx` | Add bell icon |
| `lib/reminders/scheduler.ts` | Respect user preferences |
| `workers/processors/reminder-sender.ts` | Multi-channel sending |

## Premium Gating

None - all reminder features are free for all users.
