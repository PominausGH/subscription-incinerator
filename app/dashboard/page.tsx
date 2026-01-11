import { db } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/session'
import { AddSubscriptionForm } from '@/components/subscriptions/add-subscription-form'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  const subscriptions = await db.subscription.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Track and manage your subscriptions
        </p>
      </div>

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
              <div key={sub.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">{sub.serviceName}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    sub.status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                    sub.status === 'active' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {sub.status}
                  </span>
                </div>

                {sub.amount && (
                  <p className="text-2xl font-bold mb-2">
                    ${sub.amount.toString()}/{sub.billingCycle}
                  </p>
                )}

                {sub.trialEndsAt && (
                  <p className="text-sm text-gray-600">
                    Trial ends: {new Date(sub.trialEndsAt).toLocaleDateString()}
                  </p>
                )}

                {sub.nextBillingDate && (
                  <p className="text-sm text-gray-600">
                    Next billing: {new Date(sub.nextBillingDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
