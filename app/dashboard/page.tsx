import { Suspense } from 'react'
import Link from 'next/link'
import { db } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/session'
import { AddSubscriptionForm } from '@/components/subscriptions/add-subscription-form'
import { SubscriptionCard } from '@/components/subscriptions/subscription-card'
import { ScanEmailsButton } from '@/components/dashboard/scan-emails-button'
import { ExportCalendarButton } from '@/components/dashboard/export-calendar-button'
import { PendingSubscriptionsSection } from '@/components/pending/pending-subscriptions-section'
import { SpendingAnalytics } from '@/components/dashboard/spending-analytics'
import { UpgradeSuccessToast } from '@/components/upgrade-success-toast'
import { SubscriptionTypeFilter } from '@/components/subscriptions/subscription-type-filter'

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

  // Convert Decimal types to numbers for client components
  const subscriptions = subscriptionsRaw.map(sub => ({
    ...sub,
    amount: sub.amount ? Number(sub.amount) : null
  }))

  return (
    <div className="px-4 sm:px-0">
      <Suspense fallback={null}>
        <UpgradeSuccessToast />
      </Suspense>
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Track and manage your subscriptions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/import"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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

      <div className="mb-8">
        <AddSubscriptionForm />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Subscriptions ({subscriptions.length})</h2>
          <SubscriptionTypeFilter currentFilter={typeFilter} />
        </div>

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
