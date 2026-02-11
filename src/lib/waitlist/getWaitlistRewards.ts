import { getPublicRewards, getPublicPointRules } from '@/actions/public-rewards'

export async function getWaitlistRewards(waitlistId: string) {
  const [rewardsResult, pointRulesResult] = await Promise.all([
    getPublicRewards(waitlistId),
    getPublicPointRules(waitlistId),
  ])

  const rewards = rewardsResult.success ? rewardsResult.rewards || [] : []
  const pointRules = pointRulesResult.success ? pointRulesResult.rules || [] : []

  return {
    rewards,
    pointRules,
  }
}

