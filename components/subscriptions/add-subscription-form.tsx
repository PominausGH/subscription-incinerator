'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCategoryIcon } from '@/lib/categories/presets'

type Category = {
  id: string
  name: string
  isPreset: boolean
}

export function AddSubscriptionForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    serviceName: '',
    status: 'active' as 'trial' | 'active',
    billingCycle: 'monthly' as 'weekly' | 'fortnightly' | 'monthly' | 'yearly' | 'custom',
    amount: '',
    currency: 'USD',
    trialEndsAt: '',
    nextBillingDate: '',
    cancellationUrl: '',
    categoryId: '',
  })

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
    fetchCategories()
  }, [])

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
        categoryId: formData.categoryId || undefined,
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
        categoryId: '',
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
      <div>
        <h3 className="text-lg font-medium">Add Subscription Manually</h3>
        <p className="text-sm text-gray-500 mt-1">
          Track a subscription that wasn&apos;t detected automatically. Common examples: Netflix, Spotify, ChatGPT Plus, Claude Pro, GitHub Copilot, Adobe Creative Cloud, Microsoft 365, etc.
        </p>
      </div>

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
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {getCategoryIcon(cat.name)} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'trial' | 'active' })}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as 'weekly' | 'fortnightly' | 'monthly' | 'yearly' | 'custom' })}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="weekly">Weekly</option>
            <option value="fortnightly">Fortnightly</option>
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
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="AUD">AUD - Australian Dollar</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="CNY">CNY - Chinese Yuan</option>
            <option value="INR">INR - Indian Rupee</option>
            <option value="BRL">BRL - Brazilian Real</option>
            <option value="MXN">MXN - Mexican Peso</option>
            <option value="CHF">CHF - Swiss Franc</option>
            <option value="SEK">SEK - Swedish Krona</option>
            <option value="NOK">NOK - Norwegian Krone</option>
            <option value="DKK">DKK - Danish Krone</option>
            <option value="PLN">PLN - Polish Zloty</option>
            <option value="NZD">NZD - New Zealand Dollar</option>
            <option value="SGD">SGD - Singapore Dollar</option>
            <option value="HKD">HKD - Hong Kong Dollar</option>
            <option value="KRW">KRW - South Korean Won</option>
            <option value="TRY">TRY - Turkish Lira</option>
            <option value="RUB">RUB - Russian Ruble</option>
            <option value="ZAR">ZAR - South African Rand</option>
            <option value="AED">AED - UAE Dirham</option>
            <option value="SAR">SAR - Saudi Riyal</option>
            <option value="THB">THB - Thai Baht</option>
            <option value="MYR">MYR - Malaysian Ringgit</option>
            <option value="IDR">IDR - Indonesian Rupiah</option>
            <option value="PHP">PHP - Philippine Peso</option>
            <option value="VND">VND - Vietnamese Dong</option>
            <option value="ILS">ILS - Israeli Shekel</option>
            <option value="CZK">CZK - Czech Koruna</option>
            <option value="HUF">HUF - Hungarian Forint</option>
            <option value="ARS">ARS - Argentine Peso</option>
            <option value="CLP">CLP - Chilean Peso</option>
            <option value="COP">COP - Colombian Peso</option>
            <option value="EGP">EGP - Egyptian Pound</option>
            <option value="NGN">NGN - Nigerian Naira</option>
            <option value="PKR">PKR - Pakistani Rupee</option>
            <option value="BDT">BDT - Bangladeshi Taka</option>
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
          <p className="text-xs text-gray-400 mt-1">Link to cancel the subscription (optional)</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Subscription'}
        </Button>
        <p className="text-xs text-gray-400">Only service name is required</p>
      </div>
    </form>
  )
}
