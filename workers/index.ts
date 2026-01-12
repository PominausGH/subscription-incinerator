import { Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { processReminderJob } from './processors/reminder-sender'
import { SendReminderJob } from '@/lib/queue/jobs'

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
})

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
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing workers...')
  await reminderWorker.close()
  process.exit(0)
})
