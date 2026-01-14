import { GmailMessage } from './gmail-client'
import { DETECTION_RULES, getCurrencyCode } from './patterns'

/**
 * Extract a readable service name from the email sender
 * e.g., "Noreply <billing@acme.com>" -> "Acme"
 * e.g., "Stripe <receipts@stripe.com>" -> "Stripe"
 */
function extractServiceNameFromSender(from: string): string {
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
