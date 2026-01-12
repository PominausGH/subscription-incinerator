'use client'

import { useState } from 'react'

interface CancellationInstructions {
  serviceName: string
  cancellationUrl: string | null
  supportUrl: string | null
  logoUrl: string | null
  instructions: string[]
}

interface CancellationWizardProps {
  subscriptionId: string
}

export function CancellationWizard({ subscriptionId }: CancellationWizardProps) {
  const [instructions, setInstructions] = useState<CancellationInstructions | null>(null)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadInstructions = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel-instructions`)

      if (!response.ok) {
        throw new Error('Failed to load cancellation instructions')
      }

      const data = await response.json()
      setInstructions(data)
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

  const allStepsCompleted = instructions && completedSteps.size === instructions.instructions.length

  if (!instructions) {
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-4 mb-6">
        {instructions.logoUrl && (
          <img
            src={instructions.logoUrl}
            alt={`${instructions.serviceName} logo`}
            className="w-12 h-12 rounded"
          />
        )}
        <div>
          <h2 className="text-xl font-semibold">
            Cancel {instructions.serviceName}
          </h2>
          <p className="text-gray-600 text-sm">Follow these steps to cancel your subscription</p>
        </div>
      </div>

      {allStepsCompleted && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-6">
          <p className="font-semibold">All steps completed!</p>
          <p className="text-sm">
            Your subscription should now be canceled. Please check your email for confirmation.
          </p>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {instructions.instructions.map((instruction, index) => (
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
                {instruction}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-4 border-t">
        {instructions.cancellationUrl && (
          <a
            href={instructions.cancellationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Cancellation Page
          </a>
        )}
        {instructions.supportUrl && (
          <a
            href={instructions.supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Contact Support
          </a>
        )}
      </div>
    </div>
  )
}
