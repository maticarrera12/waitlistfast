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
  campaignId?: string // Internal use only
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
    return await prisma.$transaction(
      async (tx) => {
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
        console.warn('[PROCESS_REFERRAL] No active campaign found for waitlist:', waitlistId)
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
        console.warn('[PROCESS_REFERRAL] Referrals are disabled in campaign settings')
        return {
          success: false,
          referrerId: null,
          pointsAwarded: 0,
          error: 'Referrals are disabled for this campaign',
        }
      }

      console.log('[PROCESS_REFERRAL] Active campaign found, referrals enabled:', settings.referralsEnabled ?? true)

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
        console.log('[PROCESS_REFERRAL] Created new referral record:', referral.id)
      } else {
        // Update existing referral to CONFIRMED status
        referral = await tx.referral.update({
          where: { id: referral.id },
          data: {
            referredId: subscriberId,
            status: 'CONFIRMED',
          },
        })
        console.log('[PROCESS_REFERRAL] Updated existing referral record:', referral.id)
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

      // Return result from transaction (rewards will be evaluated outside transaction)
      return {
        success: true,
        referrerId: referrer.id,
        pointsAwarded,
        campaignId: activeCampaign.id, // Include for reward evaluation
      }
      },
      {
        maxWait: 10000, // Maximum time to wait for a transaction slot (10s)
        timeout: 10000, // Maximum time the transaction can run (10s)
      }
    )
      .then(async (result) => {
        // Evaluate rewards outside transaction to avoid timeout
        // This is safe because rewards don't need to be in the same transaction
        if (result.success && result.referrerId && result.campaignId) {
          try {
            await evaluateRewardUnlocks({
              waitlistId,
              subscriberId: result.referrerId,
              campaignId: result.campaignId,
            })
          } catch (rewardError) {
            // Don't fail the referral if reward evaluation fails
            console.warn('[PROCESS_REFERRAL] Reward evaluation failed (non-critical):', rewardError)
          }
        }
        // Return result without campaignId (not part of public interface)
        return {
          success: result.success,
          referrerId: result.referrerId,
          pointsAwarded: result.pointsAwarded,
          error: result.error,
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

