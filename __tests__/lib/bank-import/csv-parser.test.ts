import { parseCSVWithAI } from '@/lib/bank-import/csv-parser'

// Mock Anthropic
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify([
            { date: '2026-01-15', description: 'NETFLIX.COM', amount: -15.99 },
            { date: '2026-01-14', description: 'GROCERY STORE', amount: -45.23 },
          ])
        }]
      })
    }
  }))
}))

describe('parseCSVWithAI', () => {
  it('parses CSV content and returns transactions', async () => {
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
})
