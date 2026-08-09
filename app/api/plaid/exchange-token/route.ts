import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { plaidClient } from '@/lib/plaid/client'
import { encryptAccessToken } from '@/lib/plaid/sync'
import { addPlaidSyncJob } from '@/lib/queue/scan-queue'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { publicToken, institutionName } = await req.json()
  if (!publicToken) return NextResponse.json({ error: 'publicToken required' }, { status: 400 })

  const exchangeRes = await plaidClient.itemPublicTokenExchange({ public_token: publicToken })
  const { access_token, item_id } = exchangeRes.data

  const accountsRes = await plaidClient.accountsGet({ access_token })

  const plaidItem = await db.plaidItem.create({
    data: {
      userId: session.user.id,
      itemId: item_id,
      accessToken: encryptAccessToken(access_token),
      institutionName: institutionName ?? null,
      accounts: {
        create: accountsRes.data.accounts.map((a) => ({
          accountId: a.account_id,
          name: a.name,
          mask: a.mask ?? null,
          type: a.type,
        })),
      },
    },
  })

  await addPlaidSyncJob(plaidItem.id)

  return NextResponse.json({ success: true, institutionName })
}
