import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication using NextAuth v5
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json({ error: 'Invalid subscription ID' }, { status: 400 })
    }

    // Fetch subscription and check ownership
    const subscription = await db.subscription.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        serviceName: true,
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    if (subscription.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Look up open-source alternatives
    const alternatives = await db.openSourceAlternative.findMany({
      where: { serviceName: subscription.serviceName },
      orderBy: { stars: 'desc' },
    })

    return NextResponse.json({
      serviceName: subscription.serviceName,
      alternatives,
    })
  } catch (error) {
    console.error('Error fetching open-source alternatives:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
