'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCategoryIcon } from '@/lib/categories/presets'
import { SUPPORTED_CURRENCIES } from '@/lib/currency/exchange-rates'

type Category = {
  id: string
  name: string
  isPreset: boolean
}

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
}

interface EditSubscriptionModalProps {
  subscription: Subscription
  isOpen: boolean
  onClose: () => void
}

export function EditSubscriptionModal({ subscription, isOpen, onClose }: EditSubscriptionModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  const formatDateForInput = (date: Date | null) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toISOString().slice(0, 16)
  }

  const [formData, setFormData] = useState({
    serviceName: subscription.serviceName,
    status: subscription.status as 'trial' | 'active' | 'cancelled',
    billingCycle: subscription.billingCycle || 'monthly',
    amount: subscription.amount?.toString() || '',
    currency: subscription.currency || 'USD',
    trialEndsAt: formatDateForInput(subscription.trialEndsAt),
    nextBillingDate: formatDateForInput(subscription.nextBillingDate),
    cancellationUrl: subscription.cancellationUrl || '',
    type: subscription.type || 'PERSONAL',
    categoryId: subscription.categoryId || '',
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
        amount: formData.amount ? parseFloat(formData.amount) : null,
        currency: formData.currency,
        trialEndsAt: formData.trialEndsAt ? new Date(formData.trialEndsAt).toISOString() : null,
        nextBillingDate: formData.nextBillingDate ? new Date(formData.nextBillingDate).toISOString() : null,
        cancellationUrl: formData.cancellationUrl || null,
        type: formData.type,
        categoryId: formData.categoryId || null,
      }

      const response = await fetch(`/api/subscriptions/${subscription.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to update subscription')
      }

      router.refresh()
      onClose()
    } catch (error) {
      console.error('Update subscription error')
      setError('Failed to update subscription. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Edit Subscription</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700 mb-1">
                Service Name
              </label>
              <Input
                id="serviceName"
                value={formData.serviceName}
                onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {getCategoryIcon(cat.name)} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount
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
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'trial' | 'active' | 'cancelled' })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'PERSONAL' | 'BUSINESS' })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="PERSONAL">Personal</option>
                <option value="BUSINESS">Business</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="billingCycle" className="block text-sm font-medium text-gray-700 mb-1">
              Billing Cycle
            </label>
            <select
              id="billingCycle"
              value={formData.billingCycle}
              onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="weekly">Weekly</option>
              <option value="fortnightly">Fortnightly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
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

          <div>
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

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
