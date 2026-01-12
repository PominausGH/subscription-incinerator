import { GmailMessage } from './gmail-client'
import { DETECTION_RULES, getCurrencyCode } from './patterns'

export interface DetectionResult {
  service: string
  confidence: number
  isTrial: boolean
  amount: number | null
  currency: string
  trialEndsAt: Date | null
  nextBillingDate: Date | null
  rawData: {
    emailId: string
    subject: string
    from: string
    date: Date
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

  return {
    service: rule.service,
    confidence,
    isTrial,
    amount,
    currency,
    trialEndsAt,
    nextBillingDate,
    rawData: {
      emailId: message.id,
      subject: message.subject,
      from: message.from,
      date: message.date,
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
