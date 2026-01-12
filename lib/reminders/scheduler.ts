import { db } from '@/lib/db/client'
import { queues } from '@/lib/queue/client'
import { Subscription } from '@prisma/client'

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
