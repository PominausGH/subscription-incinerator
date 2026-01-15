import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { SUPPORTED_CURRENCIES } from '@/lib/currency/exchange-rates'

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { homeCurrency } = body

    // Validate currency
    if (!homeCurrency || !SUPPORTED_CURRENCIES.find(c => c.code === homeCurrency)) {
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 })
    }

    // Update user's home currency
    const updated = await db.user.update({
      where: { id: session.user.id },
      data: { homeCurrency },
      select: { homeCurrency: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update currency error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { homeCurrency: true },
    })

    return NextResponse.json({ homeCurrency: user?.homeCurrency || 'USD' })
  } catch (error) {
    console.error('Get currency error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
