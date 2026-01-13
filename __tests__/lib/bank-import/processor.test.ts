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

import { validateFile } from '@/lib/bank-import/processor'
import { ERRORS } from '@/lib/bank-import/errors'

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
