import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { scheduleTrialReminders, scheduleBillingReminders } from '@/lib/notifications/schedule-reminders'
import { Prisma } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pendingId } = await req.json()

    if (!pendingId || typeof pendingId !== 'string' || !pendingId.trim()) {
      return NextResponse.json({ error: 'Invalid pendingId' }, { status: 400 })
    }

    // Get pending subscription
    const pending = await db.pendingSubscription.findUnique({
      where: { id: pendingId }
    })

    if (!pending || pending.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (pending.status !== 'pending') {
      return NextResponse.json({ error: 'Already processed' }, { status: 400 })
    }

    // Create subscription and mark as approved in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create subscription from pending
      const subscription = await tx.subscription.create({
        data: {
          userId: pending.userId,
          serviceName: pending.serviceName,
          status: pending.isTrial ? 'trial' : 'active',
          amount: pending.amount,
          currency: pending.currency,
          trialEndsAt: pending.trialEndsAt,
          nextBillingDate: pending.nextBillingDate,
          detectedFrom: 'email_scan',
          rawEmailData: pending.rawEmailData as Prisma.InputJsonValue,
        }
      })

      // Mark pending as approved
      await tx.pendingSubscription.update({
        where: { id: pendingId },
        data: { status: 'approved' }
      })

      return subscription
    })

    // Schedule reminders (outside transaction)
    try {
      if (result.trialEndsAt) {
        await scheduleTrialReminders(result)
      }
      if (result.nextBillingDate) {
        await scheduleBillingReminders(result)
      }
    } catch (error) {
      console.error('Failed to schedule reminders:', error)
    }

    return NextResponse.json({ success: true, subscriptionId: result.id })
  } catch (error) {
    console.error('Approve pending subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to approve subscription' },
      { status: 500 }
    )
  }
}
