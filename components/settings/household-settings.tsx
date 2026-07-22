'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type HouseholdMember = { id: string; email: string }
type PendingInvite = { id: string; email: string; createdAt: string; expiresAt: string }

type HouseholdData = {
  isOwner: boolean
  owner: HouseholdMember
  members: HouseholdMember[]
  pendingInvites: PendingInvite[]
}

export function HouseholdSettings() {
  const router = useRouter()
  const [data, setData] = useState<HouseholdData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/household')
      if (res.ok) {
        setData(await res.json())
      }
    } catch {
      console.error('Failed to load household')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setIsInviting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/household/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const body = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(typeof body?.error === 'string' ? body.error : 'Failed to send invite')
      }

      setMessage({ type: 'success', text: `Invite sent to ${inviteEmail.trim()}` })
      setInviteEmail('')
      await load()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to send invite' })
    } finally {
      setIsInviting(false)
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      const res = await fetch(`/api/household/members/${memberId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove member')
      await load()
    } catch {
      setMessage({ type: 'error', text: 'Failed to remove member' })
    }
  }

  async function handleLeave() {
    try {
      const res = await fetch('/api/household/leave', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to leave household')
      await load()
      router.refresh()
    } catch {
      setMessage({ type: 'error', text: 'Failed to leave household' })
    }
  }

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading...</p>
  }

  if (!data) {
    return <p className="text-sm text-red-600">Failed to load household settings.</p>
  }

  if (!data.isOwner) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-800">
          You&apos;re part of <strong>{data.owner.email}</strong>&apos;s household. Their Premium
          features and combined subscription view apply to you too.
        </p>
        <button
          onClick={handleLeave}
          className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
        >
          Leave household
        </button>
        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleInvite} className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Invite a family member
          </label>
          <input
            id="inviteEmail"
            type="email"
            placeholder="partner@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            disabled={isInviting}
            className="flex h-10 w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={isInviting}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isInviting ? 'Sending...' : 'Send Invite'}
        </button>
      </form>

      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}

      {data.members.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Members</h3>
          <ul className="space-y-2">
            {data.members.map((member) => (
              <li key={member.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-md px-3 py-2">
                <span className="text-gray-900">{member.email}</span>
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-red-600 hover:underline text-xs font-medium"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.pendingInvites.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Pending invites</h3>
          <ul className="space-y-2">
            {data.pendingInvites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-md px-3 py-2">
                <span className="text-gray-600">{invite.email}</span>
                <span className="text-xs text-gray-400">
                  Expires {new Date(invite.expiresAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
