import { db } from '@/lib/db/client'
import { getHouseholdMemberIds, isHouseholdPremium } from '@/lib/household'

export const FREE_TIER_SUBSCRIPTION_LIMIT = 10

// The cap applies to the whole household, not each member individually -
// Premium is checked against the household owner's tier, and the count
// spans every member's active/trial subscriptions.
export async function isAtFreeTierLimit(userId: string): Promise<boolean> {
  if (await isHouseholdPremium(userId)) {
    return false
  }

  const memberIds = await getHouseholdMemberIds(userId)

  const count = await db.subscription.count({
    where: { userId: { in: memberIds }, status: { in: ['active', 'trial'] } },
  })

  return count >= FREE_TIER_SUBSCRIPTION_LIMIT
}
