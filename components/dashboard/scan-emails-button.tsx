'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ScanEmailsButtonProps {
  isGmailConnected: boolean
}

export function ScanEmailsButton({ isGmailConnected }: ScanEmailsButtonProps) {
  const [isScanning, setIsScanning] = useState(false)

  async function handleScan() {
    setIsScanning(true)

    try {
      const response = await fetch('/api/email/scan', { method: 'POST' })

      if (response.ok) {
        alert('Scan started! New subscriptions will appear in a few minutes.')
        setTimeout(() => window.location.reload(), 5000)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to start scan')
      }
    } catch (error) {
      console.error('Scan error:', error)
      alert('Failed to start scan')
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
    <Button onClick={handleScan} disabled={isScanning} variant="outline" size="sm">
      {isScanning ? 'Scanning...' : '🔍 Scan Emails'}
    </Button>
  )
}
