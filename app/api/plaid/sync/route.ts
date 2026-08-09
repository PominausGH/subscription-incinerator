import { NextResponse } from 'next/server'
import { auth, isPremium } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { addPlaidSyncJob } from '@/lib/queue/scan-queue'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isPremium(session.user)) {
    return NextResponse.json({ error: 'Premium required' }, { status: 403 })
  }

  const items = await db.plaidItem.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  })

  for (const item of items) {
    await addPlaidSyncJob(item.id)
  }

  return NextResponse.json({ queued: items.length })
}
