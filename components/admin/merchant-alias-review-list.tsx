'use client'

import { useState } from 'react'

type PendingAlias = {
  id: string
  bankPattern: string
  serviceName: string
  sampleDescription: string
  confidence: number
  createdAt: string
}

export function MerchantAliasReviewList({ initialPending }: { initialPending: PendingAlias[] }) {
  const [pending, setPending] = useState(initialPending)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setProcessingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/merchant-aliases/${id}/${action}`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(typeof body?.error === 'string' ? body.error : `Failed to ${action}`)
      }
      setPending((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`)
    } finally {
      setProcessingId(null)
    }
  }

  if (pending.length === 0) {
    return <p className="text-sm text-gray-600">Nothing waiting for review.</p>
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm" role="alert">
          {error}
        </div>
      )}
      {pending.map((item) => (
        <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">{item.serviceName}</p>
              <p className="text-sm text-gray-600 mt-1">
                Pattern: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{item.bankPattern}</code>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Sample transaction: <span className="text-gray-900">{item.sampleDescription}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                AI confidence: {Math.round(item.confidence * 100)}% · queued {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => handleAction(item.id, 'approve')}
                disabled={processingId === item.id}
                className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => handleAction(item.id, 'reject')}
                disabled={processingId === item.id}
                className="px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
