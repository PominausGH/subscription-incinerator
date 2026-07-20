import { db } from '@/lib/db/client'
import { isPremium } from '@/lib/auth'

// The household "owner" is whoever nobody else's householdOwnerId points away
// from - i.e. a user with no householdOwnerId is the owner of their own
// household (even if nobody has joined it yet).
export async function getHouseholdOwnerId(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { householdOwnerId: true },
  })
  return user?.householdOwnerId ?? userId
}

export async function getHouseholdMemberIds(userId: string): Promise<string[]> {
  const ownerId = await getHouseholdOwnerId(userId)
  const members = await db.user.findMany({
    where: { OR: [{ id: ownerId }, { householdOwnerId: ownerId }] },
    select: { id: true },
  })
  return members.map((m) => m.id)
}

// Premium features are gated on the household owner's tier, not the
// requesting member's own tier - one Premium subscription covers everyone
// in the household.
export async function isHouseholdPremium(userId: string): Promise<boolean> {
  const ownerId = await getHouseholdOwnerId(userId)
  const owner = await db.user.findUnique({
    where: { id: ownerId },
    select: { tier: true },
  })
  return isPremium({ tier: owner?.tier })
}
