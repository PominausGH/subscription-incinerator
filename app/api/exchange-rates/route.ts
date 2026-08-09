import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchExchangeRates, SUPPORTED_CURRENCIES } from '@/lib/currency/exchange-rates'

const VALID_CURRENCY_CODES = new Set(SUPPORTED_CURRENCIES.map(c => c.code))

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const baseCurrency = searchParams.get('base') || 'USD'

    if (!VALID_CURRENCY_CODES.has(baseCurrency)) {
      return NextResponse.json({ error: 'Unsupported currency code' }, { status: 400 })
    }

    const rates = await fetchExchangeRates(baseCurrency)

    return NextResponse.json(rates)
  } catch (error) {
    console.error('Exchange rates error:', error)
    return NextResponse.json({ error: 'Failed to fetch exchange rates' }, { status: 500 })
  }
}
