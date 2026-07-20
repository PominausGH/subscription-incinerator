import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/session'
import { getCategoryIcon } from '@/lib/categories/presets'
import { getCurrencySymbol } from '@/lib/currency/exchange-rates'
import { findOverlappingSubscriptions } from '@/lib/subscriptions/duplicate-detector'

export const metadata = {
  title: 'Overlapping Subscriptions — Subscription Incinerator',
  description: 'Find subscriptions competing for the same job, like multiple cloud storage plans',
}

export default async function DuplicatesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const subscriptionsRaw = await db.subscription.findMany({
    where: { userId: user.id, status: { in: ['active', 'trial'] } },
    include: { category: { select: { name: true } } },
  })

  const subscriptions = subscriptionsRaw.map(sub => ({
    id: sub.id,
    serviceName: sub.serviceName,
    amount: sub.amount ? Number(sub.amount) : null,
    currency: sub.currency,
    billingCycle: sub.billingCycle,
    status: sub.status,
    categoryName: sub.category?.name ?? null,
  }))

  const groups = findOverlappingSubscriptions(subscriptions)

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-fire-500 hover:underline">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
          Overlapping Subscriptions
        </h1>
        <p className="mt-2 text-sm text-gray-800 dark:text-gray-300">
          Subscriptions grouped in the same category may be doing the same job twice.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No overlap found — you don&apos;t have more than one active subscription in the same category.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(group => (
            <div
              key={group.categoryName}
              className="bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800/40 rounded-xl p-5"
            >
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>{getCategoryIcon(group.categoryName)}</span>
                  {group.categoryName}
                  <span className="text-xs font-normal text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                    {group.subscriptions.length} subscriptions
                  </span>
                </h2>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {Object.entries(group.monthlyByCurrency)
                    .map(([currency, monthly]) => `${getCurrencySymbol(currency)}${monthly.toFixed(2)}/mo`)
                    .join(' + ')}
                </span>
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {group.subscriptions.map(sub => (
                  <li key={sub.id} className="py-2 flex items-center justify-between text-sm">
                    <span className="text-gray-900 dark:text-white">{sub.serviceName}</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {sub.amount != null
                        ? `${getCurrencySymbol(sub.currency)}${sub.amount.toFixed(2)}/${sub.billingCycle || 'monthly'}`
                        : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
