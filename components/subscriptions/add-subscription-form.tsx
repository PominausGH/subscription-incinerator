'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AddSubscriptionForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    serviceName: '',
    status: 'active' as 'trial' | 'active',
    billingCycle: 'monthly' as 'monthly' | 'yearly' | 'custom',
    amount: '',
    currency: 'USD',
    trialEndsAt: '',
    nextBillingDate: '',
    cancellationUrl: '',
  })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const payload = {
        serviceName: formData.serviceName,
        status: formData.status,
        billingCycle: formData.billingCycle,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        currency: formData.currency,
        trialEndsAt: formData.trialEndsAt ? new Date(formData.trialEndsAt).toISOString() : undefined,
        nextBillingDate: formData.nextBillingDate ? new Date(formData.nextBillingDate).toISOString() : undefined,
        cancellationUrl: formData.cancellationUrl || undefined,
      }

      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to create subscription')
      }

      router.refresh()

      // Reset form
      setFormData({
        serviceName: '',
        status: 'active',
        billingCycle: 'monthly',
        amount: '',
        currency: 'USD',
        trialEndsAt: '',
        nextBillingDate: '',
        cancellationUrl: '',
      })
    } catch (error) {
      console.error('Submit error:', error)
      setError('Failed to add subscription. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium">Add Subscription</h3>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700 mb-1">
            Service Name *
          </label>
          <Input
            id="serviceName"
            value={formData.serviceName}
            onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
            placeholder="Netflix, Spotify, etc."
            required
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'trial' | 'active' })}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="trial">Free Trial</option>
            <option value="active">Active</option>
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount ($)
          </label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="9.99"
          />
        </div>

        <div>
          <label htmlFor="billingCycle" className="block text-sm font-medium text-gray-700 mb-1">
            Billing Cycle
          </label>
          <select
            id="billingCycle"
            value={formData.billingCycle}
            onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as 'monthly' | 'yearly' | 'custom' })}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
            Currency
          </label>
          <select
            id="currency"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>

        {formData.status === 'trial' && (
          <div>
            <label htmlFor="trialEndsAt" className="block text-sm font-medium text-gray-700 mb-1">
              Trial Ends
            </label>
            <Input
              id="trialEndsAt"
              type="datetime-local"
              value={formData.trialEndsAt}
              onChange={(e) => setFormData({ ...formData, trialEndsAt: e.target.value })}
            />
          </div>
        )}

        <div>
          <label htmlFor="nextBillingDate" className="block text-sm font-medium text-gray-700 mb-1">
            Next Billing Date
          </label>
          <Input
            id="nextBillingDate"
            type="datetime-local"
            value={formData.nextBillingDate}
            onChange={(e) => setFormData({ ...formData, nextBillingDate: e.target.value })}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="cancellationUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Cancellation URL
          </label>
          <Input
            id="cancellationUrl"
            type="url"
            value={formData.cancellationUrl}
            onChange={(e) => setFormData({ ...formData, cancellationUrl: e.target.value })}
            placeholder="https://example.com/cancel"
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Adding...' : 'Add Subscription'}
      </Button>
    </form>
  )
}
