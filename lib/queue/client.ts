import { Queue } from 'bullmq'
import { Redis } from 'ioredis'

export const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
})

connection.on('error', (err) => {
  console.error('Redis connection error:', err)
})

connection.on('connect', () => {
  console.log('Redis connected successfully')
})

export const reminderQueue = new Queue('reminders', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
})

export const queues = {
  reminders: reminderQueue,
}
