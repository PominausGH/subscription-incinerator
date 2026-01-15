import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: subscriptionId } = await params
    const { reminderSettings, ...otherFields } = await req.json()

    // First, verify the subscription belongs to the user
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    if (subscription.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update the subscription
    const updated = await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        serviceName: otherFields.serviceName,
        status: otherFields.status,
        billingCycle: otherFields.billingCycle,
        amount: otherFields.amount,
        currency: otherFields.currency,
        trialEndsAt: otherFields.trialEndsAt ? new Date(otherFields.trialEndsAt) : null,
        nextBillingDate: otherFields.nextBillingDate ? new Date(otherFields.nextBillingDate) : null,
        cancellationUrl: otherFields.cancellationUrl,
        ...(reminderSettings !== undefined && { reminderSettings }),
      },
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error('Update subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: subscriptionId } = await params

    // First, verify the subscription belongs to the user
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    if (subscription.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the subscription
    await db.subscription.delete({
      where: { id: subscriptionId },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Delete subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
