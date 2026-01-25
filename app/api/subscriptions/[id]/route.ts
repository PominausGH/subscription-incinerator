import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { updateSubscriptionSchema } from '@/lib/validations/subscription'
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limit check
    const clientId = getClientIdentifier(req)
    const rateLimit = await checkRateLimit(`patch:subscriptions:${clientId}`, RATE_LIMITS.api)
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.reset)
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: subscriptionId } = await params
    const body = await req.json()
    
    // Validate input
    const validated = updateSubscriptionSchema.parse(body)

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

    // Update the subscription with validated data
    const updated = await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        ...(validated.serviceName !== undefined && { serviceName: validated.serviceName }),
        ...(validated.status !== undefined && { status: validated.status }),
        ...(validated.billingCycle !== undefined && { billingCycle: validated.billingCycle }),
        ...(validated.amount !== undefined && { amount: validated.amount }),
        ...(validated.currency !== undefined && { currency: validated.currency }),
        ...(validated.trialEndsAt !== undefined && { 
          trialEndsAt: validated.trialEndsAt ? new Date(validated.trialEndsAt) : null 
        }),
        ...(validated.nextBillingDate !== undefined && { 
          nextBillingDate: validated.nextBillingDate ? new Date(validated.nextBillingDate) : null 
        }),
        ...(validated.cancellationUrl !== undefined && { 
          cancellationUrl: validated.cancellationUrl || null 
        }),
        ...(validated.type !== undefined && { type: validated.type }),
        ...(validated.categoryId !== undefined && { categoryId: validated.categoryId }),
      },
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error('Update subscription error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    
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
