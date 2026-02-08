/**
 * Reward Resolution Engine
 * 
 * Evaluates and assigns rewards to subscribers based on campaign rules.
 * 
 * This service:
 * - Evaluates reward distribution rules (TOP_N, MIN_SCORE, MIN_REFERRALS, MANUAL)
 * - Assigns rewards to eligible subscribers
 * - Prevents duplicate rewards
 * - Supports idempotent re-runs
 * 
 * Design inspired by: KickoffLabs (flexible reward rules), ViralLoops (tier-based rewards)
 */

import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/src/generated/internal/prismaNamespace'
import { getLeaderboard, getSubscriberPosition } from './leaderboard'

export interface EvaluateRewardUnlocksParams {
  waitlistId: string
  subscriberId: string
  campaignId: string
  tx?: Prisma.TransactionClient
}

export interface ResolveAllRewardsParams {
  waitlistId: string
  campaignId: string
  tx?: Prisma.TransactionClient
}

/**
 * Evaluate if a subscriber has unlocked any rewards.
 * 
 * This function:
 * 1. Gets all rewards for the campaign
 * 2. Checks each reward's distribution rule
 * 3. Determines if subscriber qualifies
 * 4. Creates SubscriberReward records for unlocked rewards
 * 
 * This is called after:
 * - A referral is confirmed
 * - Points are awarded
 * - Score changes
 */
export async function evaluateRewardUnlocks(
  params: EvaluateRewardUnlocksParams
): Promise<void> {
  const { waitlistId, subscriberId, campaignId, tx } = params

  const client = tx || prisma

  try {
    // Get all rewards for this campaign
    const rewards = await client.reward.findMany({
      where: { campaignId },
    })

    if (rewards.length === 0) {
      return // No rewards configured
    }

    // Get subscriber's current stats
    const subscriber = await client.subscriber.findUnique({
      where: { id: subscriberId },
      select: {
        id: true,
        score: true,
        createdAt: true,
        referralsAsReferrer: {
          where: {
            status: {
              in: ['CONFIRMED', 'VERIFIED', 'COMPLETED'],
            },
          },
          select: { id: true },
        },
      },
    })

    if (!subscriber) {
      throw new Error('Subscriber not found')
    }

    // Get subscriber's current position
    const position = await getSubscriberPosition(waitlistId, subscriberId)

    // Evaluate each reward
    for (const reward of rewards) {
      // Check if subscriber already has this reward
      const existingReward = await client.subscriberReward.findUnique({
        where: {
          subscriberId_rewardId: {
            subscriberId,
            rewardId: reward.id,
          },
        },
      })

      if (existingReward) {
        continue // Already has this reward
      }

      // Check if reward is already at max recipients
      if (reward.maxRecipients) {
        const recipientCount = await client.subscriberReward.count({
          where: {
            rewardId: reward.id,
            status: {
              in: ['UNLOCKED', 'CLAIMED'],
            },
          },
        })

        if (recipientCount >= reward.maxRecipients) {
          continue // Reward is full
        }
      }

      // Evaluate distribution rule
      const qualifies = await evaluateRewardRule(
        reward,
        subscriber,
        position,
        waitlistId,
        client
      )

      if (qualifies) {
        // Unlock reward
        await client.subscriberReward.create({
          data: {
            subscriberId,
            rewardId: reward.id,
            status: 'UNLOCKED',
            unlockedAt: new Date(),
          },
        })
      }
    }
  } catch (error) {
    console.error('Error evaluating reward unlocks:', error)
    throw error
  }
}

/**
 * Evaluate if a subscriber qualifies for a reward based on its distribution rule.
 */
async function evaluateRewardRule(
  reward: {
    id: string
    distributionRule: string
    ruleParams: any
    maxRecipients: number | null
  },
  subscriber: {
    id: string
    score: number
    createdAt: Date
    referralsAsReferrer: { id: string }[]
  },
  position: number,
  waitlistId: string,
  client: Prisma.TransactionClient | typeof prisma
): Promise<boolean> {
  const ruleParams = reward.ruleParams as Record<string, any>

  switch (reward.distributionRule) {
    case 'TOP_N': {
      const topN = ruleParams.topN as number
      return position <= topN
    }

    case 'MIN_SCORE': {
      const minScore = ruleParams.minScore as number
      return subscriber.score >= minScore
    }

    case 'MIN_REFERRALS': {
      const minReferrals = ruleParams.minReferrals as number
      const referralCount = subscriber.referralsAsReferrer.length
      return referralCount >= minReferrals
    }

    case 'MANUAL': {
      // Manual rewards are assigned by admins, not automatically
      return false
    }

    default:
      return false
  }
}

/**
 * Resolve all rewards for a campaign.
 * 
 * This function evaluates all subscribers and assigns rewards.
 * Useful for:
 * - Initial reward assignment when campaign starts
 * - Re-running after rule changes
 * - Final reward assignment at campaign end
 * 
 * This is idempotent: re-running won't create duplicate rewards.
 */
export async function resolveAllRewards(
  params: ResolveAllRewardsParams
): Promise<void> {
  const { waitlistId, campaignId, tx } = params

  const client = tx || prisma

  try {
    // Get all rewards for this campaign
    const rewards = await client.reward.findMany({
      where: { campaignId },
    })

    if (rewards.length === 0) {
      return // No rewards configured
    }

    // Get all subscribers for this waitlist
    const subscribers = await client.subscriber.findMany({
      where: { waitlistId },
      select: {
        id: true,
        score: true,
        createdAt: true,
        referralsAsReferrer: {
          where: {
            status: {
              in: ['CONFIRMED', 'VERIFIED', 'COMPLETED'],
            },
          },
          select: { id: true },
        },
      },
    })

    // Get leaderboard for position calculations
    const leaderboard = await getLeaderboard({
      waitlistId,
      limit: subscribers.length,
      offset: 0,
    })

    // Create a map of subscriberId -> position
    const positionMap = new Map<string, number>()
    leaderboard.forEach((entry) => {
      positionMap.set(entry.subscriberId, entry.position)
    })

    // Evaluate each subscriber against each reward
    for (const subscriber of subscribers) {
      const position = positionMap.get(subscriber.id) || subscribers.length

      for (const reward of rewards) {
        // Check if subscriber already has this reward
        const existingReward = await client.subscriberReward.findUnique({
          where: {
            subscriberId_rewardId: {
              subscriberId: subscriber.id,
              rewardId: reward.id,
            },
          },
        })

        if (existingReward) {
          continue // Already has this reward
        }

        // Check if reward is at max recipients
        if (reward.maxRecipients) {
          const recipientCount = await client.subscriberReward.count({
            where: {
              rewardId: reward.id,
              status: {
                in: ['UNLOCKED', 'CLAIMED'],
              },
            },
          })

          if (recipientCount >= reward.maxRecipients) {
            continue // Reward is full
          }
        }

        // Evaluate distribution rule
        const qualifies = await evaluateRewardRule(
          reward,
          subscriber,
          position,
          waitlistId,
          client
        )

        if (qualifies) {
          // Unlock reward
          await client.subscriberReward.create({
            data: {
              subscriberId: subscriber.id,
              rewardId: reward.id,
              status: 'UNLOCKED',
              unlockedAt: new Date(),
            },
          })
        }
      }
    }
  } catch (error) {
    console.error('Error resolving all rewards:', error)
    throw error
  }
}

/**
 * Get all rewards for a subscriber.
 */
export async function getSubscriberRewards(subscriberId: string) {
  return prisma.subscriberReward.findMany({
    where: { subscriberId },
    include: {
      reward: {
        include: {
          campaign: true,
        },
      },
    },
    orderBy: {
      unlockedAt: 'desc',
    },
  })
}

/**
 * Mark a reward as delivered/claimed.
 */
export async function markRewardDelivered(
  subscriberRewardId: string,
  metadata?: Record<string, any>
): Promise<void> {
  await prisma.subscriberReward.update({
    where: { id: subscriberRewardId },
    data: {
      status: 'CLAIMED',
      deliveredAt: new Date(),
      metadata: metadata || undefined,
    },
  })
}


