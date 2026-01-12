import { Worker } from 'bullmq'
import { processReminderJob } from './processors/reminder-sender'
import { SendReminderJob } from '@/lib/queue/jobs'
import { connection } from '@/lib/queue/client'

const reminderWorker = new Worker<SendReminderJob>(
  'reminders',
  async (job) => {
    await processReminderJob(job)
  },
  { connection }
)

reminderWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`)
})

reminderWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err)
})

console.log('Workers started successfully')

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`${signal} received, closing workers...`)
  await reminderWorker.close()
  await connection.quit()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
