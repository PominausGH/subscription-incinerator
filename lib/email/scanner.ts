import { GmailMessage } from './gmail-client'
import { DETECTION_RULES, getCurrencyCode } from './patterns'

/**
 * Extract a readable service name from the email sender
 * e.g., "Noreply <billing@acme.com>" -> "Acme"
 * e.g., "Stripe <receipts@stripe.com>" -> "Stripe"
 */
export function extractServiceNameFromSender(from: string): string {
  // Try to get display name first (part before < if exists)
  const displayNameMatch = from.match(/^([^<]+)</);
  if (displayNameMatch) {
    const displayName = displayNameMatch[1].trim().replace(/"/g, '')
    // Skip generic names
    if (!isGenericName(displayName)) {
      return capitalizeWords(displayName)
    }
  }

  // Extract domain from email
  const emailMatch = from.match(/@([^>]+)/);
  if (emailMatch) {
    const domain = emailMatch[1].toLowerCase()
    // Get the main part of domain (e.g., "stripe" from "stripe.com")
    const domainParts = domain.split('.')
    if (domainParts.length >= 2) {
      // Skip subdomains like "mail", "email", "noreply"
      let mainPart = domainParts[0]
      if (['mail', 'email', 'noreply', 'no-reply', 'billing', 'receipts', 'support'].includes(mainPart)) {
        mainPart = domainParts.length > 2 ? domainParts[1] : domainParts[0]
      }
      return capitalizeWords(mainPart)
    }
  }

  return 'Unknown'
}

function isGenericName(name: string): boolean {
  const genericNames = [
    'noreply', 'no-reply', 'no reply', 'billing', 'support', 'info',
    'receipts', 'payments', 'accounts', 'team', 'hello', 'contact',
    'notifications', 'updates', 'news', 'newsletter', 'admin'
  ]
  return genericNames.some(g => name.toLowerCase().includes(g))
}

function capitalizeWords(str: string): string {
  return str
    .split(/[\s-_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Extract billing cycle from email body/subject
 * Returns 'monthly', 'yearly', 'fortnightly', or null
 */
function extractBillingCycle(subject: string, body: string): string | null {
  const text = `${subject} ${body}`.toLowerCase()

  // Check for yearly/annual indicators
  const yearlyPatterns = [
    /\$[\d.]+\s*\/\s*(?:year|yr)/i,
    /\$[\d.]+\s*(?:per|a)\s*year/i,
    /\$[\d.]+\s*annually/i,
    /annual(?:ly)?\s*(?:plan|subscription|membership|fee)/i,
    /yearly\s*(?:plan|subscription|membership|fee)/i,
    /billed\s*(?:annually|yearly)/i,
    /(?:per|a|every)\s*year/i,
    /12[- ]month/i,
  ]

  for (const pattern of yearlyPatterns) {
    if (pattern.test(text)) {
      return 'yearly'
    }
  }

  // Check for monthly indicators
  const monthlyPatterns = [
    /\$[\d.]+\s*\/\s*(?:month|mo)/i,
    /\$[\d.]+\s*(?:per|a)\s*month/i,
    /\$[\d.]+\s*monthly/i,
    /monthly\s*(?:plan|subscription|membership|fee|charge)/i,
    /billed\s*monthly/i,
    /(?:per|a|every)\s*month/i,
    /each\s*month/i,
  ]

  for (const pattern of monthlyPatterns) {
    if (pattern.test(text)) {
      return 'monthly'
    }
  }

  // Check for fortnightly/bi-weekly
  const fortnightlyPatterns = [
    /(?:bi-?weekly|fortnightly|every\s*(?:two|2)\s*weeks)/i,
  ]

  for (const pattern of fortnightlyPatterns) {
    if (pattern.test(text)) {
      return 'fortnightly'
    }
  }

  // Check for weekly
  const weeklyPatterns = [
    /\$[\d.]+\s*\/\s*(?:week|wk)/i,
    /\$[\d.]+\s*(?:per|a)\s*week/i,
    /\$[\d.]+\s*weekly/i,
    /weekly\s*(?:plan|subscription|membership|fee|charge)/i,
    /billed\s*weekly/i,
    /(?:per|a|every)\s*week/i,
    /each\s*week/i,
  ]

  for (const pattern of weeklyPatterns) {
    if (pattern.test(text)) {
      return 'weekly'
    }
  }

  return null
}

/**
 * Create a body snippet for storage (first 500 chars, cleaned up)
 */
function createBodySnippet(body: string): string {
  // Remove excessive whitespace and newlines
  const cleaned = body
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim()

  return cleaned.slice(0, 500)
}

export interface DetectionResult {
  service: string
  confidence: number
  isTrial: boolean
  amount: number | null
  currency: string
  billingCycle: string | null
  trialEndsAt: Date | null
  nextBillingDate: Date | null
  rawData: {
    emailId: string
    subject: string
    from: string
    date: Date
    bodySnippet: string
  }
}

export function detectSubscription(message: GmailMessage): DetectionResult | null {
  let bestMatch: DetectionResult | null = null
  let highestConfidence = 0

  for (const rule of DETECTION_RULES) {
    const result = matchRule(message, rule)

    if (result && result.confidence > highestConfidence) {
      highestConfidence = result.confidence
      bestMatch = result
    }
  }

  // Only return if confidence is above threshold
  if (bestMatch && bestMatch.confidence > 0.4) {
    return bestMatch
  }

  return null
}

function matchRule(message: GmailMessage, rule: typeof DETECTION_RULES[0]): DetectionResult | null {
  let confidence = 0
  let matchCount = 0
  const maxMatches = 5

  // Check sender domain
  if (rule.senderDomains.length > 0) {
    const fromDomain = message.from.split('@')[1]?.toLowerCase() || ''
    if (rule.senderDomains.some(domain => fromDomain.includes(domain))) {
      confidence += 0.3
      matchCount++
    }
  }

  // Check subject patterns
  if (rule.subjectPatterns.some(pattern => pattern.test(message.subject))) {
    confidence += 0.25
    matchCount++
  }

  // Check body keywords
  const bodyLower = message.body.toLowerCase()
  const keywordMatches = rule.bodyKeywords.filter(keyword =>
    bodyLower.includes(keyword.toLowerCase())
  ).length

  if (keywordMatches > 0) {
    confidence += Math.min(0.2, keywordMatches * 0.1)
    matchCount++
  }

  // Must have at least 2 matches to be considered
  if (matchCount < 2) {
    return null
  }

  // Check for trial indicators
  const isTrial = rule.trialIndicators.some(indicator =>
    bodyLower.includes(indicator.toLowerCase())
  )

  // Extract price
  let amount: number | null = null
  const priceMatch = message.body.match(rule.priceExtractor)
  if (priceMatch && priceMatch[1]) {
    amount = parseFloat(priceMatch[1])
  }

  // Extract currency
  let currency = 'USD'
  if (rule.currencyExtractor) {
    const currencyMatch = message.body.match(rule.currencyExtractor)
    if (currencyMatch && currencyMatch[1]) {
      currency = getCurrencyCode(currencyMatch[1])
    }
  }

  // Extract dates
  let trialEndsAt: Date | null = null
  let nextBillingDate: Date | null = null

  const dateMatch = message.body.match(rule.dateExtractor)
  if (dateMatch && dateMatch[1]) {
    const extractedDate = new Date(dateMatch[1])
    if (!isNaN(extractedDate.getTime())) {
      if (isTrial) {
        trialEndsAt = extractedDate
      } else {
        nextBillingDate = extractedDate
      }
    }
  }

  // Normalize confidence (0-1 range)
  confidence = Math.min(1, confidence)

  // For unknown services, try to extract service name from sender
  let serviceName = rule.service
  if (rule.service === 'Unknown') {
    serviceName = extractServiceNameFromSender(message.from)
  }

  // Extract billing cycle from subject and body
  const billingCycle = extractBillingCycle(message.subject, message.body)

  return {
    service: serviceName,
    confidence,
    isTrial,
    amount,
    currency,
    billingCycle,
    trialEndsAt,
    nextBillingDate,
    rawData: {
      emailId: message.id,
      subject: message.subject,
      from: message.from,
      date: message.date,
      bodySnippet: createBodySnippet(message.body),
    },
  }
}

export function deduplicateDetections(detections: DetectionResult[]): DetectionResult[] {
  const seen = new Set<string>()
  const unique: DetectionResult[] = []

  for (const detection of detections) {
    const key = `${detection.service}-${detection.amount}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(detection)
    }
  }

  return unique
}

/**
 * Analyze emails for recurring monthly patterns from the same sender.
 * This detects subscriptions by frequency rather than just content matching.
 */
export interface FrequencyDetectionResult extends DetectionResult {
  emailCount: number
  averageIntervalDays: number
}

export function detectRecurringEmails(messages: GmailMessage[]): FrequencyDetectionResult[] {
  // Group emails by sender domain
  const emailsBySender = new Map<string, GmailMessage[]>()

  for (const msg of messages) {
    const domain = extractDomainFromEmail(msg.from)
    if (!domain || isTransactionalDomain(domain)) continue

    const existing = emailsBySender.get(domain) || []
    existing.push(msg)
    emailsBySender.set(domain, existing)
  }

  const detections: FrequencyDetectionResult[] = []

  for (const [domain, emails] of Array.from(emailsBySender.entries())) {
    // Need at least 2 emails to detect a pattern
    if (emails.length < 2) continue

    // Sort by date
    const sorted = emails.sort((a, b) => a.date.getTime() - b.date.getTime())

    // Calculate intervals between emails
    const intervals: number[] = []
    for (let i = 1; i < sorted.length; i++) {
      const daysDiff = (sorted[i].date.getTime() - sorted[i - 1].date.getTime()) / (1000 * 60 * 60 * 24)
      intervals.push(daysDiff)
    }

    // Check for weekly pattern (5-9 days between emails)
    const weeklyIntervals = intervals.filter(d => d >= 5 && d <= 9)
    const isWeeklyPattern = weeklyIntervals.length >= 2 && weeklyIntervals.length >= intervals.length * 0.5

    // Check for fortnightly pattern (12-16 days between emails)
    const fortnightlyIntervals = intervals.filter(d => d >= 12 && d <= 16)
    const isFortnightlyPattern = fortnightlyIntervals.length >= 1 && fortnightlyIntervals.length >= intervals.length * 0.5

    // Check for monthly pattern (25-35 days between emails)
    const monthlyIntervals = intervals.filter(d => d >= 25 && d <= 35)
    const isMonthlyPattern = monthlyIntervals.length >= 1 && monthlyIntervals.length >= intervals.length * 0.5

    // Check for yearly pattern (350-380 days)
    const yearlyIntervals = intervals.filter(d => d >= 350 && d <= 380)
    const isYearlyPattern = yearlyIntervals.length >= 1

    if (!isWeeklyPattern && !isFortnightlyPattern && !isMonthlyPattern && !isYearlyPattern) continue

    // Use the most recent email for detection details
    const latestEmail = sorted[sorted.length - 1]
    const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length

    // Try to extract price from the most recent email
    let amount: number | null = null
    let currency = 'USD'
    const priceMatch = latestEmail.body.match(/(?:\$|USD\s*|€|EUR\s*|£|GBP\s*|A\$|AUD\s*)(\d+\.?\d{0,2})/i)
    if (priceMatch) {
      amount = parseFloat(priceMatch[1])
      const currencyMatch = latestEmail.body.match(/(\$|USD|€|EUR|£|GBP|AUD|A\$)/i)
      if (currencyMatch) {
        currency = getCurrencyCode(currencyMatch[1])
      }
    }

    // Calculate confidence based on pattern strength
    let confidence = 0.5
    if (emails.length >= 3) confidence += 0.1
    if (emails.length >= 6) confidence += 0.1
    if (monthlyIntervals.length === intervals.length) confidence += 0.1 // Perfect monthly pattern
    if (amount) confidence += 0.1

    const serviceName = extractServiceNameFromSender(latestEmail.from)

    detections.push({
      service: serviceName,
      confidence: Math.min(confidence, 0.95),
      isTrial: false,
      amount,
      currency,
      billingCycle: isYearlyPattern ? 'yearly' : isMonthlyPattern ? 'monthly' : isFortnightlyPattern ? 'fortnightly' : 'weekly',
      trialEndsAt: null,
      nextBillingDate: estimateNextBillingDate(sorted, isYearlyPattern ? 365 : isMonthlyPattern ? 30 : isFortnightlyPattern ? 14 : 7),
      rawData: {
        emailId: latestEmail.id,
        subject: latestEmail.subject,
        from: latestEmail.from,
        date: latestEmail.date,
        bodySnippet: createBodySnippet(latestEmail.body),
      },
      emailCount: emails.length,
      averageIntervalDays: Math.round(averageInterval),
    })
  }

  return detections
}

function extractDomainFromEmail(from: string): string | null {
  const match = from.match(/@([^>\s]+)/)
  if (!match) return null

  // Get the main domain (e.g., "stripe.com" from "mail.stripe.com")
  const parts = match[1].toLowerCase().split('.')
  if (parts.length >= 2) {
    return parts.slice(-2).join('.')
  }
  return match[1].toLowerCase()
}

function isTransactionalDomain(domain: string): boolean {
  // Skip common transactional/notification domains that aren't subscriptions
  const skipDomains = [
    'gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com',
    'googlemail.com', 'icloud.com', 'me.com', 'mac.com',
    'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com',
    'google.com', // Too broad, covered by specific services
    'facebookmail.com', 'pinterest.com',
  ]
  return skipDomains.includes(domain)
}

function estimateNextBillingDate(emails: GmailMessage[], intervalDays: number): Date | null {
  if (emails.length === 0) return null

  const lastEmail = emails[emails.length - 1]
  const nextDate = new Date(lastEmail.date)
  nextDate.setDate(nextDate.getDate() + intervalDays)

  // Only return future dates
  if (nextDate > new Date()) {
    return nextDate
  }

  // If estimated date is in the past, calculate from now
  const now = new Date()
  const daysSinceLastEmail = (now.getTime() - lastEmail.date.getTime()) / (1000 * 60 * 60 * 24)
  const cyclesElapsed = Math.ceil(daysSinceLastEmail / intervalDays)
  const nextFromNow = new Date(lastEmail.date)
  nextFromNow.setDate(nextFromNow.getDate() + (cyclesElapsed * intervalDays))

  return nextFromNow
}
