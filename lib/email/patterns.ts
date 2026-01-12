export interface DetectionRule {
  service: string
  senderDomains: string[]
  subjectPatterns: RegExp[]
  bodyKeywords: string[]
  trialIndicators: string[]
  priceExtractor: RegExp
  dateExtractor: RegExp
  currencyExtractor?: RegExp
}

export const DETECTION_RULES: DetectionRule[] = [
  {
    service: 'Netflix',
    senderDomains: ['netflix.com', 'email.netflix.com'],
    subjectPatterns: [/netflix.*membership/i, /welcome to netflix/i, /your netflix/i],
    bodyKeywords: ['monthly charge', 'subscription', 'membership'],
    trialIndicators: ['free trial', 'trial period'],
    priceExtractor: /\$(\d+\.?\d{0,2})\s*(?:\/month|per month|monthly)/i,
    dateExtractor: /(?:on|starting)\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
    currencyExtractor: /(\$|USD|€|EUR|£|GBP)/i,
  },
  {
    service: 'Spotify',
    senderDomains: ['spotify.com', 'email.spotify.com'],
    subjectPatterns: [/spotify.*premium/i, /welcome to spotify/i],
    bodyKeywords: ['premium', 'subscription', 'billing'],
    trialIndicators: ['free trial', 'trial period', 'free for'],
    priceExtractor: /\$(\d+\.?\d{0,2})\s*(?:\/month|per month|monthly)/i,
    dateExtractor: /(?:on|starting)\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
    currencyExtractor: /(\$|USD|€|EUR|£|GBP)/i,
  },
  {
    service: 'Disney+',
    senderDomains: ['disneyplus.com', 'email.disneyplus.com'],
    subjectPatterns: [/disney.*subscription/i, /welcome to disney/i],
    bodyKeywords: ['subscription', 'billing', 'membership'],
    trialIndicators: ['free trial', 'trial period'],
    priceExtractor: /\$(\d+\.?\d{0,2})\s*(?:\/month|per month|monthly)/i,
    dateExtractor: /(?:on|starting)\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
    currencyExtractor: /(\$|USD|€|EUR|£|GBP)/i,
  },
  {
    service: 'Amazon Prime',
    senderDomains: ['amazon.com', 'email.amazon.com'],
    subjectPatterns: [/prime.*membership/i, /amazon prime/i],
    bodyKeywords: ['prime', 'membership', 'subscription'],
    trialIndicators: ['free trial', 'trial period'],
    priceExtractor: /\$(\d+\.?\d{0,2})\s*(?:\/month|per month|monthly|\/year|per year)/i,
    dateExtractor: /(?:on|starting)\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
    currencyExtractor: /(\$|USD|€|EUR|£|GBP)/i,
  },
  {
    service: 'YouTube Premium',
    senderDomains: ['youtube.com', 'email.youtube.com', 'google.com'],
    subjectPatterns: [/youtube.*premium/i, /youtube.*subscription/i],
    bodyKeywords: ['premium', 'subscription', 'membership'],
    trialIndicators: ['free trial', 'trial period'],
    priceExtractor: /\$(\d+\.?\d{0,2})\s*(?:\/month|per month|monthly)/i,
    dateExtractor: /(?:on|starting)\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
    currencyExtractor: /(\$|USD|€|EUR|£|GBP)/i,
  },
  // Generic pattern for unknown services
  {
    service: 'Unknown',
    senderDomains: [],
    subjectPatterns: [/subscription/i, /trial/i, /billing/i],
    bodyKeywords: ['subscription', 'trial', 'billing', 'monthly charge'],
    trialIndicators: ['free trial', 'trial period', 'trial ends'],
    priceExtractor: /\$(\d+\.?\d{0,2})\s*(?:\/month|per month|monthly)/i,
    dateExtractor: /(?:on|starting|ends)\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
    currencyExtractor: /(\$|USD|€|EUR|£|GBP)/i,
  },
]

export function getCurrencyCode(currencySymbol: string): string {
  const currencyMap: Record<string, string> = {
    '$': 'USD',
    'USD': 'USD',
    '€': 'EUR',
    'EUR': 'EUR',
    '£': 'GBP',
    'GBP': 'GBP',
  }
  return currencyMap[currencySymbol] || 'USD'
}
