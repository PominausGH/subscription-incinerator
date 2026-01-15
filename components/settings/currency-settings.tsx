'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SUPPORTED_CURRENCIES } from '@/lib/currency/exchange-rates'

interface CurrencySettingsProps {
  currentCurrency: string
}

export function CurrencySettings({ currentCurrency }: CurrencySettingsProps) {
  const router = useRouter()
  const [currency, setCurrency] = useState(currentCurrency)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSave() {
    if (currency === currentCurrency) return

    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/settings/currency', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeCurrency: currency }),
      })

      if (!response.ok) {
        throw new Error('Failed to update currency')
      }

      setMessage({ type: 'success', text: 'Currency updated successfully' })
      router.refresh()
    } catch (error) {
      console.error('Save error:', error)
      setMessage({ type: 'error', text: 'Failed to update currency' })
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanged = currency !== currentCurrency

  return (
    <div>
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label htmlFor="homeCurrency" className="block text-sm font-medium text-gray-700 mb-1">
            Home Currency
          </label>
          <select
            id="homeCurrency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="flex h-10 w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SUPPORTED_CURRENCIES.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.code} - {curr.name} ({curr.symbol})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            All subscription costs will be converted to this currency in reports.
          </p>
        </div>

        {hasChanged && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      {message && (
        <p className={`mt-2 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  )
}
