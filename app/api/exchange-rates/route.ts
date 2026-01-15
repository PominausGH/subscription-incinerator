import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchExchangeRates } from '@/lib/currency/exchange-rates'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const baseCurrency = searchParams.get('base') || 'USD'

    const rates = await fetchExchangeRates(baseCurrency)

    return NextResponse.json(rates)
  } catch (error) {
    console.error('Exchange rates error:', error)
    return NextResponse.json({ error: 'Failed to fetch exchange rates' }, { status: 500 })
  }
}
