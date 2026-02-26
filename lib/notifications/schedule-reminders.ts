import { Subscription } from '@prisma/client'
import { reminderQueue } from '@/lib/queue/client'
import { db } from '@/lib/db/client'

export async function scheduleTrialReminders(subscription: Subscription) {
  if (!subscription.trialEndsAt) return

  const trialEnd = new Date(subscription.trialEndsAt)
  const now = new Date()

  const reminderTimes = [
    { offset: -24 * 60 * 60 * 1000, type: '24h' }, // 24 hours before
    { offset: -3 * 60 * 60 * 1000, type: '3h' },   // 3 hours before
    { offset: -1 * 60 * 60 * 1000, type: '1h' },   // 1 hour before
  ]

  for (const { offset, type } of reminderTimes) {
    const scheduledFor = new Date(trialEnd.getTime() + offset)

    // Only schedule future reminders
    if (scheduledFor > now) {
      const jobId = `reminder-trial-${subscription.id}-${type}`

      // Skip if a reminder with this jobId already exists and is pending
      const existing = await db.reminder.findFirst({
        where: { jobId, status: 'pending' },
      })
      if (existing) continue

      // Create the Reminder record in the database first
      const reminder = await db.reminder.create({
        data: {
          subscriptionId: subscription.id,
          reminderType: 'trial_ending',
          scheduledFor,
          jobId,
          status: 'pending',
        },
      })

      await reminderQueue.add(
        'send_reminder',
        {
          reminderId: reminder.id,
        },
        {
          delay: scheduledFor.getTime() - now.getTime(),
          jobId,
        }
      )
    }
  }
}

export async function scheduleBillingReminders(subscription: Subscription) {
  if (!subscription.nextBillingDate) return

  const billingDate = new Date(subscription.nextBillingDate)
  const now = new Date()

  const reminderTimes = [
    { offset: -7 * 24 * 60 * 60 * 1000, type: '7d' }, // 7 days before
    { offset: -24 * 60 * 60 * 1000, type: '24h' },    // 24 hours before
  ]

  for (const { offset, type } of reminderTimes) {
    const scheduledFor = new Date(billingDate.getTime() + offset)

    // Only schedule future reminders
    if (scheduledFor > now) {
      const jobId = `reminder-billing-${subscription.id}-${type}`

      // Skip if a reminder with this jobId already exists and is pending
      const existing = await db.reminder.findFirst({
        where: { jobId, status: 'pending' },
      })
      if (existing) continue

      // Create the Reminder record in the database first
      const reminder = await db.reminder.create({
        data: {
          subscriptionId: subscription.id,
          reminderType: 'billing_upcoming',
          scheduledFor,
          jobId,
          status: 'pending',
        },
      })

      await reminderQueue.add(
        'send_reminder',
        {
          reminderId: reminder.id,
        },
        {
          delay: scheduledFor.getTime() - now.getTime(),
          jobId,
        }
      )
    }
  }
}
