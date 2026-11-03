/**
 * @jest-environment node
 */

import { POST } from '@/app/api/auth/register/route'
import { db } from '@/lib/db/client'
import { hashPassword } from '@/lib/password'
import { createVerificationToken } from '@/lib/email-verification'
import { sendVerificationEmail } from '@/lib/notifications/email'
import { NextRequest } from 'next/server'

jest.mock('@/lib/db/client', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('$2a$12$hashedpassword'),
}))

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ success: true, remaining: 4, reset: 0 }),
  getClientIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
  rateLimitResponse: jest.fn(),
  RATE_LIMITS: { auth: { limit: 5, windowSeconds: 60 } },
}))

jest.mock('@/lib/email-verification', () => ({
  createVerificationToken: jest.fn().mockResolvedValue('raw-token'),
}))

jest.mock('@/lib/notifications/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}))

const mockDb = db as jest.Mocked<typeof db>
const mockCreateToken = createVerificationToken as jest.Mock
const mockSendVerification = sendVerificationEmail as jest.Mock

function createRequest(body: any) {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should register a new user', async () => {
    ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockDb.user.create as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'new@example.com',
    })

    const res = await POST(createRequest({
      email: 'new@example.com',
      password: 'SecurePass123!',
    }))

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.message).toBe('Account created successfully')
    // Account starts unverified; the welcome email waits until the link is clicked.
    expect((mockDb.user.create as jest.Mock).mock.calls[0][0].data.emailVerified).toBeNull()
    expect(mockCreateToken).toHaveBeenCalledWith('new@example.com')
    expect(mockSendVerification).toHaveBeenCalledWith({ toEmail: 'new@example.com', token: 'raw-token' })
  })

  it('should still create the account if the verification email fails', async () => {
    ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockDb.user.create as jest.Mock).mockResolvedValue({ id: 'user-2', email: 'new@example.com' })
    mockSendVerification.mockRejectedValueOnce(new Error('smtp down'))

    const res = await POST(createRequest({ email: 'new@example.com', password: 'SecurePass123!' }))

    expect(res.status).toBe(201)
  })

  it('should reject duplicate email', async () => {
    ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'existing',
      email: 'existing@example.com',
    })

    const res = await POST(createRequest({
      email: 'existing@example.com',
      password: 'SecurePass123!',
    }))

    expect(res.status).toBe(409)
  })

  it('should reject invalid input', async () => {
    const res = await POST(createRequest({
      email: 'not-email',
      password: '123',
    }))

    expect(res.status).toBe(400)
  })
})
