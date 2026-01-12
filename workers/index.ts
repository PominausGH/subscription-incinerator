import { Worker, Job } from 'bullmq'
import { processReminderJob } from './processors/reminder-sender'
import { processScanJob } from './processors/email-scanner'
import { cleanupExpiredPending } from './processors/cleanup-pending'
import { SendReminderJob, ScanInboxJob } from '@/lib/queue/jobs'
import { connection } from '@/lib/queue/client'

const reminderWorker = new Worker<SendReminderJob>(
  'reminders',
  async (job) => {
    await processReminderJob(job)
  },
  { connection }
)

const scanWorker = new Worker<ScanInboxJob | {}>(
  'email-scanning',
  async (job) => {
    if (job.name === 'cleanup-pending') {
      await cleanupExpiredPending()
    } else {
      await processScanJob(job as Job<ScanInboxJob>)
    }
  },
  { connection }
)

reminderWorker.on('completed', (job) => {
  console.log(`Reminder job ${job.id} completed`)
})

reminderWorker.on('failed', (job, err) => {
  console.error(`Reminder job ${job?.id} failed:`, err)
})

scanWorker.on('completed', async (job) => {
  if (job.name === 'cleanup-pending') {
    console.log('Cleanup job completed')
  } else {
    console.log(`Scan job ${job.id} completed`)
  }
})

scanWorker.on('failed', (job, err) => {
  console.error(`Scan job ${job?.id} failed:`, err)
})

console.log('Workers started successfully')

// Schedule cleanup job on startup
import { scheduleCleanupJob } from '@/lib/queue/scan-queue'
scheduleCleanupJob().then(() => {
  console.log('Cleanup job scheduled')
}).catch(console.error)

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`${signal} received, closing workers...`)
  await reminderWorker.close()
  await scanWorker.close()
  await connection.quit()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
