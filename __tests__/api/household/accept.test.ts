/**
 * @jest-environment node
 */

import { POST } from '@/app/api/household/invite/accept/route'
import { NextRequest } from 'next/server'

const mockAuth = jest.fn()

jest.mock('@/lib/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}))

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ success: true }),
  getClientIdentifier: jest.fn().mockReturnValue('client-1'),
  rateLimitResponse: jest.fn(),
  RATE_LIMITS: { auth: {} },
}))

jest.mock('@/lib/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed'),
}))

jest.mock('@/lib/db/client', () => ({
  db: {
    householdInvite: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  },
}))

import { db } from '@/lib/db/client'

const mockFindInvite = db.householdInvite.findUnique as jest.Mock
const mockFindUser = db.user.findUnique as jest.Mock
const mockCountUsers = db.user.count as jest.Mock
const mockUpdateUser = db.user.update as jest.Mock
const mockCreateUser = db.user.create as jest.Mock

const pendingInvite = {
  id: 'invite-1',
  ownerId: 'owner-1',
  email: 'partner@example.com',
  token: 'tok123',
  status: 'pending',
  expiresAt: new Date(Date.now() + 1000 * 60 * 60),
}

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/household/invite/accept', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/household/invite/accept', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue(null)
    mockFindInvite.mockResolvedValue(pendingInvite)
    mockCountUsers.mockResolvedValue(0)
  })

  it('returns 404 for an unknown token', async () => {
    mockFindInvite.mockResolvedValue(null)

    const res = await POST(makeRequest({ token: 'bad-token' }))

    expect(res.status).toBe(404)
  })

  it('rejects an already-accepted invite', async () => {
    mockFindInvite.mockResolvedValue({ ...pendingInvite, status: 'accepted' })

    const res = await POST(makeRequest({ token: 'tok123' }))

    expect(res.status).toBe(400)
  })

  it('rejects an expired invite', async () => {
    mockFindInvite.mockResolvedValue({ ...pendingInvite, expiresAt: new Date(Date.now() - 1000) })

    const res = await POST(makeRequest({ token: 'tok123' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/expired/i)
  })

  describe('when an account already exists for the invited email', () => {
    beforeEach(() => {
      mockFindUser.mockResolvedValue({ id: 'existing-user', email: 'partner@example.com', householdOwnerId: null })
    })

    it('requires login when there is no session', async () => {
      mockAuth.mockResolvedValue(null)

      const res = await POST(makeRequest({ token: 'tok123' }))

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.requiresLogin).toBe(true)
      expect(mockUpdateUser).not.toHaveBeenCalled()
    })

    it('rejects when logged in as a different account', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'someone-else' } })

      const res = await POST(makeRequest({ token: 'tok123' }))

      expect(res.status).toBe(403)
      expect(mockUpdateUser).not.toHaveBeenCalled()
    })

    it('accepts when logged in as the invited account', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'existing-user' } })

      const res = await POST(makeRequest({ token: 'tok123' }))

      expect(res.status).toBe(200)
      expect(mockUpdateUser).toHaveBeenCalledWith({
        where: { id: 'existing-user' },
        data: { householdOwnerId: 'owner-1' },
      })
    })

    it('rejects when the invited account already belongs to a household', async () => {
      mockFindUser.mockResolvedValue({ id: 'existing-user', email: 'partner@example.com', householdOwnerId: 'other-owner' })
      mockAuth.mockResolvedValue({ user: { id: 'existing-user' } })

      const res = await POST(makeRequest({ token: 'tok123' }))

      expect(res.status).toBe(400)
      expect(mockUpdateUser).not.toHaveBeenCalled()
    })

    it('rejects when the invited account already owns its own household', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'existing-user' } })
      mockCountUsers.mockResolvedValue(2)

      const res = await POST(makeRequest({ token: 'tok123' }))

      expect(res.status).toBe(400)
      expect(mockUpdateUser).not.toHaveBeenCalled()
    })
  })

  describe('when no account exists for the invited email', () => {
    beforeEach(() => {
      mockFindUser.mockResolvedValue(null)
    })

    it('requires a password', async () => {
      const res = await POST(makeRequest({ token: 'tok123' }))

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.requiresPassword).toBe(true)
      expect(mockCreateUser).not.toHaveBeenCalled()
    })

    it('creates the account and links it to the household', async () => {
      const res = await POST(makeRequest({ token: 'tok123', password: 'longenoughpassword' }))

      expect(res.status).toBe(201)
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'partner@example.com', householdOwnerId: 'owner-1' }),
        })
      )
    })
  })
})
