'use client'

import { useState } from 'react'
import { Leaf, Star, ExternalLink, Code2, Search, Sparkles } from 'lucide-react'

type Alternative = {
  id: string
  serviceName: string
  alternativeName: string
  description: string
  websiteUrl: string | null
  sourceCodeUrl: string | null
  stars: number
  license: string | null
  category: string | null
}

type Props = {
  grouped: Record<string, Alternative[]>
  matchedServiceNames: string[]
}

function formatStars(stars: number): string {
  return stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars.toString()
}

function AlternativeCard({ alt, isMatched, yearlySaving, isAI }: {
  alt: Alternative
  isMatched: boolean
  yearlySaving?: number | null
  isAI?: boolean
}) {
  return (
    <div className={`border rounded-lg p-4 ${
      isMatched
        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
        : 'border-emerald-100 dark:border-gray-700 bg-emerald-50/50 dark:bg-gray-800'
    }`}>
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-gray-900 dark:text-white">
            {alt.alternativeName}
          </span>
          {alt.stars > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-amber-600">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {formatStars(alt.stars)}
            </span>
          )}
          {alt.license && (
            <span className="px-1.5 py-0.5 text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded font-medium">
              {alt.license}
            </span>
          )}
          {isMatched && (
            <span className="px-1.5 py-0.5 text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 rounded font-medium">
              You have {alt.serviceName}
            </span>
          )}
          {isAI && (
            <span className="px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 rounded font-medium flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" /> AI suggestion
            </span>
          )}
        </div>
        {yearlySaving != null && yearlySaving > 0 && (
          <span className="text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
            Save ~${yearlySaving}/yr
          </span>
        )}
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5">{alt.description}</p>
      <div className="flex items-center gap-3 mt-2">
        {alt.websiteUrl && (
          <a href={alt.websiteUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 hover:underline">
            <ExternalLink className="h-3 w-3" /> Website
          </a>
        )}
        {alt.sourceCodeUrl && (
          <a href={alt.sourceCodeUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 hover:underline">
            <Code2 className="h-3 w-3" /> Source
          </a>
        )}
      </div>
    </div>
  )
}

export function OpenSourcePageClient({ grouped, matchedServiceNames }: Props) {
  const [query, setQuery] = useState('')
  const [monthlyPrice, setMonthlyPrice] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Alternative[] | null>(null)
  const [searchSource, setSearchSource] = useState<'db' | 'ai' | null>(null)
  const [yearlySaving, setYearlySaving] = useState<number | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)

  const matchedSet = new Set(matchedServiceNames.map(n => n.toLowerCase()))

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setIsSearching(true)
    setSearchError(null)
    setSearchResults(null)
    try {
      const res = await fetch('/api/open-source/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: query.trim(),
          monthlyPrice: monthlyPrice ? parseFloat(monthlyPrice) : undefined,
        }),
      })
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setSearchResults(data.alternatives)
      setSearchSource(data.source)
      setYearlySaving(data.yearlySaving)
    } catch {
      setSearchError('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  // Sort categories: matched first, then alphabetical
  const categories = Object.keys(grouped).sort((a, b) => {
    const aMatched = grouped[a].some(alt => matchedSet.has(alt.serviceName.toLowerCase()))
    const bMatched = grouped[b].some(alt => matchedSet.has(alt.serviceName.toLowerCase()))
    if (aMatched && !bMatched) return -1
    if (!aMatched && bMatched) return 1
    return a.localeCompare(b)
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Leaf className="h-8 w-8 text-emerald-500" />
          Open Source Alternatives
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Switch to these free open source tools and keep more money in your pocket.
          Many are self-hostable or have generous free tiers.
        </p>
      </div>

      {/* Search panel */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
          Thinking of subscribing to something?
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Enter the service name and we&apos;ll find free alternatives before you spend a penny.
        </p>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. Notion, Figma, Slack..."
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
          <div className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={monthlyPrice}
              onChange={e => setMonthlyPrice(e.target.value)}
              placeholder="0.00"
              className="w-20 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none"
            />
            <span className="text-gray-400 text-xs">/mo</span>
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Search className="h-4 w-4" />
            {isSearching ? 'Searching...' : 'Find alternatives'}
          </button>
        </form>

        {searchError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{searchError}</p>
        )}

        {searchResults !== null && (
          <div className="mt-4">
            {searchResults.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No open source alternatives found for &ldquo;{query}&rdquo;.
              </p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {searchResults.length} alternative{searchResults.length !== 1 ? 's' : ''} found for &ldquo;{query}&rdquo;
                  {yearlySaving != null && yearlySaving > 0 ? ` — switch and save up to $${yearlySaving}/yr` : ''}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map(alt => (
                    <AlternativeCard
                      key={alt.id}
                      alt={alt}
                      isMatched={false}
                      yearlySaving={yearlySaving}
                      isAI={searchSource === 'ai'}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Category sections */}
      {categories.map(category => {
        const alts = grouped[category]
        const hasMatch = alts.some(alt => matchedSet.has(alt.serviceName.toLowerCase()))
        return (
          <div key={category}>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              {category}
              {hasMatch && (
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400 normal-case tracking-normal">
                  — you have a subscription here
                </span>
              )}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {alts.map(alt => (
                <AlternativeCard
                  key={alt.id}
                  alt={alt}
                  isMatched={matchedSet.has(alt.serviceName.toLowerCase())}
                />
              ))}
            </div>
          </div>
        )
      })}

      {categories.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No alternatives in the database yet. Use the search above to find options with AI.
        </p>
      )}
    </div>
  )
}
