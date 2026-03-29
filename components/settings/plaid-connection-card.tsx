'use client'

import { useState, useCallback } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { Building2, CheckCircle, RefreshCw } from 'lucide-react'

type ConnectedInstitution = { id: string; institutionName: string | null }

type Props = {
  connectedInstitutions: ConnectedInstitution[]
}

export function PlaidConnectionCard({ connectedInstitutions }: Props) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [institutions, setInstitutions] = useState(connectedInstitutions)
  const [loading, setLoading] = useState(false)

  async function getLinkToken() {
    setLoading(true)
    const res = await fetch('/api/plaid/link-token', { method: 'POST' })
    if (!res.ok) {
      setLoading(false)
      return
    }
    const data = await res.json()
    setLinkToken(data.linkToken)
    setLoading(false)
  }

  const onSuccess = useCallback(
    async (publicToken: string, metadata: { institution: { name: string } }) => {
      await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicToken,
          institutionName: metadata.institution.name,
        }),
      })
      setInstitutions((prev) => [
        ...prev,
        { id: Date.now().toString(), institutionName: metadata.institution.name },
      ])
      setLinkToken(null)
    },
    []
  )

  const { open, ready } = usePlaidLink({
    token: linkToken ?? '',
    onSuccess,
  })

  async function syncAll() {
    setSyncing(true)
    await fetch('/api/plaid/sync', { method: 'POST' })
    setSyncing(false)
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Bank Accounts</h3>
        </div>
        {institutions.length > 0 && (
          <button
            onClick={syncAll}
            disabled={syncing}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            Sync now
          </button>
        )}
      </div>

      {institutions.length > 0 ? (
        <div className="space-y-2 mb-4">
          {institutions.map((inst) => (
            <div key={inst.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {inst.institutionName ?? 'Unknown Bank'}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 mb-4">
          Connect your bank to automatically detect subscriptions from transactions
        </p>
      )}

      <button
        onClick={linkToken && ready ? () => open() : getLinkToken}
        disabled={loading || (!!linkToken && !ready)}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg py-2 transition-colors"
      >
        {loading ? 'Loading...' : linkToken ? 'Open Bank Connection' : '+ Connect Bank Account'}
      </button>
    </div>
  )
}
