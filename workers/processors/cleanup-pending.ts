import { db } from '@/lib/db/client'

export async function cleanupExpiredPending() {
  try {
    const now = new Date()

    const result = await db.pendingSubscription.deleteMany({
      where: {
        status: 'pending',
        expiresAt: {
          lt: now
        }
      }
    })

    console.log(`Cleaned up ${result.count} expired pending subscriptions`)

    return {
      deletedCount: result.count
    }
  } catch (error) {
    console.error('Cleanup job error:', error)
    throw error
  }
}
