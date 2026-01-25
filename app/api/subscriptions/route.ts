import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { createSubscriptionSchema } from '@/lib/validations/subscription'
import { scheduleTrialReminders, scheduleBillingReminders } from '@/lib/reminders/scheduler'
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'

export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const clientId = getClientIdentifier(req)
    const rateLimit = await checkRateLimit(`post:subscriptions:${clientId}`, RATE_LIMITS.api)
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.reset)
    }

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = createSubscriptionSchema.parse(body)

    const subscription = await db.subscription.create({
      data: {
        userId: session.user.id,
        serviceName: validated.serviceName,
        status: validated.status,
        billingCycle: validated.billingCycle,
        amount: validated.amount,
        currency: validated.currency,
        trialEndsAt: validated.trialEndsAt ? new Date(validated.trialEndsAt) : null,
        nextBillingDate: validated.nextBillingDate ? new Date(validated.nextBillingDate) : null,
        cancellationUrl: validated.cancellationUrl,
        categoryId: validated.categoryId,
        detectedFrom: 'manual',
      },
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
      // Continue - subscription created successfully even if scheduling failed
    }

    return NextResponse.json(subscription, { status: 201 })
  } catch (error) {
    console.error('Create subscription error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscriptions = await db.subscription.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(subscriptions)
  } catch (error) {
    console.error('Get subscriptions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
