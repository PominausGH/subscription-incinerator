import { Job } from 'bullmq'
import { db } from '@/lib/db/client'
import { plaidClient } from '@/lib/plaid/client'
import { decryptAccessToken, filterRecurringTransactions } from '@/lib/plaid/sync'

export async function processSyncPlaid(job: Job<{ plaidItemId: string }>) {
  const { plaidItemId } = job.data

  const item = await db.plaidItem.findUnique({
    where: { id: plaidItemId },
    select: { id: true, userId: true, accessToken: true, cursor: true },
  })
  if (!item) throw new Error(`PlaidItem ${plaidItemId} not found`)

  const accessToken = decryptAccessToken(item.accessToken)
  let cursor = item.cursor ?? undefined
  const added: Array<{ merchant_name: string | null; name: string; amount: number; date: string }> = []

  let hasMore = true
  while (hasMore) {
    const res = await plaidClient.transactionsSync({
      access_token: accessToken,
      cursor,
    })
    added.push(...res.data.added)
    cursor = res.data.next_cursor
    hasMore = res.data.has_more
  }

  await db.plaidItem.update({
    where: { id: plaidItemId },
    data: { cursor, lastSyncedAt: new Date() },
  })

  // Plaid: positive amount = debit (money leaving account)
  const debits = added
    .filter((t) => t.amount > 0)
    .map((t) => ({
      merchant_name: t.merchant_name ?? null,
      name: t.name,
      amount: t.amount,
      date: t.date,
    }))

  const recurring = filterRecurringTransactions(debits)

  for (const t of recurring) {
    const merchantName = t.merchant_name ?? t.name
    if (!merchantName) continue

    const exists = await db.pendingSubscription.findFirst({
      where: { userId: item.userId, serviceName: merchantName, status: 'pending' },
    })
    if (exists) continue

    await db.pendingSubscription.create({
      data: {
        userId: item.userId,
        serviceName: merchantName,
        confidence: 0.75,
        amount: t.amount,
        currency: 'USD',
        emailId: `plaid-${t.date}-${merchantName.replace(/\s+/g, '-')}`,
        emailSubject: `Recurring charge from ${merchantName}`,
        emailFrom: 'plaid-sync',
        emailDate: new Date(t.date),
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
  }
}
