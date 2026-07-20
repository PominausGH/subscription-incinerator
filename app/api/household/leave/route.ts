import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { householdOwnerId: true },
    })

    if (!user?.householdOwnerId) {
      return NextResponse.json({ error: "You're not part of a household" }, { status: 400 })
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { householdOwnerId: null },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Leave household error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
