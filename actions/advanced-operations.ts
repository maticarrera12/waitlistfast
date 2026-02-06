'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { manualPointAdjustment } from '@/lib/services/scoring'
import { createLeaderboardSnapshot } from '@/lib/services/leaderboard'
import { getWaitlistAccess } from './referral-campaign'

/**
 * Server action for manual point adjustment
 */
export async function adjustSubscriberPoints(
  waitlistId: string,
  campaignId: string,
  subscriberId: string,
  points: number,
  reason: string
) {
  try {
    await getWaitlistAccess(waitlistId)

    await manualPointAdjustment({
      waitlistId,
      campaignId,
      subscriberId,
      points,
      reason,
    })

    return { success: true }
  } catch (error) {
    console.error('Error adjusting points:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to adjust points',
    }
  }
}

/**
 * Server action for creating leaderboard snapshot
 */
export async function createSnapshot(waitlistId: string, isFinal: boolean = false) {
  try {
    await getWaitlistAccess(waitlistId)

    await createLeaderboardSnapshot(waitlistId, isFinal)

    return { success: true }
  } catch (error) {
    console.error('Error creating snapshot:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create snapshot',
    }
  }
}

