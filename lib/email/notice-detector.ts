import Anthropic from '@anthropic-ai/sdk'
import { GmailMessage } from './gmail-client'

export interface NoticeDetectionResult {
  merchant: string
  deadlineDate: Date
  noticeType: 'trial_ending' | 'renewal_upcoming'
  confidence: number
  rawData: { emailId: string; subject: string; from: string; date: Date; bodySnippet: string }
}

// Additive Gmail search — the default query (subscription/trial/billing/payment)
// misses plain renewal notices with none of those words, e.g. "Your plan renews
// on the 14th."
export const NOTICE_SEARCH_QUERY =
  'subject:(trial OR renew OR renews OR renewal OR renewing OR expiring OR expires OR "ends in" OR "day left" OR "days left" OR "last day") ' +
  'OR "your trial" OR "your subscription" OR "your membership" OR "your plan"'

const anthropic = new Anthropic()

// Forward-looking phrasing only — deliberately distinct from receipt language
// ("charged", "receipt", "invoice") already owned by DETECTION_RULES, so this
// path and the regex receipt path don't both fire on the same email.
const NOTICE_PREFILTER_PATTERNS: RegExp[] = [
  /trial\s+(ends|ending|expires|is ending)/i,
  /\d+\s+days?\s+(left|remaining)/i,
  /renews?\s+(on|in|soon)/i,
  /(renewal|subscription)\s+(is\s+)?(coming up|upcoming|approaching)/i,
  /expir(es|ing|y)\s+(soon|on|in)/i,
  /last\s+(day|chance)\s+.*(trial|free)/i,
  /(about to|going to)\s+(renew|be charged|expire)/i,
  /free trial (ends|is ending|expires)/i,
]

export function isLikelyNoticeEmail(message: GmailMessage): boolean {
  const text = `${message.subject} ${message.snippet}`
  return NOTICE_PREFILTER_PATTERNS.some(p => p.test(text))
}

const NOTICE_MIN_CONFIDENCE = 0.4
const NOTICE_MAX_LLM_CALLS_PER_SCAN = 20
const NOTICE_BATCH_SIZE = 5

export async function extractNoticeWithAI(message: GmailMessage): Promise<NoticeDetectionResult | null> {
  try {
    const bodyExcerpt = message.body.slice(0, 1500)
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `This is an email that may be a "trial ending soon" or "subscription renewing soon" notice — sent BEFORE any charge, not a receipt.

From: ${message.from}
Subject: ${message.subject}
Body (excerpt): ${bodyExcerpt}

If this is genuinely a pre-charge trial-ending or upcoming-renewal notice, return JSON only:
{"isNotice": true, "merchant": "Service Name", "deadlineDate": "YYYY-MM-DD", "noticeType": "trial_ending" | "renewal_upcoming", "confidence": 0.0-1.0}

If this is a receipt, invoice, marketing email, or anything else, return:
{"isNotice": false, "confidence": 0.0}

"deadlineDate" is the date the trial ends or the renewal/charge happens — extract it from the email text, do not guess. If no explicit date is present, return {"isNotice": false, "confidence": 0.0}.`
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return null
    }

    const result = JSON.parse(jsonMatch[0])
    if (!result.isNotice || !result.merchant || !result.deadlineDate) {
      return null
    }

    const deadlineDate = new Date(result.deadlineDate)
    if (isNaN(deadlineDate.getTime())) {
      return null
    }

    const confidence = typeof result.confidence === 'number' ? result.confidence : 0
    if (confidence < NOTICE_MIN_CONFIDENCE) {
      return null
    }

    const noticeType = result.noticeType === 'trial_ending' ? 'trial_ending' : 'renewal_upcoming'

    return {
      merchant: result.merchant,
      deadlineDate,
      noticeType,
      confidence,
      rawData: {
        emailId: message.id,
        subject: message.subject,
        from: message.from,
        date: message.date,
        bodySnippet: bodyExcerpt.slice(0, 500),
      },
    }
  } catch {
    return null
  }
}

export async function detectTrialAndRenewalNotices(messages: GmailMessage[]): Promise<NoticeDetectionResult[]> {
  const candidates = messages.filter(isLikelyNoticeEmail).slice(0, NOTICE_MAX_LLM_CALLS_PER_SCAN)
  const results: NoticeDetectionResult[] = []

  for (let i = 0; i < candidates.length; i += NOTICE_BATCH_SIZE) {
    const batch = candidates.slice(i, i + NOTICE_BATCH_SIZE)
    const batchResults = await Promise.all(batch.map(extractNoticeWithAI))
    results.push(...batchResults.filter((r): r is NoticeDetectionResult => r !== null))
  }

  return results
}
