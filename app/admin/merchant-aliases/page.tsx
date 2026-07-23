import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { isAdminEmail } from '@/lib/admin'
import { MerchantAliasReviewList } from '@/components/admin/merchant-alias-review-list'

export const metadata = {
  title: 'Merchant Alias Review',
  robots: { index: false, follow: false },
}

export default async function MerchantAliasesAdminPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  if (!isAdminEmail(session.user.email)) {
    redirect('/dashboard')
  }

  const pendingRaw = await db.pendingMerchantAlias.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
  })

  const pending = pendingRaw.map((p) => ({
    id: p.id,
    bankPattern: p.bankPattern,
    serviceName: p.serviceName,
    sampleDescription: p.sampleDescription,
    confidence: p.confidence,
    createdAt: p.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Merchant Alias Review</h1>
      <p className="text-gray-700 mb-8">
        AI-classified bank merchant patterns waiting to be promoted into the shared alias table.
        Approving one applies it to every user&apos;s future bank imports — reject anything that looks
        wrong or too broad.
      </p>
      <MerchantAliasReviewList initialPending={pending} />
    </div>
  )
}
