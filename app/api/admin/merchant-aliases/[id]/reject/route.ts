import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { isAdminEmail } from '@/lib/admin'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const pending = await db.pendingMerchantAlias.findUnique({ where: { id } })
  if (!pending) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (pending.status !== 'pending') {
    return NextResponse.json({ error: 'Already reviewed' }, { status: 400 })
  }

  await db.pendingMerchantAlias.update({
    where: { id },
    data: { status: 'rejected', reviewedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
