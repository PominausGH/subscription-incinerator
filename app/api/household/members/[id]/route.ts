import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: memberId } = await params

    const member = await db.user.findUnique({
      where: { id: memberId },
      select: { id: true, householdOwnerId: true },
    })

    if (!member || member.householdOwnerId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await db.user.update({
      where: { id: memberId },
      data: { householdOwnerId: null },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Remove household member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
