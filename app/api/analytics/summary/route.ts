import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import {
  calculateMonthlyTotal,
  calculateYearlyTotal,
  getTopSpender,
  countByType,
} from '@/lib/analytics/queries'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const typeFilter = searchParams.get('type') as 'PERSONAL' | 'BUSINESS' | 'all' | null

    const subscriptionsRaw = await db.subscription.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        serviceName: true,
        amount: true,
        billingCycle: true,
        status: true,
        type: true,
      },
    })

    const subscriptions = subscriptionsRaw.map((sub) => ({
      ...sub,
      amount: sub.amount ? Number(sub.amount) : null,
    }))

    const filterType = typeFilter === 'all' || !typeFilter ? undefined : typeFilter

    const monthlyTotal = calculateMonthlyTotal(subscriptions, filterType)
    const yearlyTotal = calculateYearlyTotal(subscriptions, filterType)
    const counts = countByType(subscriptions)

    // Calculate previous month total for comparison (simplified - would need historical data)
    const previousMonthTotal = monthlyTotal
    const monthlyChange = previousMonthTotal > 0
      ? ((monthlyTotal - previousMonthTotal) / previousMonthTotal) * 100
      : 0

    const topSpenderRaw = getTopSpender(
      filterType ? subscriptions.filter((s) => s.type === filterType) : subscriptions
    )

    const topSpender = topSpenderRaw
      ? {
          id: topSpenderRaw.id,
          name: topSpenderRaw.serviceName,
          cost: topSpenderRaw.amount,
          cycle: topSpenderRaw.billingCycle,
        }
      : null

    return NextResponse.json({
      monthlyTotal: Math.round(monthlyTotal * 100) / 100,
      monthlyChange: Math.round(monthlyChange * 10) / 10,
      yearlyTotal: Math.round(yearlyTotal * 100) / 100,
      subscriptionCount: counts,
      topSpender,
    })
  } catch (error) {
    console.error('Analytics summary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
