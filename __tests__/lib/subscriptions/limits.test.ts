jest.mock('@/lib/db/client', () => ({
  db: {
    subscription: {
      count: jest.fn(),
    },
  },
}))

jest.mock('@/lib/household', () => ({
  getHouseholdMemberIds: jest.fn(),
  isHouseholdPremium: jest.fn(),
}))

import { isAtFreeTierLimit, FREE_TIER_SUBSCRIPTION_LIMIT } from '@/lib/subscriptions/limits'
import { db } from '@/lib/db/client'
import { getHouseholdMemberIds, isHouseholdPremium } from '@/lib/household'

const mockCount = db.subscription.count as jest.Mock
const mockGetHouseholdMemberIds = getHouseholdMemberIds as jest.Mock
const mockIsHouseholdPremium = isHouseholdPremium as jest.Mock

describe('isAtFreeTierLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetHouseholdMemberIds.mockResolvedValue(['user-1'])
  })

  it('returns false when the household is premium, regardless of count', async () => {
    mockIsHouseholdPremium.mockResolvedValue(true)
    mockCount.mockResolvedValue(999)

    const result = await isAtFreeTierLimit('user-1')

    expect(result).toBe(false)
    expect(mockCount).not.toHaveBeenCalled()
  })

  it('returns false for a free household under the limit', async () => {
    mockIsHouseholdPremium.mockResolvedValue(false)
    mockCount.mockResolvedValue(FREE_TIER_SUBSCRIPTION_LIMIT - 1)

    const result = await isAtFreeTierLimit('user-1')

    expect(result).toBe(false)
  })

  it('returns true for a free household at the limit', async () => {
    mockIsHouseholdPremium.mockResolvedValue(false)
    mockCount.mockResolvedValue(FREE_TIER_SUBSCRIPTION_LIMIT)

    const result = await isAtFreeTierLimit('user-1')

    expect(result).toBe(true)
  })

  it('returns true for a free household over the limit', async () => {
    mockIsHouseholdPremium.mockResolvedValue(false)
    mockCount.mockResolvedValue(FREE_TIER_SUBSCRIPTION_LIMIT + 5)

    const result = await isAtFreeTierLimit('user-1')

    expect(result).toBe(true)
  })

  it('counts active/trial subscriptions across every household member', async () => {
    mockIsHouseholdPremium.mockResolvedValue(false)
    mockGetHouseholdMemberIds.mockResolvedValue(['owner-1', 'member-1', 'member-2'])
    mockCount.mockResolvedValue(0)

    await isAtFreeTierLimit('member-1')

    expect(mockCount).toHaveBeenCalledWith({
      where: { userId: { in: ['owner-1', 'member-1', 'member-2'] }, status: { in: ['active', 'trial'] } },
    })
  })
})
