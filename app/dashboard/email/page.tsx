import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db/client'
import { GmailConnectionCard } from '@/components/settings/gmail-connection-card'
import { PendingSubscriptionsSection } from '@/components/pending/pending-subscriptions-section'

export default async function EmailPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailProvider: true, oauthTokens: true },
  })

  const isGmailConnected = user?.emailProvider === 'gmail' && user?.oauthTokens !== null
  const gmailEmail = (user?.oauthTokens as any)?.email || ''

  const pendingRaw = await db.pendingSubscription.findMany({
    where: { userId: session.user.id, status: 'pending' },
    orderBy: { confidence: 'desc' },
    select: {
      id: true,
      serviceName: true,
      confidence: true,
      amount: true,
      currency: true,
      billingCycle: true,
      trialEndsAt: true,
      nextBillingDate: true,
      emailFrom: true,
      emailDate: true,
      emailId: true,
      emailSubject: true,
      sourceType: true,
      noticeType: true,
    },
  })

  const pendingSubscriptions = pendingRaw.map((p) => ({
    ...p,
    confidence: Number(p.confidence),
    amount: p.amount ? Number(p.amount) : null,
  }))

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email Scanning</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Connect your Gmail so we can detect subscriptions from receipts, invoices and trial confirmations.
        </p>
      </div>

      <section className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Gmail Connection</h2>
        <GmailConnectionCard
          isConnected={isGmailConnected}
          userEmail={user?.email || ''}
          userTier={session.user.tier}
        />
      </section>

      {isGmailConnected && (
        <section className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pending Detections</h2>
            <Link
              href="/dashboard"
              className="text-sm text-orange-600 hover:text-orange-700"
            >
              View on dashboard →
            </Link>
          </div>
          {pendingSubscriptions.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No pending detections. Click &ldquo;Scan Now&rdquo; above to check for new subscriptions.
            </p>
          ) : (
            <PendingSubscriptionsSection pending={pendingSubscriptions} gmailEmail={gmailEmail} />
          )}
        </section>
      )}
    </div>
  )
}
