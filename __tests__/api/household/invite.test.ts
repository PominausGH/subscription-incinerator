/**
 * @jest-environment node
 */

import { POST } from '@/app/api/household/invite/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({ user: { id: 'owner-1', tier: 'free' } }),
}))

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ success: true }),
  getClientIdentifier: jest.fn().mockReturnValue('client-1'),
  rateLimitResponse: jest.fn(),
  RATE_LIMITS: { auth: {} },
}))

jest.mock('@/lib/notifications/email', () => ({
  sendHouseholdInviteEmail: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/db/client', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    householdInvite: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { sendHouseholdInviteEmail } from '@/lib/notifications/email'
import { db } from '@/lib/db/client'

const mockFindUniqueUser = db.user.findUnique as jest.Mock
const mockFindFirstUser = db.user.findFirst as jest.Mock
const mockFindFirstInvite = db.householdInvite.findFirst as jest.Mock
const mockCreateInvite = db.householdInvite.create as jest.Mock
const mockUpdateInvite = db.householdInvite.update as jest.Mock
const mockSendEmail = sendHouseholdInviteEmail as jest.Mock

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/household/invite', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/household/invite', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindUniqueUser.mockResolvedValue({ id: 'owner-1', email: 'owner@example.com', householdOwnerId: null })
    mockFindFirstUser.mockResolvedValue(null)
    mockFindFirstInvite.mockResolvedValue(null)
    mockCreateInvite.mockResolvedValue({ id: 'invite-1' })
  })

  it('sends an invite for a new email', async () => {
    const res = await POST(makeRequest({ email: 'partner@example.com' }))

    expect(res.status).toBe(201)
    expect(mockCreateInvite).toHaveBeenCalled()
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ toEmail: 'partner@example.com', ownerEmail: 'owner@example.com' })
    )
  })

  it('rejects invites from a user who is already a household member', async () => {
    mockFindUniqueUser.mockResolvedValue({ id: 'member-1', email: 'member@example.com', householdOwnerId: 'owner-2' })

    const res = await POST(makeRequest({ email: 'someone@example.com' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/already part of a household/i)
    expect(mockCreateInvite).not.toHaveBeenCalled()
  })

  it('rejects inviting yourself', async () => {
    const res = await POST(makeRequest({ email: 'OWNER@example.com' }))

    expect(res.status).toBe(400)
    expect(mockCreateInvite).not.toHaveBeenCalled()
  })

  it('rejects inviting someone already in the household', async () => {
    mockFindFirstUser.mockResolvedValue({ id: 'existing-member', email: 'partner@example.com' })

    const res = await POST(makeRequest({ email: 'partner@example.com' }))

    expect(res.status).toBe(400)
    expect(mockCreateInvite).not.toHaveBeenCalled()
  })

  it('reuses an existing pending invite instead of creating a duplicate', async () => {
    mockFindFirstInvite.mockResolvedValue({ id: 'invite-existing' })

    const res = await POST(makeRequest({ email: 'partner@example.com' }))

    expect(res.status).toBe(201)
    expect(mockUpdateInvite).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'invite-existing' } })
    )
    expect(mockCreateInvite).not.toHaveBeenCalled()
  })

  it('rejects invalid email input', async () => {
    const res = await POST(makeRequest({ email: 'not-an-email' }))

    expect(res.status).toBe(400)
    expect(mockCreateInvite).not.toHaveBeenCalled()
  })
})
