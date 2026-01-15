'use client'

import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Bell, BellOff, X } from 'lucide-react'
import {
  ReminderSettings,
  BILLING_TIMING_OPTIONS,
  TRIAL_TIMING_OPTIONS,
  BillingTiming,
  TrialTiming,
} from '@/lib/notifications/types'

interface ReminderPopoverProps {
  subscriptionId: string
  subscriptionName: string
  isTrialSubscription: boolean
  currentSettings: ReminderSettings | null
  defaultTimings: string[]
  onUpdate: (settings: ReminderSettings | null) => Promise<void>
}

type SettingsMode = 'default' | 'custom' | 'none'

export function ReminderPopover({
  subscriptionId,
  subscriptionName,
  isTrialSubscription,
  currentSettings,
  defaultTimings,
  onUpdate,
}: ReminderPopoverProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const getInitialMode = (): SettingsMode => {
    if (!currentSettings) return 'default'
    if (currentSettings.enabled === false) return 'none'
    if (currentSettings.timings) return 'custom'
    return 'default'
  }

  const [mode, setMode] = useState<SettingsMode>(getInitialMode())
  const [customTimings, setCustomTimings] = useState<string[]>(
    currentSettings?.timings || defaultTimings
  )

  const timingOptions = isTrialSubscription ? TRIAL_TIMING_OPTIONS : BILLING_TIMING_OPTIONS

  const handleModeChange = async (newMode: SettingsMode) => {
    setMode(newMode)
    setSaving(true)

    try {
      let settings: ReminderSettings | null = null

      switch (newMode) {
        case 'default':
          settings = { enabled: true, timings: null }
          break
        case 'custom':
          settings = { enabled: true, timings: customTimings as BillingTiming[] | TrialTiming[] }
          break
        case 'none':
          settings = { enabled: false, timings: null }
          break
      }

      await onUpdate(settings)
    } finally {
      setSaving(false)
    }
  }

  const handleTimingToggle = async (timing: string) => {
    const newTimings = customTimings.includes(timing)
      ? customTimings.filter((t) => t !== timing)
      : [...customTimings, timing]

    setCustomTimings(newTimings)

    if (mode === 'custom') {
      setSaving(true)
      try {
        await onUpdate({ enabled: true, timings: newTimings as BillingTiming[] | TrialTiming[] })
      } finally {
        setSaving(false)
      }
    }
  }

  const isDisabled = currentSettings?.enabled === false

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Reminder settings"
        >
          {isDisabled ? (
            <BellOff className="w-4 h-4" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="bg-white rounded-lg shadow-lg border border-gray-200 w-72 z-50"
          sideOffset={5}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 text-sm">
                Reminders for {subscriptionName}
              </h3>
              <Popover.Close asChild>
                <button className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </Popover.Close>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="reminderMode"
                  checked={mode === 'default'}
                  onChange={() => handleModeChange('default')}
                  disabled={saving}
                  className="mt-1 text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <span className="text-sm text-gray-700">Use default settings</span>
                  <p className="text-xs text-gray-500">
                    ({defaultTimings.join(', ')} before)
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="reminderMode"
                  checked={mode === 'custom'}
                  onChange={() => handleModeChange('custom')}
                  disabled={saving}
                  className="mt-1 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Custom for this subscription</span>
              </label>

              {mode === 'custom' && (
                <div className="ml-6 space-y-2">
                  {timingOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customTimings.includes(option.value)}
                        onChange={() => handleTimingToggle(option.value)}
                        disabled={saving}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-600">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="reminderMode"
                  checked={mode === 'none'}
                  onChange={() => handleModeChange('none')}
                  disabled={saving}
                  className="text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">No reminders</span>
              </label>
            </div>
          </div>

          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
