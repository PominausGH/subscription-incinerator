'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ScanEmailsButtonProps {
  isGmailConnected: boolean
}

export function ScanEmailsButton({ isGmailConnected }: ScanEmailsButtonProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleScan() {
    setIsScanning(true)
    setMessage(null)

    try {
      const response = await fetch('/api/email/scan', { method: 'POST' })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Scan started! New subscriptions will appear in a few minutes.' })
        setTimeout(() => window.location.reload(), 5000)
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to start scan' })
      }
    } catch {
      console.error('Scan error')
      setMessage({ type: 'error', text: 'Failed to start scan' })
    } finally {
      setIsScanning(false)
    }
  }

  if (!isGmailConnected) {
    return (
      <Button onClick={() => window.location.href = '/settings'} variant="outline" size="sm">
        Connect Gmail
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={handleScan} disabled={isScanning} variant="outline" size="sm">
        {isScanning ? 'Scanning...' : 'Scan Emails'}
      </Button>
      {message && (
        <span className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </span>
      )}
    </div>
  )
}
