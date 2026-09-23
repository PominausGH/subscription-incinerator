'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [homeCurrency, setHomeCurrency] = useState('USD')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, homeCurrency }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed.')
        setIsLoading(false)
        return
      }

      if (typeof window !== 'undefined' && window.umami) {
        window.umami.track('signup')
      }

      // Auto-login after successful registration
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        // Registration succeeded but login failed - redirect to login
        router.push('/login')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      console.error('Registration error')
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-md text-sm">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="register-email" className="block text-sm font-medium text-gray-300 mb-1">
          Email address
        </label>
        <Input
          className="bg-dark-800 border-dark-600 text-white placeholder:text-gray-600 focus:ring-fire-500/60"
          id="register-email"
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
      <div>
        <label htmlFor="register-password" className="block text-sm font-medium text-gray-300 mb-1">
          Password
        </label>
        <Input
          className="bg-dark-800 border-dark-600 text-white placeholder:text-gray-600 focus:ring-fire-500/60"
          id="register-password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError(null)
          }}
          required
          minLength={8}
          disabled={isLoading}
          autoComplete="new-password"
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-1">
          Confirm password
        </label>
        <Input
          className="bg-dark-800 border-dark-600 text-white placeholder:text-gray-600 focus:ring-fire-500/60"
          id="confirm-password"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value)
            setError(null)
          }}
          required
          minLength={8}
          disabled={isLoading}
          autoComplete="new-password"
        />
      </div>
      <div>
        <label htmlFor="home-currency" className="block text-sm font-medium text-gray-300 mb-1">
          Home Currency
        </label>
        <select
          id="home-currency"
          value={homeCurrency}
          onChange={(e) => setHomeCurrency(e.target.value)}
          className="flex h-10 w-full rounded-md border border-dark-600 bg-dark-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-fire-500/60 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading}
        >
          <option value="USD">United States (USD)</option>
          <option value="AUD">Australia (AUD)</option>
          <option value="GBP">United Kingdom (GBP)</option>
          <option value="EUR">Europe (EUR)</option>
          <option value="CAD">Canada (CAD)</option>
          <option value="NZD">New Zealand (NZD)</option>
        </select>
        <p className="mt-1 text-xs text-gray-400">
          This helps us correctly identify currency symbols like '$' in your emails.
        </p>
      </div>
      <Button type="submit" className="w-full bg-fire-700 text-white hover:bg-fire-800" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  )
}
