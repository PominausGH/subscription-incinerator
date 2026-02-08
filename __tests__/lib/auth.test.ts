/**
 * @jest-environment node
 */

jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    handlers: {},
    auth: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  })),
}))

jest.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(),
}))

jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/lib/db/client', () => ({
  db: {},
}))

jest.mock('@/lib/password', () => ({
  verifyPassword: jest.fn(),
}))

jest.mock('@/lib/validations/auth', () => ({
  loginSchema: {
    safeParse: jest.fn(),
  },
}))

import { isPremium } from '@/lib/auth'

describe('isPremium', () => {
  it('should return true for premium users', () => {
    expect(isPremium({ tier: 'premium' })).toBe(true)
  })

  it('should return false for free users', () => {
    expect(isPremium({ tier: 'free' })).toBe(false)
  })

  it('should return false for null tier', () => {
    expect(isPremium({ tier: null })).toBe(false)
  })

  it('should return false for undefined tier', () => {
    expect(isPremium({})).toBe(false)
  })

  it('should return false for null user', () => {
    expect(isPremium(null)).toBe(false)
  })
})
