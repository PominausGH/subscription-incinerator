/**
 * @jest-environment node
 */
import { GET } from '@/app/api/auth/verify-email/route'
import { db } from '@/lib/db/client'
import { hashVerificationToken } from '@/lib/email-verification'
import { emailService } from '@/lib/services/email'
import { NextRequest } from 'next/server'

jest.mock('@/lib/db/client', () => ({
  db: {
    verificationToken: { findUnique: jest.fn(), deleteMany: jest.fn() },
    user: { updateMany: jest.fn() },
  },
}))
jest.mock('@/lib/services/email', () => ({
  emailService: { sendWelcome: jest.fn().mockResolvedValue(true) },
}))

const find = db.verificationToken.findUnique as jest.Mock
const updateMany = db.user.updateMany as jest.Mock
const welcome = emailService.sendWelcome as jest.Mock
const req = (q: string) => new NextRequest(`http://localhost:3000/api/auth/verify-email${q}`)
const location = (res: Response) => new URL(res.headers.get('location')!).pathname + new URL(res.headers.get('location')!).search

describe('GET /api/auth/verify-email', () => {
  beforeEach(() => jest.clearAllMocks())

  it('redirects to invalid when no token is given', async () => {
    const res = await GET(req(''))
    expect(location(res)).toBe('/dashboard?verified=invalid')
    expect(updateMany).not.toHaveBeenCalled()
  })

  it('looks tokens up by hash and rejects unknown ones', async () => {
    find.mockResolvedValue(null)
    const res = await GET(req('?token=abc'))
    expect(find).toHaveBeenCalledWith({ where: { token: hashVerificationToken('abc') } })
    expect(location(res)).toBe('/dashboard?verified=invalid')
    expect(updateMany).not.toHaveBeenCalled()
  })

  it('rejects and deletes expired tokens', async () => {
    find.mockResolvedValue({ identifier: 'a@b.com', token: 'h', expires: new Date(Date.now() - 1000) })
    const res = await GET(req('?token=abc'))
    expect(location(res)).toBe('/dashboard?verified=invalid')
    expect(db.verificationToken.deleteMany).toHaveBeenCalled()
    expect(updateMany).not.toHaveBeenCalled()
  })

  it('verifies the user, consumes the token and sends the welcome email once', async () => {
    find.mockResolvedValue({ identifier: 'a@b.com', token: 'h', expires: new Date(Date.now() + 60000) })
    updateMany.mockResolvedValue({ count: 1 })
    const res = await GET(req('?token=abc'))
    expect(updateMany).toHaveBeenCalledWith({
      where: { email: 'a@b.com', emailVerified: null },
      data: { emailVerified: expect.any(Date) },
    })
    expect(db.verificationToken.deleteMany).toHaveBeenCalledWith({ where: { token: 'h' } })
    expect(welcome).toHaveBeenCalledWith('a@b.com', 'there')
    expect(location(res)).toBe('/dashboard?verified=1')
  })

  it('does not resend the welcome email when the account was already verified', async () => {
    find.mockResolvedValue({ identifier: 'a@b.com', token: 'h', expires: new Date(Date.now() + 60000) })
    updateMany.mockResolvedValue({ count: 0 })
    await GET(req('?token=abc'))
    expect(welcome).not.toHaveBeenCalled()
  })
})
