'use client'

import { useState } from 'react'

interface CancellationData {
  steps: string[]
  cancellationUrl: string | null
  hasServiceConfig: boolean
}

interface CancellationWizardProps {
  subscriptionId: string
}

type WizardState = 'idle' | 'steps' | 'confirming' | 'confirmed'

export function CancellationWizard({ subscriptionId }: CancellationWizardProps) {
  const [data, setData] = useState<CancellationData | null>(null)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wizardState, setWizardState] = useState<WizardState>('idle')
  const [savedAmount, setSavedAmount] = useState<number | null>(null)

  const loadInstructions = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel-instructions`)

      if (!response.ok) {
        throw new Error('Failed to load cancellation instructions')
      }

      const result = await response.json()
      setData(result)
      setWizardState('steps')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const toggleStep = (index: number) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(index)) {
      newCompleted.delete(index)
    } else {
      newCompleted.add(index)
    }
    setCompletedSteps(newCompleted)
  }

  const confirmCancelled = async () => {
    setWizardState('confirming')
    setError(null)
    try {
      const response = await fetch(
        `/api/subscriptions/${subscriptionId}/confirm-cancelled`,
        { method: 'POST' }
      )

      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.error || 'Failed to confirm cancellation')
      }

      const result = await response.json()
      setSavedAmount(result.savedAmount ?? null)
      setWizardState('confirmed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setWizardState('steps')
    }
  }

  if (wizardState === 'idle') {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Manual Cancellation Instructions</h2>
        <p className="text-gray-600 mb-4">
          Need help canceling this subscription? We can provide step-by-step instructions.
        </p>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <button
          onClick={loadInstructions}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Show Cancellation Instructions'}
        </button>
      </div>
    )
  }

  if (wizardState === 'confirmed') {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-4 rounded">
          <p className="text-lg font-semibold mb-1">Subscription cancelled!</p>
          <p className="text-sm">
            Your subscription has been marked as cancelled.
            {savedAmount != null && savedAmount > 0 && (
              <> You&apos;re saving <strong>${savedAmount.toFixed(2)}/year</strong>.</>
            )}
          </p>
          <p className="text-sm mt-1">Check your email for a cancellation confirmation from the service.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Cancel Subscription</h2>
        <p className="text-gray-600 text-sm">Follow these steps to cancel your subscription</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-3 mb-6">
        {data?.steps.map((step, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer"
            onClick={() => toggleStep(index)}
          >
            <input
              type="checkbox"
              checked={completedSteps.has(index)}
              onChange={() => toggleStep(index)}
              className="mt-1 h-5 w-5 text-blue-600 rounded"
            />
            <div className="flex-1">
              <span
                className={
                  completedSteps.has(index)
                    ? 'text-gray-500 line-through'
                    : 'text-gray-900'
                }
              >
                {step}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-4 border-t flex-wrap">
        {data?.cancellationUrl && (
          <a
            href={data.cancellationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Open cancellation page
          </a>
        )}
        <button
          onClick={confirmCancelled}
          disabled={wizardState === 'confirming'}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {wizardState === 'confirming' ? 'Confirming...' : "I've cancelled it \u2713"}
        </button>
      </div>
    </div>
  )
}
