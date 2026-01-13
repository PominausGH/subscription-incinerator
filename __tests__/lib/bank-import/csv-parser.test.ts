import { ERRORS } from '@/lib/bank-import/errors'

// Shared mock response holder - allows per-test customization
let mockResponse: unknown = null

// Mock Anthropic
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockImplementation(() => Promise.resolve(mockResponse))
    }
  }))
}))

import { parseCSVWithAI } from '@/lib/bank-import/csv-parser'

describe('parseCSVWithAI', () => {
  it('parses CSV content and returns transactions', async () => {
    mockResponse = {
      content: [{
        type: 'text',
        text: JSON.stringify([
          { date: '2026-01-15', description: 'NETFLIX.COM', amount: -15.99 },
          { date: '2026-01-14', description: 'GROCERY STORE', amount: -45.23 },
        ])
      }]
    }

    const csvContent = `Date,Description,Amount
2026-01-15,NETFLIX.COM,-15.99
2026-01-14,GROCERY STORE,-45.23`

    const result = await parseCSVWithAI(csvContent)

    expect(result).toHaveLength(2)
    expect(result[0].description).toBe('NETFLIX.COM')
    expect(result[0].amount).toBe(-15.99)
  })

  it('throws error for empty content', async () => {
    await expect(parseCSVWithAI('')).rejects.toThrow('Empty file')
  })

  it('throws AI_PARSE_FAILED when AI returns malformed JSON', async () => {
    // Malformed JSON with brackets so regex matches but JSON.parse fails
    mockResponse = {
      content: [{
        type: 'text',
        text: '[{"date": "2026-01-15", invalid json here}]'
      }]
    }

    const csvContent = `Date,Description,Amount
2026-01-15,NETFLIX.COM,-15.99`

    await expect(parseCSVWithAI(csvContent)).rejects.toThrow(ERRORS.AI_PARSE_FAILED)
  })
})
