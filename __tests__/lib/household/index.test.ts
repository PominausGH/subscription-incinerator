jest.mock('@/lib/db/client', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

// lib/auth.ts calls NextAuth(...) at module load, which pulls in real
// next-auth/@auth/core ESM that Jest can't parse - stub the whole module
// out and keep isPremium's real string-comparison logic here instead.
jest.mock('@/lib/auth', () => ({
  isPremium: (user: { tier?: string | null } | null) => user?.tier === 'premium',
}))

import { getHouseholdOwnerId, getHouseholdMemberIds, isHouseholdPremium } from '@/lib/household'
import { db } from '@/lib/db/client'

const mockFindUnique = db.user.findUnique as jest.Mock
const mockFindMany = db.user.findMany as jest.Mock

describe('getHouseholdOwnerId', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns the user their own id when they have no householdOwnerId', async () => {
    mockFindUnique.mockResolvedValue({ householdOwnerId: null })

    const result = await getHouseholdOwnerId('user-1')

    expect(result).toBe('user-1')
  })

  it('returns the linked owner id when the user is a member', async () => {
    mockFindUnique.mockResolvedValue({ householdOwnerId: 'owner-1' })

    const result = await getHouseholdOwnerId('user-2')

    expect(result).toBe('owner-1')
  })
})

describe('getHouseholdMemberIds', () => {
  beforeEach(() => jest.clearAllMocks())

  it('includes the owner and all members sharing that owner', async () => {
    mockFindUnique.mockResolvedValue({ householdOwnerId: null })
    mockFindMany.mockResolvedValue([{ id: 'owner-1' }, { id: 'member-1' }, { id: 'member-2' }])

    const result = await getHouseholdMemberIds('owner-1')

    expect(result).toEqual(['owner-1', 'member-1', 'member-2'])
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { OR: [{ id: 'owner-1' }, { householdOwnerId: 'owner-1' }] },
      select: { id: true },
    })
  })

  it('resolves through a member to the shared owner household', async () => {
    mockFindUnique.mockResolvedValue({ householdOwnerId: 'owner-1' })
    mockFindMany.mockResolvedValue([{ id: 'owner-1' }, { id: 'member-1' }])

    const result = await getHouseholdMemberIds('member-1')

    expect(result).toEqual(['owner-1', 'member-1'])
  })

  it('returns just the user when they belong to no household', async () => {
    mockFindUnique.mockResolvedValue({ householdOwnerId: null })
    mockFindMany.mockResolvedValue([{ id: 'solo-user' }])

    const result = await getHouseholdMemberIds('solo-user')

    expect(result).toEqual(['solo-user'])
  })
})

describe('isHouseholdPremium', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns true when the household owner is premium', async () => {
    mockFindUnique
      .mockResolvedValueOnce({ householdOwnerId: 'owner-1' }) // getHouseholdOwnerId lookup
      .mockResolvedValueOnce({ tier: 'premium' }) // owner tier lookup

    const result = await isHouseholdPremium('member-1')

    expect(result).toBe(true)
  })

  it('returns false when the household owner is free, regardless of the member', async () => {
    mockFindUnique
      .mockResolvedValueOnce({ householdOwnerId: 'owner-1' })
      .mockResolvedValueOnce({ tier: 'free' })

    const result = await isHouseholdPremium('member-1')

    expect(result).toBe(false)
  })

  it('checks the requesting user directly when they are the owner', async () => {
    mockFindUnique
      .mockResolvedValueOnce({ householdOwnerId: null })
      .mockResolvedValueOnce({ tier: 'premium' })

    const result = await isHouseholdPremium('owner-1')

    expect(result).toBe(true)
  })
})
