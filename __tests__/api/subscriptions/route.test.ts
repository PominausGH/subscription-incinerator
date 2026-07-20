/**
 * @jest-environment node
 */

import { POST } from '@/app/api/subscriptions/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({ user: { id: 'user-1', tier: 'free' } }),
}))

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ success: true }),
  getClientIdentifier: jest.fn().mockReturnValue('client-1'),
  rateLimitResponse: jest.fn(),
  RATE_LIMITS: { api: {} },
}))

jest.mock('@/lib/subscriptions/limits', () => ({
  isAtFreeTierLimit: jest.fn(),
  FREE_TIER_SUBSCRIPTION_LIMIT: 10,
}))

jest.mock('@/lib/reminders/scheduler', () => ({
  scheduleTrialReminders: jest.fn(),
  scheduleBillingReminders: jest.fn(),
}))

jest.mock('@/lib/db/client', () => ({
  db: {
    subscription: {
      create: jest.fn().mockResolvedValue({
        id: 'sub-1',
        serviceName: 'Netflix',
        status: 'active',
        trialEndsAt: null,
        nextBillingDate: null,
      }),
    },
  },
}))

import { isAtFreeTierLimit } from '@/lib/subscriptions/limits'
import { db } from '@/lib/db/client'

const mockIsAtFreeTierLimit = isAtFreeTierLimit as jest.Mock
const mockCreate = db.subscription.create as jest.Mock

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/subscriptions', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/subscriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreate.mockResolvedValue({
      id: 'sub-1',
      serviceName: 'Netflix',
      status: 'active',
      trialEndsAt: null,
      nextBillingDate: null,
    })
  })

  it('rejects with 403 when the free-tier limit is reached', async () => {
    mockIsAtFreeTierLimit.mockResolvedValue(true)

    const res = await POST(makeRequest({ serviceName: 'Netflix', status: 'active' }))

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/free plan/i)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('creates the subscription when under the free-tier limit', async () => {
    mockIsAtFreeTierLimit.mockResolvedValue(false)

    const res = await POST(makeRequest({ serviceName: 'Netflix', status: 'active' }))

    expect(res.status).toBe(201)
    expect(mockCreate).toHaveBeenCalled()
  })
})
