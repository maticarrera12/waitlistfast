/**
 * Referral Flow Service
 * 
 * Handles the core referral logic when a new subscriber joins with a referral code.
 * This service is responsible for:
 * - Validating referral codes
 * - Preventing self-referrals and duplicate referrals
 * - Assigning referredBy relationships
 * - Triggering scoring rules
 * - Updating leaderboard positions
 * - Checking reward unlocks
 * 
 * All operations are transactional and idempotent for safety under concurrency.
 * 
 * Design inspired by: KickoffLabs, ViralLoops, Prefinery
 */

import { prisma } from '@/lib/prisma'
import { evaluatePointRules } from './scoring'
import { updateLeaderboardPosition } from './leaderboard'
import { evaluateRewardUnlocks } from './reward-resolution'

export interface ProcessReferralParams {
  subscriberId: string
  referralCode: string | null
  waitlistId: string
  email: string
}

export interface ProcessReferralResult {
  success: boolean
  referrerId: string | null
  pointsAwarded: number
  error?: string
}

/**
 * Process a referral when a subscriber joins with a referral code.
 * 
 * This function:
 * 1. Validates the referral code exists and belongs to the same waitlist
 * 2. Prevents self-referrals (subscriber cannot refer themselves)
 * 3. Prevents duplicate referrals (same referrer-referred pair)
 * 4. Creates the Referral record
 * 5. Awards points based on active PointRules
 * 6. Updates leaderboard positions
 * 7. Checks for reward unlocks
 * 
 * All operations are wrapped in a transaction for atomicity.
 */
export async function processReferral(
  params: ProcessReferralParams
): Promise<ProcessReferralResult> {
  const { subscriberId, referralCode, waitlistId, email } = params

  // If no referral code, nothing to process
  if (!referralCode) {
    return {
      success: true,
      referrerId: null,
      pointsAwarded: 0,
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Find the referrer by referral code
      const referrer = await tx.subscriber.findUnique({
        where: { referralCode },
        select: {
          id: true,
          email: true,
          waitlistId: true,
        },
      })

      // 2. Validate referral code exists
      if (!referrer) {
        return {
          success: false,
          referrerId: null,
          pointsAwarded: 0,
          error: 'Invalid referral code',
        }
      }

      // 3. Validate referrer is in the same waitlist (security check)
      if (referrer.waitlistId !== waitlistId) {
        return {
          success: false,
          referrerId: null,
          pointsAwarded: 0,
          error: 'Referral code does not belong to this waitlist',
        }
      }

      // 4. Prevent self-referrals
      if (referrer.id === subscriberId) {
        return {
          success: false,
          referrerId: null,
          pointsAwarded: 0,
          error: 'Cannot refer yourself',
        }
      }

      // 5. Prevent duplicate referrals
      // Check if this referral already exists
      const existingReferral = await tx.referral.findFirst({
        where: {
          waitlistId,
          referrerId: referrer.id,
          referredEmail: email.toLowerCase(),
          status: {
            in: ['CONFIRMED', 'VERIFIED', 'COMPLETED'],
          },
        },
      })

      if (existingReferral) {
        // Referral already exists, return success but don't award points again
        return {
          success: true,
          referrerId: referrer.id,
          pointsAwarded: 0,
        }
      }

      // 6. Get active campaign to check if referrals are enabled
      const activeCampaign = await tx.referralCampaign.findFirst({
        where: {
          waitlistId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          settings: true,
        },
      })

      if (!activeCampaign) {
        // No active campaign, referrals are disabled
        return {
          success: false,
          referrerId: null,
          pointsAwarded: 0,
          error: 'No active referral campaign',
        }
      }

      const settings = activeCampaign.settings as {
        referralsEnabled?: boolean
        allowSelfReferrals?: boolean
      }

      if (settings.referralsEnabled === false) {
        return {
          success: false,
          referrerId: null,
          pointsAwarded: 0,
          error: 'Referrals are disabled for this campaign',
        }
      }

      // 7. Create or update Referral record
      // First, try to find an existing referral record (in case of retry)
      let referral = await tx.referral.findFirst({
        where: {
          waitlistId,
          referrerId: referrer.id,
          referredEmail: email.toLowerCase(),
        },
      })

      if (!referral) {
        referral = await tx.referral.create({
          data: {
            waitlistId,
            referrerId: referrer.id,
            referredEmail: email.toLowerCase(),
            referredId: subscriberId,
            status: 'COMPLETED', // Subscriber has joined
            source: null, // Can be enhanced with tracking params
          },
        })
      } else {
        // Update existing referral to CONFIRMED status
        referral = await tx.referral.update({
          where: { id: referral.id },
          data: {
            referredId: subscriberId,
            status: 'CONFIRMED',
          },
        })
      }

      // 8. Update subscriber's referredBy field
      await tx.subscriber.update({
        where: { id: subscriberId },
        data: { referredById: referrer.id },
      })

      // 9. Award points to referrer based on active PointRules
      const pointsAwarded = await evaluatePointRules({
        waitlistId,
        campaignId: activeCampaign.id,
        subscriberId: referrer.id,
        event: 'REFERRAL_CONFIRMED',
        referenceId: referral.id,
        metadata: {
          referredSubscriberId: subscriberId,
          referredEmail: email,
        },
        tx,
      })

      // 10. Update leaderboard positions for referrer
      await updateLeaderboardPosition({
        waitlistId,
        subscriberId: referrer.id,
        tx,
      })

      // 11. Check for reward unlocks for referrer
      await evaluateRewardUnlocks({
        waitlistId,
        subscriberId: referrer.id,
        campaignId: activeCampaign.id,
        tx,
      })

      return {
        success: true,
        referrerId: referrer.id,
        pointsAwarded,
      }
    })
  } catch (error) {
    console.error('Error processing referral:', error)
    return {
      success: false,
      referrerId: null,
      pointsAwarded: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Validate a referral code without processing it.
 * Useful for UI validation before submission.
 */
export async function validateReferralCode(
  referralCode: string,
  waitlistId: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const referrer = await prisma.subscriber.findUnique({
      where: { referralCode },
      select: {
        id: true,
        waitlistId: true,
      },
    })

    if (!referrer) {
      return { valid: false, error: 'Invalid referral code' }
    }

    if (referrer.waitlistId !== waitlistId) {
      return { valid: false, error: 'Referral code does not belong to this waitlist' }
    }

    // Check if campaign allows referrals
    const activeCampaign = await prisma.referralCampaign.findFirst({
      where: {
        waitlistId,
        status: 'ACTIVE',
      },
      select: {
        settings: true,
      },
    })

    if (!activeCampaign) {
      return { valid: false, error: 'No active referral campaign' }
    }

    const settings = activeCampaign.settings as { referralsEnabled?: boolean }
    if (settings.referralsEnabled === false) {
      return { valid: false, error: 'Referrals are disabled' }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

