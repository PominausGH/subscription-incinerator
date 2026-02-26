'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { EditSubscriptionModal } from './edit-subscription-modal'
import { OpenSourceAlternatives } from './open-source-alternatives'
import { getCategoryIcon } from '@/lib/categories/presets'
import { getCurrencySymbol } from '@/lib/currency/exchange-rates'

type Subscription = {
  id: string
  serviceName: string
  status: string
  billingCycle: string | null
  amount: number | null
  currency: string
  trialEndsAt: Date | null
  nextBillingDate: Date | null
  cancellationUrl: string | null
  type: 'PERSONAL' | 'BUSINESS'
  categoryId: string | null
  category?: { id: string; name: string } | null
}

export function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete subscription')
      }

      router.refresh()
    } catch (error) {
      console.error('Delete error')
      alert('Failed to delete subscription. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null || amount === undefined) return null
    return `${getCurrencySymbol(currency)}${amount.toFixed(2)}`
  }

  const hasNoData = !subscription.amount && !subscription.nextBillingDate && !subscription.billingCycle

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6 relative">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{subscription.serviceName}</h3>
            <span className={`px-2 py-0.5 text-xs rounded font-medium ${
              subscription.type === 'BUSINESS'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {subscription.type === 'BUSINESS' ? 'Business' : 'Personal'}
            </span>
            {subscription.category && (
              <span className="px-2 py-0.5 text-xs rounded font-medium bg-blue-50 text-blue-700">
                {getCategoryIcon(subscription.category.name)} {subscription.category.name}
              </span>
            )}
          </div>
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
            subscription.status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
            subscription.status === 'active' ? 'bg-green-100 text-green-800' :
            subscription.status === 'cancelled' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {subscription.status}
          </span>
        </div>

        {/* Price */}
        {subscription.amount ? (
          <p className="text-2xl font-bold text-gray-900 mb-2">
            {formatCurrency(subscription.amount, subscription.currency)}
            {subscription.billingCycle && (
              <span className="text-sm font-normal text-gray-700">/{subscription.billingCycle}</span>
            )}
          </p>
        ) : (
          <p className="text-sm text-gray-700 italic mb-2">No price set</p>
        )}

        {/* Details */}
        <div className="space-y-1 text-sm text-gray-800">
          {subscription.trialEndsAt && (
            <p>
              <span className="text-gray-700">Trial ends:</span>{' '}
              {new Date(subscription.trialEndsAt).toLocaleDateString()}
            </p>
          )}

          {subscription.nextBillingDate && (
            <p>
              <span className="text-gray-700">Next billing:</span>{' '}
              {new Date(subscription.nextBillingDate).toLocaleDateString()}
            </p>
          )}

          {subscription.cancellationUrl && (
            <p>
              <a
                href={subscription.cancellationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Cancel subscription
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </p>
          )}
        </div>

        <OpenSourceAlternatives subscriptionId={subscription.id} />

        {/* Warning if no data */}
        {hasNoData && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
            Missing details - click Edit to add price and billing info
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEdit(true)}
            className="flex-1"
          >
            Edit
          </Button>

          {!showConfirm ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowConfirm(true)}
              className="flex-1"
            >
              Delete
            </Button>
          ) : (
            <div className="flex-1 flex gap-1">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? 'Deleting...' : 'Yes'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="flex-1"
              >
                No
              </Button>
            </div>
          )}
        </div>
      </div>

      <EditSubscriptionModal
        subscription={subscription}
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
      />
    </>
  )
}
