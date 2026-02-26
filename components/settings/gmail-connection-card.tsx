'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UpgradePrompt } from '@/components/upgrade-prompt'

interface GmailConnectionCardProps {
  isConnected: boolean
  userEmail: string
  userTier: string
}

export function GmailConnectionCard({ isConnected, userEmail, userTier }: GmailConnectionCardProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [scanMessage, setScanMessage] = useState('')

  if (userTier !== 'premium') {
    return (
      <UpgradePrompt
        feature="Gmail Scanning"
        description="Automatically detect subscriptions from your Gmail inbox. Upgrade to premium to unlock this feature."
      />
    )
  }

  async function handleConnect() {
    window.location.href = '/api/oauth/gmail'
  }

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect Gmail? Your existing subscriptions will not be deleted.')) {
      return
    }

    setIsDisconnecting(true)
    try {
      const response = await fetch('/api/oauth/gmail/disconnect', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect')
      }

      window.location.reload()
    } catch {
      console.error('Disconnect error')
      setScanMessage('Failed to disconnect Gmail. Please try again.')
    } finally {
      setIsDisconnecting(false)
    }
  }

  async function handleScanNow() {
    setIsScanning(true)
    setScanMessage('')

    try {
      const response = await fetch('/api/email/scan', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start scan')
      }

      setScanMessage('Scan started! Your subscriptions will appear in a few minutes.')

      // Refresh after 10 seconds
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 10000)
    } catch (err) {
      console.error('Scan error')
      setScanMessage(err instanceof Error ? err.message : 'Failed to start scan')
    } finally {
      setIsScanning(false)
    }
  }

  if (isConnected) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium text-green-900">Gmail Connected</p>
              <p className="text-sm text-green-700">{userEmail}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleScanNow}
            disabled={isScanning}
            variant="default"
            size="sm"
          >
            {isScanning ? 'Scanning...' : 'Scan Now'}
          </Button>

          <Button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            variant="outline"
            size="sm"
          >
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        </div>

        {scanMessage && (
          <p className={`mt-3 text-sm ${scanMessage.includes('Failed') ? 'text-red-700' : 'text-green-700'}`}>{scanMessage}</p>
        )}

        <p className="mt-4 text-sm text-gray-600">
          Automatic scan runs every 3 days to detect new subscriptions.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <p className="text-gray-800 mb-4">
        Gmail is not connected. Connect to automatically detect subscriptions from your emails.
      </p>

      <Button onClick={handleConnect} variant="default">
        Connect Gmail
      </Button>

      <div className="mt-4 space-y-2 text-sm text-gray-500">
        <p>✓ Read-only access</p>
        <p>✓ Scans every 3 days automatically</p>
        <p>✓ Detects trials and billing dates</p>
      </div>
    </div>
  )
}
