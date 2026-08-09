'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CheckCircle, X } from 'lucide-react'

export function UpgradeSuccessToast() {
  const searchParams = useSearchParams()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      setShow(true)
      // Remove query param from URL
      window.history.replaceState({}, '', '/dashboard')
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setShow(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  if (!show) return null

  return (
    <div className="fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg flex items-start gap-3 z-50">
      <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="font-semibold">Welcome to Premium!</h4>
        <p className="text-sm text-green-100">
          You now have access to all features.
        </p>
      </div>
      <button
        onClick={() => setShow(false)}
        className="text-green-200 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
