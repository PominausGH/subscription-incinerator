import { db } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/session'
import { AddSubscriptionForm } from '@/components/subscriptions/add-subscription-form'
import { SubscriptionCard } from '@/components/subscriptions/subscription-card'
import { ScanEmailsButton } from '@/components/dashboard/scan-emails-button'
import { PendingSubscriptionsSection } from '@/components/pending/pending-subscriptions-section'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  const userWithEmail = await db.user.findUnique({
    where: { id: user.id },
    select: { emailProvider: true, oauthTokens: true },
  })

  const pendingSubscriptions = await db.pendingSubscription.findMany({
    where: {
      userId: user.id,
      status: 'pending'
    },
    orderBy: { confidence: 'desc' },
    select: {
      id: true,
      serviceName: true,
      confidence: true,
      amount: true,
      currency: true,
      nextBillingDate: true,
      emailFrom: true,
      emailDate: true
    }
  })

  const subscriptions = await db.subscription.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Track and manage your subscriptions
            </p>
          </div>
          <ScanEmailsButton
            isGmailConnected={userWithEmail?.emailProvider === 'gmail' && userWithEmail?.oauthTokens !== null}
          />
        </div>
      </div>

      {pendingSubscriptions.length > 0 && (
        <PendingSubscriptionsSection pending={pendingSubscriptions} />
      )}

      <div className="mb-8">
        <AddSubscriptionForm />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Subscriptions ({subscriptions.length})</h2>

        {subscriptions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No subscriptions yet. Add your first one above!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subscriptions.map((sub) => (
              <SubscriptionCard key={sub.id} subscription={sub} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
