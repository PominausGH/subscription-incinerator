import { Job } from 'bullmq'
import { db } from '@/lib/db/client'
import { SendReminderJob } from '@/lib/queue/jobs'
import { sendReminderEmail } from '@/lib/notifications/email'

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
    // Update status to 'processing' before sending email
    await db.reminder.update({
      where: { id: reminderId },
      data: {
        status: 'processing',
      },
    })

    // Send email notification
    await sendReminderEmail(reminder)

    // Update reminder status to 'sent' after success
    await db.reminder.update({
      where: { id: reminderId },
      data: {
        status: 'sent',
        sentAt: new Date(),
        channelsUsed: ['email'],
      },
    })

    console.log(`Reminder ${reminderId} sent successfully`)
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
