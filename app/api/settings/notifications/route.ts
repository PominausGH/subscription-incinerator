import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/lib/notifications/types'
import { z } from 'zod'

const VALID_TRIAL_TIMINGS = ['24h', '12h', '1h'] as const
const VALID_BILLING_TIMINGS = ['14d', '7d', '3d', '1d'] as const

const notificationPreferencesSchema = z.object({
  channels: z.object({
    email: z.boolean(),
    push: z.boolean(),
  }),
  defaults: z.object({
    trial: z.array(z.enum(VALID_TRIAL_TIMINGS)),
    billing: z.array(z.enum(VALID_BILLING_TIMINGS)),
  }),
})

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { notificationPreferences: true },
    })

    const preferences = (user?.notificationPreferences as unknown as NotificationPreferences) ||
      DEFAULT_NOTIFICATION_PREFERENCES

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Get notification preferences error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const parsed = notificationPreferencesSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid preferences', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const preferences: NotificationPreferences = parsed.data

    await db.user.update({
      where: { id: session.user.id },
      data: { notificationPreferences: preferences as unknown as Prisma.InputJsonValue },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update notification preferences error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
