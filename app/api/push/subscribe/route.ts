import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const subscription = await request.json()

  // Store the push subscription
  await db.pushSubscription.create({
    data: {
      userId: session.user.id,
      endpointData: subscription,
      active: true,
    },
  })

  return NextResponse.json({ success: true })
}
