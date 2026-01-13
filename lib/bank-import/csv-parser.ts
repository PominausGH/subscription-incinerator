import Anthropic from '@anthropic-ai/sdk'
import { RawTransaction } from './types'
import { ERRORS } from './errors'

const anthropic = new Anthropic()

export async function parseCSVWithAI(content: string): Promise<RawTransaction[]> {
  if (!content || content.trim().length === 0) {
    throw ERRORS.EMPTY_FILE
  }

  // Limit content size to avoid token limits
  const truncatedContent = content.slice(0, 50000)

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Parse this bank statement CSV. Extract transactions as a JSON array.

Each transaction should have these fields:
- date: string (YYYY-MM-DD format)
- description: string (the merchant/payee name)
- amount: number (negative for debits/charges, positive for credits)
- balance: number (optional, if present)

CSV content:
${truncatedContent}

Return ONLY a valid JSON array, no other text. If you cannot parse the file, return an empty array [].`
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Extract JSON from response (handle potential markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return []
    }

    const transactions: RawTransaction[] = JSON.parse(jsonMatch[0])
    return transactions
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw ERRORS.AI_PARSE_FAILED
    }
    throw error
  }
}
