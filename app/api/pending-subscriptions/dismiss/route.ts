import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'

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

    // Mark as dismissed
    await db.pendingSubscription.update({
      where: { id: pendingId },
      data: { status: 'dismissed' }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Dismiss pending subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to dismiss subscription' },
      { status: 500 }
    )
  }
}
