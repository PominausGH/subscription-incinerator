/**
 * @jest-environment node
 */

import { POST } from '@/app/api/pending-subscriptions/approve/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({ user: { id: 'user-1', tier: 'free' } }),
}))

jest.mock('@/lib/subscriptions/limits', () => ({
  isAtFreeTierLimit: jest.fn(),
  FREE_TIER_SUBSCRIPTION_LIMIT: 10,
}))

jest.mock('@/lib/notifications/schedule-reminders', () => ({
  scheduleTrialReminders: jest.fn(),
  scheduleBillingReminders: jest.fn(),
}))

const mockPending = {
  id: 'pending-1',
  userId: 'user-1',
  status: 'pending',
  serviceName: 'Netflix',
  isTrial: false,
  billingCycle: 'monthly',
  amount: 15.99,
  currency: 'USD',
  trialEndsAt: null,
  nextBillingDate: null,
  rawEmailData: null,
}

const mockTx = {
  subscription: {
    create: jest.fn().mockResolvedValue({
      id: 'sub-1',
      trialEndsAt: null,
      nextBillingDate: null,
    }),
  },
  pendingSubscription: {
    update: jest.fn().mockResolvedValue({}),
  },
}

jest.mock('@/lib/db/client', () => ({
  db: {
    pendingSubscription: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(mockTx)),
  },
}))

import { isAtFreeTierLimit } from '@/lib/subscriptions/limits'
import { db } from '@/lib/db/client'

const mockIsAtFreeTierLimit = isAtFreeTierLimit as jest.Mock
const mockFindUnique = db.pendingSubscription.findUnique as jest.Mock

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/pending-subscriptions/approve', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/pending-subscriptions/approve', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindUnique.mockResolvedValue(mockPending)
    mockTx.subscription.create.mockResolvedValue({ id: 'sub-1', trialEndsAt: null, nextBillingDate: null })
  })

  it('rejects with 403 when the free-tier limit is reached', async () => {
    mockIsAtFreeTierLimit.mockResolvedValue(true)

    const res = await POST(makeRequest({ pendingId: 'pending-1' }))

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/free plan/i)
    expect(mockTx.subscription.create).not.toHaveBeenCalled()
  })

  it('approves the pending subscription when under the free-tier limit', async () => {
    mockIsAtFreeTierLimit.mockResolvedValue(false)

    const res = await POST(makeRequest({ pendingId: 'pending-1' }))

    expect(res.status).toBe(200)
    expect(mockTx.subscription.create).toHaveBeenCalled()
    expect(mockTx.pendingSubscription.update).toHaveBeenCalledWith({
      where: { id: 'pending-1' },
      data: { status: 'approved' },
    })
  })
})
