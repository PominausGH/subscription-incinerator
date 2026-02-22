'use client'

import { useState } from 'react'
import { signInWithMagicLink } from '@/lib/auth'
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
    setError(null)

    try {
      const result = await signInWithMagicLink(email)
      
      if (!result.success) {
        console.error('Login failed:', result.code, result.error)
        setError(result.error || 'Failed to send magic link. Please try again.')
        setIsSuccess(false)
      } else {
        setIsSuccess(true)
        setError(null)
      }
    } catch (error) {
      console.error('Unexpected login error:', error)
      setError('An unexpected error occurred. Please try again.')
      setIsSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center" aria-live="polite">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Check your email</h2>
        <p className="text-gray-600">
          We sent a magic link to <strong>{email}</strong>
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Didn&apos;t receive it? Check your spam folder or{' '}
          <button 
            onClick={() => { setIsSuccess(false); setEmail(''); }}
            className="text-blue-600 hover:text-blue-500 underline"
          >
            try again
          </button>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm" role="alert">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
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
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Sending...
          </>
        ) : (
          'Send magic link'
        )}
      </Button>
    </form>
  )
}
