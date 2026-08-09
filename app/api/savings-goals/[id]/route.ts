import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const goal = await db.savingsGoal.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.savingsGoal.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
