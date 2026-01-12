import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { scheduleTrialReminders, scheduleBillingReminders } from '@/lib/notifications/schedule-reminders'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pendingId } = await req.json()

    if (!pendingId) {
      return NextResponse.json({ error: 'Missing pendingId' }, { status: 400 })
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

    // Create subscription from pending
    const subscription = await db.subscription.create({
      data: {
        userId: pending.userId,
        serviceName: pending.serviceName,
        status: pending.isTrial ? 'trial' : 'active',
        amount: pending.amount,
        currency: pending.currency,
        trialEndsAt: pending.trialEndsAt,
        nextBillingDate: pending.nextBillingDate,
        detectedFrom: 'email_scan',
        rawEmailData: pending.rawEmailData,
      }
    })

    // Schedule reminders
    try {
      if (subscription.trialEndsAt) {
        await scheduleTrialReminders(subscription)
      }
      if (subscription.nextBillingDate) {
        await scheduleBillingReminders(subscription)
      }
    } catch (error) {
      console.error('Failed to schedule reminders:', error)
    }

    // Mark pending as approved
    await db.pendingSubscription.update({
      where: { id: pendingId },
      data: { status: 'approved' }
    })

    return NextResponse.json({ success: true, subscriptionId: subscription.id })
  } catch (error) {
    console.error('Approve pending subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to approve subscription' },
      { status: 500 }
    )
  }
}
