// Mock Anthropic for AI fallback
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify({ serviceName: 'Unknown Service', confidence: 0.6 })
        }]
      })
    }
  }))
}))

// Mock db module - use jest.fn() inside factory since it gets hoisted
jest.mock('@/lib/db/client', () => ({
  db: {
    merchantAlias: {
      findMany: jest.fn()
    }
  }
}))

import { findMerchantAlias, matchMerchant, matchMerchantWithAI } from '@/lib/bank-import/merchant-matcher'
import { db } from '@/lib/db/client'

// Get reference to the mock function after import
const mockFindMany = db.merchantAlias.findMany as jest.Mock

describe('findMerchantAlias', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('finds pattern match with wildcard', async () => {
    mockFindMany.mockResolvedValue([
      { id: '1', bankPattern: 'NETFLIX*', serviceName: 'Netflix' }
    ])

    const result = await findMerchantAlias('NETFLIX.COM 800-123-4567')
    expect(result?.serviceName).toBe('Netflix')
  })

  it('finds exact pattern match', async () => {
    mockFindMany.mockResolvedValue([
      { id: '2', bankPattern: 'SPOTIFY USA', serviceName: 'Spotify' }
    ])

    const result = await findMerchantAlias('SPOTIFY USA')
    expect(result?.serviceName).toBe('Spotify')
  })

  it('returns null when no match', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await findMerchantAlias('RANDOM STORE')
    expect(result).toBeNull()
  })

  it('returns null when no patterns match', async () => {
    mockFindMany.mockResolvedValue([
      { id: '1', bankPattern: 'NETFLIX*', serviceName: 'Netflix' }
    ])

    const result = await findMerchantAlias('SPOTIFY USA')
    expect(result).toBeNull()
  })

  it('is case-insensitive', async () => {
    mockFindMany.mockResolvedValue([
      { id: '1', bankPattern: 'NETFLIX*', serviceName: 'Netflix' }
    ])

    const result = await findMerchantAlias('netflix.com 800-123-4567')
    expect(result?.serviceName).toBe('Netflix')
  })

  it('escapes regex metacharacters in patterns', async () => {
    mockFindMany.mockResolvedValue([
      { id: '1', bankPattern: 'APPLE.COM/BILL*', serviceName: 'Apple Services' }
    ])

    // Should match literal dot
    const result = await findMerchantAlias('APPLE.COM/BILL 12345')
    expect(result?.serviceName).toBe('Apple Services')

    // Should NOT match where dot is replaced by other char (regex . matches any)
    const noMatch = await findMerchantAlias('APPLEXCOM/BILL 12345')
    expect(noMatch).toBeNull()
  })
})

describe('matchMerchantWithAI', () => {
  it('returns AI match result', async () => {
    const result = await matchMerchantWithAI('UNKNOWN MERCHANT')
    expect(result.source).toBe('ai')
    expect(result.serviceName).toBe('Unknown Service')
    expect(result.confidence).toBe(0.6)
  })
})

describe('matchMerchant', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('uses alias DB first when match found', async () => {
    mockFindMany.mockResolvedValue([
      { id: '1', bankPattern: 'NETFLIX*', serviceName: 'Netflix' }
    ])

    const result = await matchMerchant('NETFLIX.COM 800-123')
    expect(result.source).toBe('alias_db')
    expect(result.serviceName).toBe('Netflix')
    expect(result.confidence).toBe(0.95)
  })

  it('falls back to AI when no alias match', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await matchMerchant('UNKNOWN MERCHANT')
    expect(result.source).toBe('ai')
  })
})
