import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { removeRecurringScan } from '@/lib/queue/scan-queue'
import { Prisma } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Remove recurring scan job
    await removeRecurringScan(userId)

    // Clear OAuth tokens
    await db.user.update({
      where: { id: userId },
      data: {
        oauthTokens: Prisma.JsonNull,
        emailProvider: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Gmail disconnect error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Gmail' },
      { status: 500 }
    )
  }
}
