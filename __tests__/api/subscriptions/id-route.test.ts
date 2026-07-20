/**
 * @jest-environment node
 */

import { PATCH, DELETE } from '@/app/api/subscriptions/[id]/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({ user: { id: 'member-1', tier: 'free' } }),
}))

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ success: true }),
  getClientIdentifier: jest.fn().mockReturnValue('client-1'),
  rateLimitResponse: jest.fn(),
  RATE_LIMITS: { api: {} },
}))

jest.mock('@/lib/household', () => ({
  getHouseholdMemberIds: jest.fn(),
}))

jest.mock('@/lib/db/client', () => ({
  db: {
    subscription: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import { getHouseholdMemberIds } from '@/lib/household'
import { db } from '@/lib/db/client'

const mockGetHouseholdMemberIds = getHouseholdMemberIds as jest.Mock
const mockFindUnique = db.subscription.findUnique as jest.Mock
const mockFindFirst = db.subscription.findFirst as jest.Mock
const mockUpdate = db.subscription.update as jest.Mock
const mockDelete = db.subscription.delete as jest.Mock

function makeRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/subscriptions/sub-1', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

const ctx = { params: Promise.resolve({ id: 'sub-1' }) }

describe('PATCH /api/subscriptions/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdate.mockResolvedValue({ id: 'sub-1' })
  })

  it('allows editing a subscription owned by another household member', async () => {
    mockFindUnique.mockResolvedValue({ id: 'sub-1', userId: 'owner-1', status: 'active' })
    mockGetHouseholdMemberIds.mockResolvedValue(['owner-1', 'member-1'])

    const res = await PATCH(makeRequest({ serviceName: 'Netflix' }), ctx)

    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('rejects editing a subscription outside the household', async () => {
    mockFindUnique.mockResolvedValue({ id: 'sub-1', userId: 'stranger-1', status: 'active' })
    mockGetHouseholdMemberIds.mockResolvedValue(['owner-1', 'member-1'])

    const res = await PATCH(makeRequest({ serviceName: 'Netflix' }), ctx)

    expect(res.status).toBe(403)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('records savedAmount using the subscription regardless of who cancels it', async () => {
    mockFindUnique.mockResolvedValue({ id: 'sub-1', userId: 'owner-1', status: 'active' })
    mockGetHouseholdMemberIds.mockResolvedValue(['owner-1', 'member-1'])
    mockFindFirst.mockResolvedValue({ amount: 12, billingCycle: 'monthly', status: 'active' })

    await PATCH(makeRequest({ status: 'cancelled' }), ctx)

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      select: { amount: true, billingCycle: true, status: true },
    })
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ savedAmount: 144 }),
      })
    )
  })
})

describe('DELETE /api/subscriptions/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDelete.mockResolvedValue({ id: 'sub-1' })
  })

  it('allows deleting a subscription owned by another household member', async () => {
    mockFindUnique.mockResolvedValue({ id: 'sub-1', userId: 'owner-1' })
    mockGetHouseholdMemberIds.mockResolvedValue(['owner-1', 'member-1'])

    const res = await DELETE(makeRequest(), ctx)

    expect(res.status).toBe(200)
    expect(mockDelete).toHaveBeenCalled()
  })

  it('rejects deleting a subscription outside the household', async () => {
    mockFindUnique.mockResolvedValue({ id: 'sub-1', userId: 'stranger-1' })
    mockGetHouseholdMemberIds.mockResolvedValue(['owner-1', 'member-1'])

    const res = await DELETE(makeRequest(), ctx)

    expect(res.status).toBe(403)
    expect(mockDelete).not.toHaveBeenCalled()
  })
})
