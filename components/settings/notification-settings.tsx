'use client'

import { useState, useEffect } from 'react'
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  TRIAL_TIMING_OPTIONS,
  BILLING_TIMING_OPTIONS,
  TrialTiming,
  BillingTiming,
} from '@/lib/notifications/types'

interface NotificationSettingsProps {
  initialPreferences?: NotificationPreferences
}

export function NotificationSettings({ initialPreferences }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    initialPreferences || DEFAULT_NOTIFICATION_PREFERENCES
  )
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [pushSupported, setPushSupported] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)

  useEffect(() => {
    setPushSupported('Notification' in window && 'serviceWorker' in navigator)
  }, [])

  useEffect(() => {
    if (!initialPreferences) {
      fetch('/api/settings/notifications')
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data) setPreferences(data)
        })
        .catch(() => {})
    }
  }, [initialPreferences])

  useEffect(() => {
    // Check if already subscribed
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setPushEnabled(!!subscription)
        })
      })
    }
  }, [])

  const handleChannelToggle = (channel: 'email' | 'push') => {
    setPreferences((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: !prev.channels[channel],
      },
    }))
  }

  const handleTrialToggle = (timing: TrialTiming) => {
    setPreferences((prev) => ({
      ...prev,
      defaults: {
        ...prev.defaults,
        trial: prev.defaults.trial.includes(timing)
          ? prev.defaults.trial.filter((t) => t !== timing)
          : [...prev.defaults.trial, timing],
      },
    }))
  }

  const handleBillingToggle = (timing: BillingTiming) => {
    setPreferences((prev) => ({
      ...prev,
      defaults: {
        ...prev.defaults,
        billing: prev.defaults.billing.includes(timing)
          ? prev.defaults.billing.filter((t) => t !== timing)
          : [...prev.defaults.billing, timing],
      },
    }))
  }

  const handleEnablePush = async () => {
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Request permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        alert('Push notifications permission denied')
        return
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      setPushEnabled(true)
      handleChannelToggle('push')
    } catch (error) {
      console.error('Failed to enable push notifications')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus('idle')
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Failed to save notification preferences')
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          How would you like to be notified?
        </h3>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.channels.email}
              onChange={() => handleChannelToggle('email')}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-900">Email</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.channels.push}
              onChange={() => handleChannelToggle('push')}
              disabled={!pushSupported || !pushEnabled}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 disabled:opacity-50"
            />
            <span className="text-sm text-gray-900">Browser notifications</span>
            {pushSupported && !pushEnabled && (
              <button
                onClick={handleEnablePush}
                className="ml-2 text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
              >
                Enable
              </button>
            )}
            {!pushSupported && (
              <span className="text-xs text-gray-400">(not supported)</span>
            )}
          </label>
        </div>
      </div>

      <hr className="border-gray-200" />

      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Trial ending reminders
        </h3>
        <div className="flex flex-wrap gap-4">
          {TRIAL_TIMING_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.defaults.trial.includes(option.value)}
                onChange={() => handleTrialToggle(option.value)}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-900">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Billing reminders
        </h3>
        <div className="flex flex-wrap gap-4">
          {BILLING_TIMING_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.defaults.billing.includes(option.value)}
                onChange={() => handleBillingToggle(option.value)}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-900">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saveStatus === 'success' && (
          <span className="text-sm text-green-600">Preferences saved!</span>
        )}
        {saveStatus === 'error' && (
          <span className="text-sm text-red-600">Failed to save. Try again.</span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}
