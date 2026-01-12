import { Subscription } from '@prisma/client'
import { reminderQueue } from '@/lib/queue/client'

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
      await reminderQueue.add(
        'send_reminder',
        {
          subscriptionId: subscription.id,
          reminderType: 'trial_ending',
        },
        {
          delay: scheduledFor.getTime() - now.getTime(),
          jobId: `reminder-trial-${subscription.id}-${type}`,
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
      await reminderQueue.add(
        'send_reminder',
        {
          subscriptionId: subscription.id,
          reminderType: 'billing_upcoming',
        },
        {
          delay: scheduledFor.getTime() - now.getTime(),
          jobId: `reminder-billing-${subscription.id}-${type}`,
        }
      )
    }
  }
}
