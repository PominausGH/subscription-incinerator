import { NextResponse } from 'next/server'
import { auth, isPremium } from '@/lib/auth'
import { plaidClient } from '@/lib/plaid/client'
import { CountryCode, Products } from 'plaid'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isPremium(session.user)) {
    return NextResponse.json({ error: 'Premium required' }, { status: 403 })
  }

  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: session.user.id },
    client_name: 'Subscription Incinerator',
    products: [Products.Transactions],
    country_codes: [CountryCode.Us, CountryCode.Gb],
    language: 'en',
  })

  return NextResponse.json({ linkToken: response.data.link_token })
}
