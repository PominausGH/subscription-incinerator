'use client'

import { useState } from 'react'
import { signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type Props = {
  token: string
  inviteEmail: string
  accountExists: boolean
  sessionEmail: string | null
}

export function AcceptInviteForm({ token, inviteEmail, accountExists, sessionEmail }: Props) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sessionMatches = sessionEmail?.toLowerCase() === inviteEmail.toLowerCase()

  async function acceptAsLoggedInUser() {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/household/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(typeof body?.error === 'string' ? body.error : 'Failed to accept invite')
      }
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite')
    } finally {
      setIsLoading(false)
    }
  }

  async function createAccountAndAccept(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/household/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(typeof body?.error === 'string' ? body.error : 'Failed to accept invite')
      }

      const result = await signIn('credentials', { email: inviteEmail, password, redirect: false })
      if (result?.error) {
        throw new Error('Account created, but automatic sign-in failed - please log in manually.')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite')
    } finally {
      setIsLoading(false)
    }
  }

  if (sessionEmail && !sessionMatches) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">
          This invite is for <strong>{inviteEmail}</strong>, but you&apos;re logged in as{' '}
          <strong>{sessionEmail}</strong>.
        </p>
        <button
          onClick={() => signOut({ callbackUrl: `/household/accept/${token}` })}
          className="text-sm font-medium text-fire-500 hover:underline"
        >
          Log out and try again
        </button>
      </div>
    )
  }

  if (sessionMatches) {
    return (
      <div className="space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={acceptAsLoggedInUser}
          disabled={isLoading}
          className="w-full px-6 py-3 bg-fire-500 hover:bg-fire-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Accepting...' : 'Accept Invite'}
        </button>
      </div>
    )
  }

  if (accountExists) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          An account already exists for {inviteEmail}. Log in with that account to accept the invite.
        </p>
        <a
          href={`/login?callbackUrl=${encodeURIComponent(`/household/accept/${token}`)}`}
          className="block text-center w-full px-6 py-3 bg-fire-500 hover:bg-fire-600 text-white font-semibold rounded-lg transition-colors"
        >
          Log in to accept
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={createAccountAndAccept} className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Create a password to set up your account and join the household.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          disabled={isLoading}
          autoComplete="new-password"
          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-3 bg-fire-500 hover:bg-fire-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Joining...' : 'Create Account & Join'}
      </button>
    </form>
  )
}
