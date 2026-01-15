import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/lib/notifications/types'

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

    const preferences: NotificationPreferences = {
      channels: {
        email: Boolean(body.channels?.email),
        push: Boolean(body.channels?.push),
      },
      defaults: {
        trial: body.defaults?.trial || ['24h', '1h'],
        billing: body.defaults?.billing || ['7d', '1d'],
      },
    }

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
