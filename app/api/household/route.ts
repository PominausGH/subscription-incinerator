import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requester = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, householdOwnerId: true },
    })

    if (!requester) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ownerId = requester.householdOwnerId ?? requester.id
    const isOwner = ownerId === requester.id

    const [owner, members] = await Promise.all([
      db.user.findUnique({ where: { id: ownerId }, select: { id: true, email: true, tier: true } }),
      db.user.findMany({
        where: { householdOwnerId: ownerId },
        select: { id: true, email: true },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    const pendingInvites = isOwner
      ? await db.householdInvite.findMany({
          where: { ownerId, status: 'pending' },
          select: { id: true, email: true, createdAt: true, expiresAt: true },
          orderBy: { createdAt: 'desc' },
        })
      : []

    return NextResponse.json({ isOwner, owner, members, pendingInvites })
  } catch (error) {
    console.error('Get household error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
