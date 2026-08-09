import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { endpoint } = await request.json()

  // Find and deactivate the subscription
  await db.pushSubscription.updateMany({
    where: {
      userId: session.user.id,
      endpointData: {
        path: ['endpoint'],
        equals: endpoint,
      },
    },
    data: { active: false },
  })

  return NextResponse.json({ success: true })
}
