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

  // Send email notification
  await sendReminderEmail(reminder)

  // Update reminder status
  await db.reminder.update({
    where: { id: reminderId },
    data: {
      status: 'sent',
      sentAt: new Date(),
      channelsUsed: ['email'],
    },
  })

  console.log(`Reminder ${reminderId} sent successfully`)
}
