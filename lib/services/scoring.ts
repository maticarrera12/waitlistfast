/**
 * Scoring System Service
 * 
 * Flexible, rules-based point system for awarding points to subscribers.
 * Points are awarded based on PointRule configurations, not hardcoded values.
 * 
 * This service:
 * - Evaluates active PointRules for a given event
 * - Awards points and records them in PointLedger
 * - Updates subscriber's total score
 * - Supports conditional rules (e.g., milestone bonuses)
 * 
 * Design inspired by: ViralLoops (flexible point rules), KickoffLabs (event-based scoring)
 */

import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/src/generated/internal/prismaNamespace'
import { updateLeaderboardPosition } from './leaderboard'

export interface EvaluatePointRulesParams {
  waitlistId: string
  campaignId: string // Points are campaign-specific
  subscriberId: string
  event: 'SIGNUP' | 'REFERRAL_CONFIRMED' | 'EMAIL_VERIFIED' | 'MILESTONE' | 'MANUAL'
  referenceId?: string | null // ID of related record (referralId, etc.)
  metadata?: Record<string, any>
  tx?: Prisma.TransactionClient
}

export interface EvaluatePointRulesResult {
  totalPointsAwarded: number
  rulesApplied: number
}

/**
 * Evaluate and apply all active PointRules for a given event.
 * 
 * This function:
 * 1. Finds all active PointRules matching the event
 * 2. Evaluates conditions (if any)
 * 3. Awards points and records in PointLedger
 * 4. Updates subscriber's total score
 * 
 * All operations are transactional if tx is provided.
 */
export async function evaluatePointRules(
  params: EvaluatePointRulesParams
): Promise<number> {
  const { waitlistId, campaignId, subscriberId, event, referenceId, metadata, tx } = params

  const client = tx || prisma

  try {
    // 1. Find all active PointRules for this event
    const rules = await client.pointRule.findMany({
      where: {
        waitlistId,
        event,
        isActive: true,
      },
      orderBy: {
        priority: 'asc', // Lower priority = evaluated first
      },
    })

    if (rules.length === 0) {
      return 0 // No rules configured, no points awarded
    }

    // 2. Get subscriber's current stats for condition evaluation
    const subscriber = await client.subscriber.findUnique({
      where: { id: subscriberId },
      select: {
        id: true,
        score: true,
        verified: true,
        referrals: {
          select: { id: true },
        },
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

    let totalPointsAwarded = 0

    // 3. Evaluate each rule
    for (const rule of rules) {
      // Check conditions if any (milestones are conditions, not events)
      if (rule.conditions) {
        const conditions = rule.conditions as Record<string, any>
        const shouldApply = await evaluateRuleConditions(
          conditions,
          subscriber,
          event,
          metadata,
          client
        )

        if (!shouldApply) {
          continue // Skip this rule
        }
      }

      // 4. Award points
      const points = rule.points

      // Record in PointLedger (with campaignId and event for audit trail)
      await client.pointLedger.create({
        data: {
          subscriberId,
          campaignId,
          event,
          points,
          referenceId: referenceId || null,
          metadata: {
            ...(metadata || {}),
            ruleId: rule.id,
            ruleName: rule.name,
          },
        },
      })

      // Update subscriber's total score (source of truth)
      await client.subscriber.update({
        where: { id: subscriberId },
        data: {
          score: {
            increment: points,
          },
        },
      })

      totalPointsAwarded += points
    }

    // Recalculate position after score change (best-effort cache)
    if (totalPointsAwarded !== 0) {
      await updateLeaderboardPosition({
        waitlistId,
        subscriberId,
        tx: client,
      }).catch((error) => {
        // Don't fail point award if position update fails
        console.warn('Position update failed:', error)
      })
    }

    return totalPointsAwarded
  } catch (error) {
    console.error('Error evaluating point rules:', error)
    throw error
  }
}

/**
 * Evaluate rule conditions to determine if a rule should apply.
 * 
 * Milestones are conditions, not events. The event is still REFERRAL_CONFIRMED,
 * but the condition checks if it's the 5th referral, etc.
 * 
 * Supported conditions:
 * - referralCount: { equals: 5 } - Exactly 5 referrals (milestone)
 * - referralCount: { gte: 10 } - 10 or more referrals
 * - referralCount: { lte: 1 } - 1 or fewer referrals
 * - firstReferralOnly: true - Shorthand for referralCount === 1
 * - minScore: Minimum score required
 * - requireEmailVerification: true - Email must be verified
 */
async function evaluateRuleConditions(
  conditions: Record<string, any>,
  subscriber: {
    id: string
    score: number
    verified: boolean
    referrals: { id: string }[]
    referralsAsReferrer: { id: string }[]
  },
  event: string,
  metadata: Record<string, any> | undefined,
  client: Prisma.TransactionClient | typeof prisma
): Promise<boolean> {
  const referralCount = subscriber.referralsAsReferrer.length

  // Check referralCount conditions (for milestones)
  if (conditions.referralCount !== undefined) {
    const refCountCond = conditions.referralCount

    // Support object format: { equals: 5 }, { gte: 10 }, etc.
    if (typeof refCountCond === 'object') {
      if (refCountCond.equals !== undefined && referralCount !== refCountCond.equals) {
        return false
      }
      if (refCountCond.gte !== undefined && referralCount < refCountCond.gte) {
        return false
      }
      if (refCountCond.lte !== undefined && referralCount > refCountCond.lte) {
        return false
      }
      if (refCountCond.gt !== undefined && referralCount <= refCountCond.gt) {
        return false
      }
      if (refCountCond.lt !== undefined && referralCount >= refCountCond.lt) {
        return false
      }
    } else if (typeof refCountCond === 'number') {
      // Legacy: direct number means equals
      if (referralCount !== refCountCond) {
        return false
      }
    }
  }

  // Check firstReferralOnly condition (shorthand)
  if (conditions.firstReferralOnly === true) {
    if (referralCount !== 1) {
      return false
    }
  }

  // Check minScore condition
  if (conditions.minScore !== undefined) {
    if (subscriber.score < conditions.minScore) {
      return false
    }
  }

  // Check emailVerified condition
  if (conditions.requireEmailVerification === true) {
    if (!subscriber.verified) {
      return false
    }
  }

  return true // All conditions passed
}

/**
 * Manually adjust a subscriber's points.
 * Useful for admin actions, corrections, or special bonuses.
 */
export async function manualPointAdjustment(
  params: {
    waitlistId: string
    campaignId: string
    subscriberId: string
    points: number // Can be negative for penalties
    reason: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  const { waitlistId, campaignId, subscriberId, points, reason, metadata } = params

  await prisma.$transaction(async (tx) => {
    // Record in PointLedger
    await tx.pointLedger.create({
      data: {
        subscriberId,
        campaignId,
        event: 'MANUAL',
        points,
        metadata: {
          ...(metadata || {}),
          reason,
        },
      },
    })

    // Update subscriber's total score (source of truth)
    await tx.subscriber.update({
      where: { id: subscriberId },
      data: {
        score: {
          increment: points,
        },
      },
    })

    // Trigger position recalculation (best-effort cache)
    await updateLeaderboardPosition({
      waitlistId,
      subscriberId,
      tx,
    })
  })
}

/**
 * Get a subscriber's point history.
 * Now includes campaignId for proper audit trail.
 */
export async function getSubscriberPointHistory(
  subscriberId: string,
  campaignId?: string,
  limit: number = 50
) {
  return prisma.pointLedger.findMany({
    where: {
      subscriberId,
      ...(campaignId ? { campaignId } : {}),
    },
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

