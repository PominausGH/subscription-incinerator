import { Job } from 'bullmq'
import { db } from '@/lib/db/client'
import { SendReminderJob } from '@/lib/queue/jobs'
import { sendReminderEmail } from '@/lib/notifications/email'
import { sendPushNotification } from '@/lib/notifications/push'
import { NotificationPreferences } from '@/lib/notifications/types'

export async function processReminderJob(job: Job<SendReminderJob>) {
  const { reminderId } = job.data

  console.log(`Processing reminder ${reminderId}`)

  const reminder = await db.reminder.findUnique({
    where: { id: reminderId },
    include: {
      subscription: {
        include: {
          user: true,
        },
      },
    },
  })

  if (!reminder) {
    throw new Error(`Reminder ${reminderId} not found`)
  }

  if (reminder.status !== 'pending') {
    console.log(`Reminder ${reminderId} already processed, skipping`)
    return
  }

  try {
    // Update status to 'processing' before sending
    await db.reminder.update({
      where: { id: reminderId },
      data: {
        status: 'processing',
      },
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

    // Update reminder status to 'sent' after success
    await db.reminder.update({
      where: { id: reminderId },
      data: {
        status: 'sent',
        sentAt: new Date(),
        channelsUsed,
      },
    })

    console.log(`Reminder ${reminderId} sent successfully via: ${channelsUsed.join(', ')}`)
  } catch (error) {
    // Update reminder status to 'failed' on error
    await db.reminder.update({
      where: { id: reminderId },
      data: {
        status: 'failed',
      },
    })

    console.error(`Reminder ${reminderId} failed:`, error)

    // Re-throw error for BullMQ retry logic
    throw error
  }
}
