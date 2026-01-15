import { db } from '@/lib/db/client'
import { queues } from '@/lib/queue/client'
import { Subscription, User, Prisma } from '@prisma/client'
import {
  NotificationPreferences,
  ReminderSettings,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/lib/notifications/types'

type SubscriptionWithUser = Subscription & {
  user: User
  reminderSettings?: Prisma.JsonValue | null
}

/**
 * Parse timing string to milliseconds
 * Supports formats like '7d', '1d', '24h', '1h', '12h', '3d', '14d'
 */
function parseTimingToMs(timing: string): number {
  const value = parseInt(timing)
  if (timing.endsWith('d')) return value * 24 * 60 * 60 * 1000
  if (timing.endsWith('h')) return value * 60 * 60 * 1000
  return 0
}

export async function scheduleTrialReminders(subscription: Subscription) {
  try {
    if (!subscription.trialEndsAt) {
      return
    }

    const trialEnd = new Date(subscription.trialEndsAt)
    const now = new Date()

    // Define reminder times: 24h, 3h, 1h before trial ends
    const reminderOffsets = [
      { hours: 24, type: '24 hours before' },
      { hours: 3, type: '3 hours before' },
      { hours: 1, type: '1 hour before' },
    ]

    for (const { hours, type } of reminderOffsets) {
      const scheduledFor = new Date(trialEnd.getTime() - hours * 60 * 60 * 1000)

      // Only schedule future reminders
      if (scheduledFor <= now) {
        console.log(`Skipping past reminder: ${type}`)
        continue
      }

      // Check if reminder already exists
      const existingReminder = await db.reminder.findFirst({
        where: {
          subscriptionId: subscription.id,
          reminderType: 'trial_ending',
          scheduledFor,
          status: 'pending',
        },
      })

      if (existingReminder) {
        console.log(`Reminder already exists: ${existingReminder.id}`)
        continue
      }

      // Create reminder record
      const reminder = await db.reminder.create({
        data: {
          subscriptionId: subscription.id,
          reminderType: 'trial_ending',
          scheduledFor,
          status: 'pending',
        },
      })

      // Calculate delay in milliseconds
      const delay = scheduledFor.getTime() - now.getTime()

      let job
      try {
        // Queue the job
        job = await queues.reminders.add(
          'send_reminder',
          { reminderId: reminder.id },
          { delay }
        )

        // Store job ID for potential cancellation
        await db.reminder.update({
          where: { id: reminder.id },
          data: { jobId: job.id },
        })
      } catch (error) {
        // If DB update failed, remove the orphaned job
        await job?.remove()
        throw error
      }

      console.log(`Scheduled reminder ${reminder.id} for ${scheduledFor.toISOString()}`)
    }
  } catch (error) {
    console.error(`Failed to schedule trial reminders for ${subscription.id}:`, error)
    throw error
  }
}

export async function scheduleBillingReminders(subscription: Subscription) {
  try {
    if (!subscription.nextBillingDate) {
      return
    }

    const billingDate = new Date(subscription.nextBillingDate)
    const now = new Date()

    // Define reminder times: 7 days, 24h before billing
    const reminderOffsets = [
      { days: 7, type: '7 days before' },
      { days: 1, type: '24 hours before' },
    ]

    for (const { days, type } of reminderOffsets) {
      const scheduledFor = new Date(billingDate.getTime() - days * 24 * 60 * 60 * 1000)

      // Only schedule future reminders
      if (scheduledFor <= now) {
        console.log(`Skipping past reminder: ${type}`)
        continue
      }

      // Check if reminder already exists
      const existingReminder = await db.reminder.findFirst({
        where: {
          subscriptionId: subscription.id,
          reminderType: 'billing_upcoming',
          scheduledFor,
          status: 'pending',
        },
      })

      if (existingReminder) {
        console.log(`Reminder already exists: ${existingReminder.id}`)
        continue
      }

      // Create reminder record
      const reminder = await db.reminder.create({
        data: {
          subscriptionId: subscription.id,
          reminderType: 'billing_upcoming',
          scheduledFor,
          status: 'pending',
        },
      })

      // Calculate delay in milliseconds
      const delay = scheduledFor.getTime() - now.getTime()

      let job
      try {
        // Queue the job
        job = await queues.reminders.add(
          'send_reminder',
          { reminderId: reminder.id },
          { delay }
        )

        // Store job ID
        await db.reminder.update({
          where: { id: reminder.id },
          data: { jobId: job.id },
        })
      } catch (error) {
        // If DB update failed, remove the orphaned job
        await job?.remove()
        throw error
      }

      console.log(`Scheduled reminder ${reminder.id} for ${scheduledFor.toISOString()}`)
    }
  } catch (error) {
    console.error(`Failed to schedule billing reminders for ${subscription.id}:`, error)
    throw error
  }
}

/**
 * Schedule reminders for a subscription based on user preferences
 * This is the unified scheduling function that respects both subscription-level
 * and user-level preferences.
 */
export async function scheduleReminders(subscription: SubscriptionWithUser) {
  try {
    // Get subscription-specific reminder settings
    const reminderSettings = subscription.reminderSettings as ReminderSettings | null

    // Check if reminders are disabled for this subscription
    if (reminderSettings?.enabled === false) {
      console.log(`Reminders disabled for subscription ${subscription.id}, skipping`)
      return
    }

    // Get user's notification preferences
    const userPrefs = subscription.user.notificationPreferences as NotificationPreferences | null
    const defaults = userPrefs?.defaults || DEFAULT_NOTIFICATION_PREFERENCES.defaults

    const now = new Date()

    // Handle trial reminders
    if (subscription.trialEndsAt) {
      const trialEnd = new Date(subscription.trialEndsAt)
      // Use subscription-specific timings if set, otherwise use user defaults
      const trialTimings = (reminderSettings?.timings as string[] | null) || defaults.trial

      for (const timing of trialTimings) {
        const offsetMs = parseTimingToMs(timing)
        if (offsetMs === 0) continue

        const scheduledFor = new Date(trialEnd.getTime() - offsetMs)

        // Only schedule future reminders
        if (scheduledFor <= now) {
          console.log(`Skipping past trial reminder: ${timing}`)
          continue
        }

        // Check if reminder already exists
        const existingReminder = await db.reminder.findFirst({
          where: {
            subscriptionId: subscription.id,
            reminderType: 'trial_ending',
            scheduledFor,
            status: 'pending',
          },
        })

        if (existingReminder) {
          console.log(`Trial reminder already exists: ${existingReminder.id}`)
          continue
        }

        // Create reminder record
        const reminder = await db.reminder.create({
          data: {
            subscriptionId: subscription.id,
            reminderType: 'trial_ending',
            scheduledFor,
            status: 'pending',
          },
        })

        // Calculate delay in milliseconds
        const delay = scheduledFor.getTime() - now.getTime()

        let job
        try {
          // Queue the job
          job = await queues.reminders.add(
            'send_reminder',
            { reminderId: reminder.id },
            { delay }
          )

          // Store job ID for potential cancellation
          await db.reminder.update({
            where: { id: reminder.id },
            data: { jobId: job.id },
          })
        } catch (error) {
          await job?.remove()
          throw error
        }

        console.log(`Scheduled trial reminder ${reminder.id} for ${scheduledFor.toISOString()}`)
      }
    }

    // Handle billing reminders
    if (subscription.nextBillingDate) {
      const billingDate = new Date(subscription.nextBillingDate)
      // Use subscription-specific timings if set, otherwise use user defaults
      const billingTimings = (reminderSettings?.timings as string[] | null) || defaults.billing

      for (const timing of billingTimings) {
        const offsetMs = parseTimingToMs(timing)
        if (offsetMs === 0) continue

        const scheduledFor = new Date(billingDate.getTime() - offsetMs)

        // Only schedule future reminders
        if (scheduledFor <= now) {
          console.log(`Skipping past billing reminder: ${timing}`)
          continue
        }

        // Check if reminder already exists
        const existingReminder = await db.reminder.findFirst({
          where: {
            subscriptionId: subscription.id,
            reminderType: 'billing_upcoming',
            scheduledFor,
            status: 'pending',
          },
        })

        if (existingReminder) {
          console.log(`Billing reminder already exists: ${existingReminder.id}`)
          continue
        }

        // Create reminder record
        const reminder = await db.reminder.create({
          data: {
            subscriptionId: subscription.id,
            reminderType: 'billing_upcoming',
            scheduledFor,
            status: 'pending',
          },
        })

        // Calculate delay in milliseconds
        const delay = scheduledFor.getTime() - now.getTime()

        let job
        try {
          // Queue the job
          job = await queues.reminders.add(
            'send_reminder',
            { reminderId: reminder.id },
            { delay }
          )

          // Store job ID
          await db.reminder.update({
            where: { id: reminder.id },
            data: { jobId: job.id },
          })
        } catch (error) {
          await job?.remove()
          throw error
        }

        console.log(`Scheduled billing reminder ${reminder.id} for ${scheduledFor.toISOString()}`)
      }
    }
  } catch (error) {
    console.error(`Failed to schedule reminders for ${subscription.id}:`, error)
    throw error
  }
}
