/**
 * @jest-environment node
 */
import {
  generateVerificationToken,
  hashVerificationToken,
  verificationExpiryDate,
  createVerificationToken,
  EMAIL_VERIFICATION_EXPIRY_HOURS,
} from '@/lib/email-verification'
import { db } from '@/lib/db/client'

jest.mock('@/lib/db/client', () => ({
  db: { verificationToken: { deleteMany: jest.fn(), create: jest.fn() } },
}))

describe('email verification tokens', () => {
  it('generates unique 64-char hex tokens', () => {
    const a = generateVerificationToken()
    expect(a).toMatch(/^[0-9a-f]{64}$/)
    expect(a).not.toBe(generateVerificationToken())
  })

  it('hashes deterministically and never returns the raw token', () => {
    const t = generateVerificationToken()
    expect(hashVerificationToken(t)).toBe(hashVerificationToken(t))
    expect(hashVerificationToken(t)).not.toBe(t)
  })

  it('expires after the configured window', () => {
    const from = new Date('2026-01-01T00:00:00Z')
    expect(verificationExpiryDate(from).getTime() - from.getTime()).toBe(EMAIL_VERIFICATION_EXPIRY_HOURS * 3600 * 1000)
  })

  it('replaces outstanding tokens and stores only the hash', async () => {
    const raw = await createVerificationToken('Mixed@Example.com')
    expect(db.verificationToken.deleteMany).toHaveBeenCalledWith({ where: { identifier: 'mixed@example.com' } })
    const data = (db.verificationToken.create as jest.Mock).mock.calls[0][0].data
    expect(data.identifier).toBe('mixed@example.com')
    expect(data.token).toBe(hashVerificationToken(raw))
    expect(data.token).not.toBe(raw)
  })
})
