'use client'

import { useEffect, useState } from 'react'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function VerifyEmailBanner({ email }: { email: string }) {
  const [status, setStatus] = useState<Status>('idle')
  const [flash, setFlash] = useState<'ok' | 'invalid' | null>(null)

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('verified')
    if (v === '1') setFlash('ok')
    else if (v === 'invalid') setFlash('invalid')
  }, [])

  async function resend() {
    setStatus('sending')
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div role="status" className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 text-sm text-amber-900 dark:text-amber-100 flex flex-wrap items-center gap-x-3 gap-y-1">
        {flash === 'invalid' && <span>That confirmation link is invalid or has expired.</span>}
        <span>
          Confirm your email ({email}) to receive renewal reminders and savings updates. Until then we won&apos;t email you.
        </span>
        {status === 'sent' ? (
          <span className="font-medium">Sent. Check your inbox.</span>
        ) : (
          <button
            type="button"
            onClick={resend}
            disabled={status === 'sending'}
            className="font-medium underline disabled:opacity-60"
          >
            {status === 'sending' ? 'Sending…' : status === 'error' ? 'Failed, try again' : 'Resend confirmation email'}
          </button>
        )}
      </div>
    </div>
  )
}
