'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface PendingSubscriptionCardProps {
  item: {
    id: string
    serviceName: string
    confidence: number
    amount: number | null
    currency: string
    nextBillingDate: Date | null
    emailFrom: string
    emailDate: Date
  }
}

export function PendingSubscriptionCard({ item }: PendingSubscriptionCardProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setError(null)
    setIsProcessing(true)

    try {
      const response = await fetch('/api/pending-subscriptions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingId: item.id })
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to approve subscription')
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Approve error:', error)
      setError('Failed to approve subscription')
      setIsProcessing(false)
    }
  }

  async function handleDismiss() {
    setError(null)
    setIsProcessing(true)

    try {
      const response = await fetch('/api/pending-subscriptions/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingId: item.id })
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to dismiss subscription')
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Dismiss error:', error)
      setError('Failed to dismiss subscription')
      setIsProcessing(false)
    }
  }

  const confidencePercent = Math.round(item.confidence * 100)
  const formattedDate = new Date(item.emailDate).toLocaleDateString()
  const formattedBillingDate = item.nextBillingDate
    ? new Date(item.nextBillingDate).toLocaleDateString()
    : null

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-blue-300 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-gray-900">{item.serviceName}</h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
            {confidencePercent}% match
          </span>
        </div>

        {item.amount && (
          <div className="mt-1 text-sm text-gray-600">
            {item.currency}{item.amount.toString()}
            {formattedBillingDate && (
              <> · Next billing: {formattedBillingDate}</>
            )}
          </div>
        )}

        <div className="mt-1 text-xs text-gray-500">
          From: {item.emailFrom} · {formattedDate}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-2">{error}</p>
      )}

      <div className="flex gap-2 ml-4">
        <Button
          onClick={handleApprove}
          disabled={isProcessing}
          size="sm"
          variant="default"
        >
          {isProcessing ? 'Adding...' : 'Add This'}
        </Button>
        <Button
          onClick={handleDismiss}
          disabled={isProcessing}
          size="sm"
          variant="ghost"
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}
