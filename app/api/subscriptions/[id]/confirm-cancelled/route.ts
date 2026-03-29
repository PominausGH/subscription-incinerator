import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { toMonthlyAmount } from '@/lib/analytics/queries'

export async function POST(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sub = await db.subscription.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { amount: true, billingCycle: true, status: true },
  })
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (sub.status === 'cancelled') {
    return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })
  }

  const monthly = sub.amount
    ? toMonthlyAmount(Number(sub.amount), sub.billingCycle ?? null)
    : 0
  const savedAmount = Math.round(monthly * 12 * 100) / 100

  const updated = await db.subscription.update({
    where: { id: params.id },
    data: {
      status: 'cancelled',
      cancelledAt: new Date(),
      savedAmount,
    },
  })

  // Mark most recent in_progress attempt as completed
  const attempt = await db.cancellationAttempt.findFirst({
    where: { subscriptionId: params.id, status: 'in_progress' },
    orderBy: { attemptedAt: 'desc' },
  })
  if (attempt) {
    await db.cancellationAttempt.update({
      where: { id: attempt.id },
      data: { status: 'completed', completedAt: new Date() },
    })
  }

  return NextResponse.json({ success: true, savedAmount, subscription: updated })
}
