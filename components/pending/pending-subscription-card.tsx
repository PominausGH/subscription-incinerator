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
    billingCycle: string | null
    nextBillingDate: Date | null
    emailFrom: string
    emailDate: Date
    emailId: string
    emailSubject: string
  }
  gmailEmail?: string
}

const currencySymbols: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$', NZD: 'NZ$', JPY: '¥', CHF: 'CHF '
}

export function PendingSubscriptionCard({ item, gmailEmail }: PendingSubscriptionCardProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const currencySymbol = currencySymbols[item.currency] || item.currency + ' '

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

  // Gmail link to view the original email (uses authuser param to open correct account)
  const gmailLink = gmailEmail
    ? `https://mail.google.com/mail/u/?authuser=${encodeURIComponent(gmailEmail)}#inbox/${item.emailId}`
    : `https://mail.google.com/mail/u/0/#inbox/${item.emailId}`

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-blue-300 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-gray-900">{item.serviceName}</h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
            {confidencePercent}% match
          </span>
        </div>

        {(item.amount || item.billingCycle) && (
          <div className="mt-1 text-sm text-gray-800">
            {item.amount && (
              <>
                {currencySymbol}{item.amount.toFixed(2)}
                {item.billingCycle && <span className="text-gray-700">/{item.billingCycle === 'yearly' ? 'year' : item.billingCycle === 'monthly' ? 'mo' : item.billingCycle === 'fortnightly' ? '2wks' : 'wk'}</span>}
              </>
            )}
            {!item.amount && item.billingCycle && (
              <span className="capitalize">{item.billingCycle}</span>
            )}
            {formattedBillingDate && (
              <> · Next billing: {formattedBillingDate}</>
            )}
          </div>
        )}

        <div className="mt-1 text-xs text-gray-700">
          From: {item.emailFrom} · {formattedDate}
        </div>

        <a
          href={gmailLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
          title={item.emailSubject}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          View original email
        </a>
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
