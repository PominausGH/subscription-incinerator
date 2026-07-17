import { Queue } from 'bullmq'
import { connection } from './client'
import { ScanInboxJob, CleanupPendingJob, JobData, JobType } from './jobs'

export const scanQueue = new Queue<JobData>('email-scanning', {
  connection: connection as any, // Type cast needed due to ioredis version mismatch between app and bullmq
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
})

export async function addScanJob(data: ScanInboxJob) {
  return await scanQueue.add('scan-inbox', data, {
    jobId: `scan-${data.userId}-${Date.now()}`,
  })
}

export async function scheduleRecurringScan(userId: string) {
  // Schedule recurring scan every 3 days
  return await scanQueue.add(
    'scan-inbox',
    { userId, fullScan: false },
    {
      jobId: `recurring-scan-${userId}`,
      repeat: {
        every: 3 * 24 * 60 * 60 * 1000, // 3 days in milliseconds
      },
      removeOnComplete: true,
    }
  )
}

export async function removeRecurringScan(userId: string) {
  const jobId = `recurring-scan-${userId}`
  const job = await scanQueue.getJob(jobId)
  if (job) {
    await job.remove()
  }
}

export async function scheduleCleanupJob() {
  return await scanQueue.add(
    'cleanup-pending',
    {},
    {
      jobId: 'cleanup-pending-daily',
      repeat: {
        every: 24 * 60 * 60 * 1000 // Daily
      },
      removeOnComplete: true,
    }
  )
}

export async function scheduleQuarterlyAuditJob() {
  return await scanQueue.add(
    'quarterly-audit-check',
    {},
    {
      jobId: 'quarterly-audit-check-daily',
      repeat: {
        every: 24 * 60 * 60 * 1000 // Daily; the processor decides who is actually due
      },
      removeOnComplete: true,
    }
  )
}

export async function addPlaidSyncJob(plaidItemId: string) {
  await scanQueue.add(
    JobType.SYNC_PLAID,
    { plaidItemId },
    { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
  )
}
