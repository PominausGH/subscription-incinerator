'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type Subscription = {
  id: string
  serviceName: string
  status: string
  billingCycle: string
  amount: number | null
  trialEndsAt: Date | null
  nextBillingDate: Date | null
}

export function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

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
      console.error('Delete error:', error)
      alert('Failed to delete subscription. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 relative">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">{subscription.serviceName}</h3>
        <span className={`px-2 py-1 text-xs rounded-full ${
          subscription.status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
          subscription.status === 'active' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {subscription.status}
        </span>
      </div>

      {subscription.amount && (
        <p className="text-2xl font-bold mb-2">
          ${subscription.amount.toString()}/{subscription.billingCycle}
        </p>
      )}

      {subscription.trialEndsAt && (
        <p className="text-sm text-gray-600">
          Trial ends: {new Date(subscription.trialEndsAt).toLocaleDateString()}
        </p>
      )}

      {subscription.nextBillingDate && (
        <p className="text-sm text-gray-600">
          Next billing: {new Date(subscription.nextBillingDate).toLocaleDateString()}
        </p>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        {!showConfirm ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowConfirm(true)}
            className="w-full"
          >
            Delete
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 text-center">Delete this subscription?</p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
