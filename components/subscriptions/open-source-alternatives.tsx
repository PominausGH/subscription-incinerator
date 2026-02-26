'use client'

import { useState } from 'react'
import { Leaf, Star, ExternalLink, Code2, ChevronDown, ChevronUp } from 'lucide-react'

type Alternative = {
  id: string
  alternativeName: string
  description: string
  websiteUrl: string | null
  sourceCodeUrl: string | null
  stars: number
  license: string | null
  category: string | null
}

function formatStars(stars: number): string {
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(1)}k`
  }
  return stars.toString()
}

export function OpenSourceAlternatives({ subscriptionId }: { subscriptionId: string }) {
  const [alternatives, setAlternatives] = useState<Alternative[] | null>(null)
  const [serviceName, setServiceName] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle() {
    if (alternatives !== null) {
      setIsOpen(!isOpen)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/alternatives`)
      if (!response.ok) {
        throw new Error('Failed to fetch alternatives')
      }
      const data = await response.json()
      setAlternatives(data.alternatives)
      setServiceName(data.serviceName)
      setIsOpen(true)
    } catch {
      setError('Failed to load alternatives')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-3">
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors disabled:opacity-50"
      >
        <Leaf className="h-4 w-4" />
        {isLoading ? 'Loading...' : 'Open-source alternatives'}
        {!isLoading && alternatives !== null && (
          isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>

      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}

      {isOpen && alternatives !== null && (
        <div className="mt-2 space-y-2">
          {alternatives.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              No open-source alternatives found for {serviceName}
            </p>
          ) : (
            alternatives.map((alt) => (
              <div
                key={alt.id}
                className="border border-emerald-100 bg-emerald-50/50 rounded-lg p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">
                        {alt.alternativeName}
                      </span>
                      {alt.stars > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-amber-600">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {formatStars(alt.stars)}
                        </span>
                      )}
                      {alt.license && (
                        <span className="px-1.5 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded font-medium">
                          {alt.license}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{alt.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  {alt.websiteUrl && (
                    <a
                      href={alt.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Website
                    </a>
                  )}
                  {alt.sourceCodeUrl && (
                    <a
                      href={alt.sourceCodeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      <Code2 className="h-3 w-3" />
                      Source
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
