'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function CookieNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('si-cookie-ack')) {
      setVisible(true)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem('si-cookie-ack', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-dark-700 border-t border-dark-500 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <p className="text-sm text-gray-400 flex-1">
        We use privacy-friendly analytics (self-hosted, no personal data collected).{' '}
        <Link href="/privacy" className="text-fire-400 hover:underline">
          Privacy policy
        </Link>
      </p>
      <button
        onClick={dismiss}
        className="flex-shrink-0 px-4 py-1.5 text-sm font-semibold bg-fire-500 hover:bg-fire-600 text-white rounded-lg transition-colors"
      >
        Got it
      </button>
    </div>
  )
}
