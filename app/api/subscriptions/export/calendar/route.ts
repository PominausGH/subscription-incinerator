import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { generateICS, type SubscriptionForCalendar, type ICSOptions } from '@/lib/calendar/ics-generator'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query params
    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') as ICSOptions['filter'] || 'all'
    const include = searchParams.get('include') || 'both'

    // Fetch subscriptions
    const subscriptions = await db.subscription.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        serviceName: true,
        status: true,
        billingCycle: true,
        amount: true,
        currency: true,
        trialEndsAt: true,
        nextBillingDate: true,
        cancellationUrl: true,
      },
    })

    // Convert Decimal to number for the generator
    const subscriptionsForCalendar: SubscriptionForCalendar[] = subscriptions.map(sub => ({
      ...sub,
      amount: sub.amount ? Number(sub.amount) : null,
    }))

    // Generate ICS content
    const options: ICSOptions = {
      filter: ['active', 'trial', 'all'].includes(filter) ? filter : 'all',
      includeTrials: include === 'trials' || include === 'both',
      includeBilling: include === 'billing' || include === 'both',
    }

    const icsContent = generateICS(subscriptionsForCalendar, options)

    // Return as downloadable file
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="subscriptions.ics"',
      },
    })
  } catch (error) {
    console.error('Calendar export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
