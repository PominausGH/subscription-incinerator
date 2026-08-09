import { ERRORS } from '@/lib/bank-import/errors'
import { parseCSVWithAI } from '@/lib/bank-import/csv-parser'

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

  it('throws AI_PARSE_FAILED when CSV has no recognisable columns', async () => {
    const csvContent = `foo,bar,baz
  hello,world,test
  one,two,three`

    await expect(parseCSVWithAI(csvContent)).rejects.toThrow(ERRORS.AI_PARSE_FAILED)
  })
})
