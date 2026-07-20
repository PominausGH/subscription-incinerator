'use client'

import { useState } from 'react'

export function FreeChecklistForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/email/checklist-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send')
      }

      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-dark-800 border border-green-500/30 rounded-xl p-6 text-center">
        <span className="text-3xl mb-3 block">✉️</span>
        <p className="text-white font-semibold text-lg mb-1">Checklist sent!</p>
        <p className="text-gray-400 text-sm">Check your inbox — it should arrive within a minute.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 bg-dark-700 border border-dark-500 text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-fire-500 transition-colors"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-6 py-3 bg-fire-500 hover:bg-fire-600 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors text-sm whitespace-nowrap"
        >
          {status === 'loading' ? 'Sending…' : 'Send My Checklist'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-red-400 text-xs">{errorMsg}</p>
      )}
    </form>
  )
}
