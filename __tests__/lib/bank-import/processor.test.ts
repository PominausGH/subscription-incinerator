// Mock Anthropic to prevent SDK initialization issues
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: '[]' }]
      })
    }
  }))
}))

// Mock db module
jest.mock('@/lib/db/client', () => ({
  db: {
    merchantAlias: {
      findMany: jest.fn().mockResolvedValue([])
    }
  }
}))

// Mock the dependencies for processCSVContent
jest.mock('@/lib/bank-import/csv-parser')
jest.mock('@/lib/bank-import/merchant-matcher')
jest.mock('@/lib/bank-import/recurring-detector')

import { validateFile, processCSVContent } from '@/lib/bank-import/processor'
import { ERRORS } from '@/lib/bank-import/errors'
import { parseCSVWithAI } from '@/lib/bank-import/csv-parser'
import { matchMerchant } from '@/lib/bank-import/merchant-matcher'
import { detectRecurringCharges } from '@/lib/bank-import/recurring-detector'
import { RawTransaction, RecurringGroup, Transaction } from '@/lib/bank-import/types'

const mockParseCSVWithAI = parseCSVWithAI as jest.MockedFunction<typeof parseCSVWithAI>
const mockMatchMerchant = matchMerchant as jest.MockedFunction<typeof matchMerchant>
const mockDetectRecurringCharges = detectRecurringCharges as jest.MockedFunction<typeof detectRecurringCharges>

describe('validateFile', () => {
  it('accepts valid CSV file', () => {
    const file = new File(['content'], 'statement.csv', { type: 'text/csv' })
    expect(() => validateFile(file)).not.toThrow()
  })

  it('rejects non-CSV files', () => {
    const file = new File(['content'], 'statement.pdf', { type: 'application/pdf' })
    expect(() => validateFile(file)).toThrow(ERRORS.INVALID_FILE_TYPE)
  })

  it('rejects files over 5MB', () => {
    const largeContent = 'x'.repeat(6 * 1024 * 1024) // 6MB
    const file = new File([largeContent], 'large.csv', { type: 'text/csv' })
    expect(() => validateFile(file)).toThrow(ERRORS.FILE_TOO_LARGE)
  })
})

describe('processCSVContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns transactions and recurring groups for valid input', async () => {
    const rawTransactions: RawTransaction[] = [
      { date: '2024-01-15', description: 'NETFLIX.COM', amount: -15.99 },
      { date: '2024-02-15', description: 'NETFLIX.COM', amount: -15.99 },
      { date: '2024-01-10', description: 'GROCERY STORE', amount: -45.50 }
    ]

    const mockRecurringGroups: RecurringGroup[] = [
      {
        merchantName: 'NETFLIX.COM',
        serviceName: 'Netflix',
        transactions: [] as Transaction[],
        amount: 15.99,
        billingCycle: 'monthly',
        confidence: 0.9
      }
    ]

    mockParseCSVWithAI.mockResolvedValue(rawTransactions)
    mockMatchMerchant.mockImplementation(async (description: string) => {
      if (description.includes('NETFLIX')) {
        return { serviceName: 'Netflix', confidence: 0.95, source: 'alias_db' }
      }
      return { serviceName: null, confidence: 0, source: 'none' }
    })
    mockDetectRecurringCharges.mockReturnValue(mockRecurringGroups)

    const result = await processCSVContent('csv content')

    expect(mockParseCSVWithAI).toHaveBeenCalledWith('csv content')
    expect(mockMatchMerchant).toHaveBeenCalledTimes(3)
    expect(mockDetectRecurringCharges).toHaveBeenCalledTimes(1)

    expect(result.transactions).toHaveLength(3)
    expect(result.transactions[0].serviceName).toBe('Netflix')
    expect(result.transactions[2].serviceName).toBeNull()
    expect(result.recurringGroups).toEqual(mockRecurringGroups)
    expect(result.stats).toEqual({
      totalTransactions: 3,
      recurringDetected: 1
    })
  })

  it('throws NO_TRANSACTIONS error when CSV has no transactions', async () => {
    mockParseCSVWithAI.mockResolvedValue([])

    await expect(processCSVContent('empty csv')).rejects.toThrow(ERRORS.NO_TRANSACTIONS)

    expect(mockParseCSVWithAI).toHaveBeenCalledWith('empty csv')
    expect(mockMatchMerchant).not.toHaveBeenCalled()
    expect(mockDetectRecurringCharges).not.toHaveBeenCalled()
  })
})
