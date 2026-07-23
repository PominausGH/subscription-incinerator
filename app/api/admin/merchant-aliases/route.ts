import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { isAdminEmail } from '@/lib/admin'

export async function GET() {
  const session = await auth()
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const pending = await db.pendingMerchantAlias.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ pending })
}
