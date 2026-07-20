import { Suspense } from 'react'
import Link from 'next/link'
import { db } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/session'
import { AddSubscriptionForm } from '@/components/subscriptions/add-subscription-form'
import { ScanEmailsButton } from '@/components/dashboard/scan-emails-button'
import { ExportCalendarButton } from '@/components/dashboard/export-calendar-button'
import { PendingSubscriptionsSection } from '@/components/pending/pending-subscriptions-section'
import { SpendingAnalytics } from '@/components/dashboard/spending-analytics'
import { UpgradeSuccessToast } from '@/components/upgrade-success-toast'
import { SubscriptionTypeFilter } from '@/components/subscriptions/subscription-type-filter'
import { SubscriptionListView } from '@/components/subscriptions/subscription-list-view'
import { SavingsGoals } from '@/components/dashboard/savings-goals'
import { findOverlappingSubscriptions } from '@/lib/subscriptions/duplicate-detector'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { type: typeFilter } = await searchParams
  const user = await getCurrentUser()

  const userWithEmail = await db.user.findUnique({
    where: { id: user.id },
    select: { emailProvider: true, oauthTokens: true, homeCurrency: true },
  })

  const pendingSubscriptionsRaw = await db.pendingSubscription.findMany({
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
      billingCycle: true,
      nextBillingDate: true,
      emailFrom: true,
      emailDate: true,
      emailId: true,
      emailSubject: true
    }
  })

  // Convert Decimal types to numbers for client components
  const pendingSubscriptions = pendingSubscriptionsRaw.map(item => ({
    ...item,
    confidence: Number(item.confidence),
    amount: item.amount ? Number(item.amount) : null
  }))

  // Get connected Gmail email for correct account linking
  const gmailEmail = (userWithEmail?.oauthTokens as any)?.email || ''

  const subscriptionsRaw = await db.subscription.findMany({
    where: {
      userId: user.id,
      ...(typeFilter === 'personal' ? { type: 'PERSONAL' } : {}),
      ...(typeFilter === 'business' ? { type: 'BUSINESS' } : {}),
    },
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const cancelledSubs = await db.subscription.findMany({
    where: { userId: user.id, status: 'cancelled' },
    select: { savedAmount: true },
  })
  const totalSaved = cancelledSubs.reduce(
    (sum, s) => sum + (s.savedAmount ? Number(s.savedAmount) : 0),
    0
  )

  const savingsGoalsRaw = await db.savingsGoal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
  const savingsGoals = savingsGoalsRaw.map(g => ({
    id: g.id,
    name: g.name,
    targetAmount: g.targetAmount.toString(),
    currency: g.currency,
    deadline: g.deadline ? g.deadline.toISOString() : null,
  }))

  // Convert Decimal types to numbers for client components
  const subscriptions = subscriptionsRaw.map(sub => ({
    ...sub,
    amount: sub.amount ? Number(sub.amount) : null
  }))

  // Count user's subscriptions that have open source alternatives
  const activeSubNames = subscriptions
    .filter(s => s.status === 'active' || s.status === 'trial')
    .map(s => s.serviceName)

  const matchedSubs = activeSubNames.length > 0
    ? await db.openSourceAlternative.findMany({
        where: { serviceName: { in: activeSubNames } },
        select: { serviceName: true },
        distinct: ['serviceName'],
      })
    : []
  const matchedSubCount = matchedSubs.length

  const overlapGroups = findOverlappingSubscriptions(
    subscriptions.map(sub => ({
      id: sub.id,
      serviceName: sub.serviceName,
      amount: sub.amount,
      currency: sub.currency,
      billingCycle: sub.billingCycle,
      status: sub.status,
      categoryName: sub.category?.name ?? null,
    }))
  )

  return (
    <div className="px-4 sm:px-0">
      <Suspense fallback={null}>
        <UpgradeSuccessToast />
      </Suspense>
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-800 dark:text-gray-300">
              Track and manage your subscriptions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/import"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium px-3 py-1.5 border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              Import Bank Statement
            </Link>
            <ScanEmailsButton
              isGmailConnected={userWithEmail?.emailProvider === 'gmail' && userWithEmail?.oauthTokens !== null}
            />
            <ExportCalendarButton />
          </div>
        </div>
      </div>

      {pendingSubscriptions.length > 0 && (
        <PendingSubscriptionsSection pending={pendingSubscriptions} gmailEmail={gmailEmail} />
      )}

      {/* Spending Analytics */}
      <div className="mb-8">
        <SpendingAnalytics subscriptions={subscriptions} homeCurrency={userWithEmail?.homeCurrency || 'USD'} />
      </div>

      {/* Savings Goals */}
      <div className="mb-8">
        <SavingsGoals totalSaved={totalSaved} currency={userWithEmail?.homeCurrency ?? 'USD'} initialGoals={savingsGoals} />
      </div>

      {/* Open Source Teaser */}
      {matchedSubCount > 0 && (
        <div className="mb-8">
          <Link
            href="/dashboard/open-source"
            className="block bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌿</span>
                <div>
                  <p className="font-semibold text-emerald-900 dark:text-emerald-300 text-sm">
                    {matchedSubCount} of your subscription{matchedSubCount !== 1 ? 's have' : ' has'} a free open source alternative
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-0.5">
                    Click to explore free replacements and save money
                  </p>
                </div>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium group-hover:underline">
                View all →
              </span>
            </div>
          </Link>
        </div>
      )}

      {/* Overlapping Subscriptions Teaser */}
      {overlapGroups.length > 0 && (
        <div className="mb-8">
          <Link
            href="/dashboard/duplicates"
            className="block bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-5 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-300 text-sm">
                    {overlapGroups.length} categor{overlapGroups.length !== 1 ? 'ies' : 'y'} with overlapping subscriptions
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
                    You may be paying for more than one service doing the same job
                  </p>
                </div>
              </div>
              <span className="text-amber-600 dark:text-amber-400 text-sm font-medium group-hover:underline">
                Review →
              </span>
            </div>
          </Link>
        </div>
      )}

      <div className="mb-8">
        <AddSubscriptionForm />
      </div>

      <SubscriptionListView
        subscriptions={subscriptions}
        subscriptionTypeFilter={<SubscriptionTypeFilter currentFilter={typeFilter} />}
      />
    </div>
  )
}
