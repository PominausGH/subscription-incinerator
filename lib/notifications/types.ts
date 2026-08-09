export type TrialTiming = '24h' | '12h' | '1h'
export type BillingTiming = '14d' | '7d' | '3d' | '1d'

export interface NotificationChannels {
  email: boolean
  push: boolean
}

export interface NotificationDefaults {
  trial: TrialTiming[]
  billing: BillingTiming[]
}

export interface NotificationPreferences {
  channels: NotificationChannels
  defaults: NotificationDefaults
}

export interface ReminderSettings {
  enabled: boolean
  timings: BillingTiming[] | TrialTiming[] | null
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  channels: {
    email: true,
    push: false,
  },
  defaults: {
    trial: ['24h', '1h'],
    billing: ['7d', '1d'],
  },
}

export const TRIAL_TIMING_OPTIONS: { value: TrialTiming; label: string }[] = [
  { value: '24h', label: '24 hours before' },
  { value: '12h', label: '12 hours before' },
  { value: '1h', label: '1 hour before' },
]

export const BILLING_TIMING_OPTIONS: { value: BillingTiming; label: string }[] = [
  { value: '14d', label: '14 days before' },
  { value: '7d', label: '7 days before' },
  { value: '3d', label: '3 days before' },
  { value: '1d', label: '1 day before' },
]
