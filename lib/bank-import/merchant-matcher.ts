import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/lib/db/client'
import { MerchantMatch } from './types'

const anthropic = new Anthropic()

export async function findMerchantAlias(description: string): Promise<{ serviceName: string } | null> {
  const normalized = description.toUpperCase().trim()

  // Get all aliases and match with patterns
  const aliases = await db.merchantAlias.findMany()

  for (const alias of aliases) {
    const pattern = alias.bankPattern.replace(/\*/g, '.*')
    const regex = new RegExp(`^${pattern}`, 'i')
    if (regex.test(normalized)) {
      return { serviceName: alias.serviceName }
    }
  }

  return null
}

export async function matchMerchantWithAI(description: string): Promise<MerchantMatch> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Bank transaction description: "${description}"

What subscription service is this? Return JSON only:
{"serviceName": "Name or null", "confidence": 0.0-1.0}

Common examples:
- NETFLIX.COM 800-123 = Netflix
- SPOTIFY USA = Spotify
- AMZN PRIME*1234 = Amazon Prime
- APPLE.COM/BILL = Apple Services

If not a recognizable subscription service, return {"serviceName": null, "confidence": 0.0}`
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { serviceName: null, confidence: 0, source: 'ai' }
    }

    const result = JSON.parse(jsonMatch[0])
    return {
      serviceName: result.serviceName,
      confidence: result.confidence || 0,
      source: 'ai'
    }
  } catch {
    return { serviceName: null, confidence: 0, source: 'ai' }
  }
}

export async function matchMerchant(description: string): Promise<MerchantMatch> {
  // Tier 1: Check alias database (fast, free)
  const alias = await findMerchantAlias(description)
  if (alias) {
    return {
      serviceName: alias.serviceName,
      confidence: 0.95,
      source: 'alias_db'
    }
  }

  // Tier 2: AI fallback
  return await matchMerchantWithAI(description)
}
