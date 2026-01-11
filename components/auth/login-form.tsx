'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('email', { email, redirect: false })
      if (result?.error) {
        setError('Failed to send magic link. Please try again.')
        setIsSuccess(false)
      } else {
        setIsSuccess(true)
        setError(null)
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Failed to send magic link. Please try again.')
      setIsSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center" aria-live="polite">
        <h2 className="text-2xl font-bold mb-2">Check your email</h2>
        <p className="text-gray-600">
          We sent a magic link to <strong>{email}</strong>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email address
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError(null)
          }}
          required
          disabled={isLoading}
          autoComplete="email"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send magic link'}
      </Button>
    </form>
  )
}
