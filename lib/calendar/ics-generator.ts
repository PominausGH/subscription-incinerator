/**
 * ICS Calendar Export Generator
 * Generates .ics files for subscription events
 */

export interface SubscriptionForCalendar {
  id: string
  serviceName: string
  status: string
  billingCycle: string | null
  amount: number | null
  currency: string
  trialEndsAt: Date | null
  nextBillingDate: Date | null
  cancellationUrl: string | null
}

export interface ICSOptions {
  includeTrials?: boolean
  includeBilling?: boolean
  filter?: 'active' | 'trial' | 'all'
}

/**
 * Format a date to ICS DATE format (YYYYMMDD)
 */
function formatDateToICS(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

/**
 * Format a date to ICS DATETIME format (YYYYMMDDTHHMMSSZ)
 */
function formatDateTimeToICS(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

/**
 * Escape special characters in ICS text fields
 * Commas, semicolons, and backslashes must be escaped
 * Newlines become literal \n
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
}

/**
 * Map billing cycle to RRULE frequency
 */
function billingCycleToRRule(cycle: string | null): string | null {
  if (!cycle) return null

  const cycleMap: Record<string, string> = {
    weekly: 'FREQ=WEEKLY',
    fortnightly: 'FREQ=WEEKLY;INTERVAL=2',
    monthly: 'FREQ=MONTHLY',
    yearly: 'FREQ=YEARLY',
    annual: 'FREQ=YEARLY',
  }

  return cycleMap[cycle.toLowerCase()] || null
}

/**
 * Format currency amount
 */
function formatAmount(amount: number | null, currency: string): string {
  if (amount === null) return ''
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

/**
 * Generate a VEVENT for a trial ending
 */
function generateTrialEvent(subscription: SubscriptionForCalendar): string {
  if (!subscription.trialEndsAt) return ''

  const uid = `trial-${subscription.id}@subscriptionincinerator.com`
  const now = new Date()
  const summary = escapeICSText(`${subscription.serviceName} Trial Ends`)

  let description = `Free trial ends for ${subscription.serviceName}.`
  if (subscription.amount !== null) {
    description += `\\n\\nAfter trial: ${formatAmount(subscription.amount, subscription.currency)}${subscription.billingCycle ? `/${subscription.billingCycle}` : ''}`
  }
  if (subscription.cancellationUrl) {
    description += `\\n\\nCancel: ${subscription.cancellationUrl}`
  }

  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatDateTimeToICS(now)}`,
    `DTSTART;VALUE=DATE:${formatDateToICS(subscription.trialEndsAt)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${escapeICSText(description)}`,
    // 3-day reminder
    'BEGIN:VALARM',
    'TRIGGER:-P3D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICSText(subscription.serviceName)} trial ends in 3 days`,
    'END:VALARM',
    // 1-day reminder
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICSText(subscription.serviceName)} trial ends tomorrow`,
    'END:VALARM',
    'END:VEVENT',
  ]

  return lines.join('\r\n')
}

/**
 * Generate a VEVENT for billing/renewal
 */
function generateBillingEvent(subscription: SubscriptionForCalendar): string {
  if (!subscription.nextBillingDate) return ''

  const uid = `billing-${subscription.id}@subscriptionincinerator.com`
  const now = new Date()

  const amountStr = subscription.amount !== null
    ? ` - ${formatAmount(subscription.amount, subscription.currency)}`
    : ''
  const summary = escapeICSText(`${subscription.serviceName} Renewal${amountStr}`)

  let description = `Subscription renewal for ${subscription.serviceName}.`
  if (subscription.billingCycle) {
    description += `\\n\\nBilling: ${subscription.billingCycle}`
  }
  if (subscription.amount !== null) {
    description += `\\nAmount: ${formatAmount(subscription.amount, subscription.currency)}`
  }
  if (subscription.cancellationUrl) {
    description += `\\n\\nCancel: ${subscription.cancellationUrl}`
  }

  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatDateTimeToICS(now)}`,
    `DTSTART;VALUE=DATE:${formatDateToICS(subscription.nextBillingDate)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${escapeICSText(description)}`,
  ]

  // Add recurrence rule if billing cycle is known
  const rrule = billingCycleToRRule(subscription.billingCycle)
  if (rrule) {
    lines.push(`RRULE:${rrule}`)
  }

  // Add alarms
  lines.push(
    // 3-day reminder
    'BEGIN:VALARM',
    'TRIGGER:-P3D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICSText(subscription.serviceName)} renewal in 3 days`,
    'END:VALARM',
    // 1-day reminder
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICSText(subscription.serviceName)} renewal tomorrow`,
    'END:VALARM',
    'END:VEVENT',
  )

  return lines.join('\r\n')
}

/**
 * Generate a complete ICS calendar file from subscriptions
 */
export function generateICS(
  subscriptions: SubscriptionForCalendar[],
  options: ICSOptions = {}
): string {
  const {
    includeTrials = true,
    includeBilling = true,
    filter = 'all',
  } = options

  // Filter subscriptions
  let filtered = subscriptions
  if (filter === 'active') {
    filtered = subscriptions.filter(s => s.status === 'active')
  } else if (filter === 'trial') {
    filtered = subscriptions.filter(s => s.trialEndsAt !== null)
  }

  // Generate events
  const events: string[] = []

  for (const sub of filtered) {
    if (includeTrials && sub.trialEndsAt) {
      const trialEvent = generateTrialEvent(sub)
      if (trialEvent) events.push(trialEvent)
    }

    if (includeBilling && sub.nextBillingDate) {
      const billingEvent = generateBillingEvent(sub)
      if (billingEvent) events.push(billingEvent)
    }
  }

  // Build complete ICS file
  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Subscription Incinerator//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Subscription Reminders',
  ].join('\r\n')

  const footer = 'END:VCALENDAR'

  if (events.length === 0) {
    return `${header}\r\n${footer}`
  }

  return `${header}\r\n${events.join('\r\n')}\r\n${footer}`
}
