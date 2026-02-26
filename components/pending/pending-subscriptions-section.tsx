'use client'

import { PendingSubscriptionCard } from './pending-subscription-card'

interface PendingSubscriptionsSectionProps {
  pending: Array<{
    id: string
    serviceName: string
    confidence: number
    amount: number | null
    currency: string
    billingCycle: string | null
    nextBillingDate: Date | null
    emailFrom: string
    emailDate: Date
    emailId: string
    emailSubject: string
  }>
  gmailEmail?: string
}

export function PendingSubscriptionsSection({ pending, gmailEmail }: PendingSubscriptionsSectionProps) {
  if (pending.length === 0) {
    return null
  }

  return (
    <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-blue-900">
          Review Detected Subscriptions ({pending.length})
        </h2>
      </div>

      <p className="text-sm text-blue-700 mb-4">
        We found these potential subscriptions in your emails. Review and add the ones you want to track.
      </p>

      <div className="space-y-3">
        {pending.map(item => (
          <PendingSubscriptionCard key={item.id} item={item} gmailEmail={gmailEmail} />
        ))}
      </div>

      <p className="mt-4 text-xs text-blue-600">
        These detections will auto-dismiss after 30 days if not reviewed.
      </p>
    </div>
  )
}
