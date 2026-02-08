/**
 * Leaderboard Service
 * 
 * Handles real-time leaderboard ranking and snapshot management.
 * 
 * This service:
 * - Calculates real-time positions based on score
 * - Supports tie-breaking rules (earlier signup wins)
 * - Creates snapshots for final rankings
 * - Optimizes queries with indexed lookups
 * 
 * Performance considerations:
 * - Uses indexed queries (waitlistId + score) for fast ranking
 * - Caches position in Subscriber.position field (optional)
 * - Snapshots are materialized for campaign-end rankings
 * 
 * Design inspired by: KickoffLabs (real-time + snapshot), ViralLoops (tie-breaking)
 */

import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/src/generated/client'

export interface UpdateLeaderboardPositionParams {
  waitlistId: string
  subscriberId: string
  tx?: Prisma.TransactionClient
}

export interface GetLeaderboardParams {
  waitlistId: string
  limit?: number
  offset?: number
  useSnapshot?: boolean
  snapshotDate?: Date
}

export interface LeaderboardEntry {
  subscriberId: string
  email: string
  score: number
  position: number
  referralCount: number
  joinedAt: Date
}

/**
 * Update a subscriber's leaderboard position.
 * 
 * This function calculates the position based on:
 * 1. Score (higher = better) - source of truth
 * 2. Tie-breaker: Earlier signup wins (createdAt ASC)
 * 
 * Position is calculated by counting how many subscribers have:
 * - Higher score, OR
 * - Same score but earlier signup
 * 
 * Design decision: Position is cached in Subscriber.position field.
 * This is best-effort and eventually consistent:
 * - Updated when score changes
 * - May be slightly stale during high concurrency
 * - Can be recalculated in batch jobs
 * 
 * For large waitlists (100k+), consider:
 * - Periodic background jobs to recalculate all positions
 * - Redis caching for top N positions
 * - Materialized views for historical snapshots
 */
export async function updateLeaderboardPosition(
  params: UpdateLeaderboardPositionParams
): Promise<number> {
  const { waitlistId, subscriberId, tx } = params

  const client = tx || prisma

  try {
    // Get subscriber's current score and signup date
    const subscriber = await client.subscriber.findUnique({
      where: { id: subscriberId },
      select: {
        id: true,
        score: true,
        createdAt: true,
      },
    })

    if (!subscriber) {
      throw new Error('Subscriber not found')
    }

    // Calculate position: count subscribers with better rank
    // Better rank = higher score OR same score but earlier signup
    const position = await client.subscriber.count({
      where: {
        waitlistId,
        OR: [
          {
            score: {
              gt: subscriber.score,
            },
          },
          {
            score: subscriber.score,
            createdAt: {
              lt: subscriber.createdAt,
            },
          },
        ],
      },
    }) + 1

    // Cache position in Subscriber.position field (best-effort, eventually consistent)
    // This allows fast reads without recalculating every time
    await client.subscriber.update({
      where: { id: subscriberId },
      data: { position },
    })

    return position
  } catch (error) {
    console.error('Error updating leaderboard position:', error)
    throw error
  }
}

/**
 * Get the leaderboard for a waitlist.
 * 
 * Returns subscribers ranked by:
 * 1. Score (descending)
 * 2. CreatedAt (ascending) for tie-breaking
 * 
 * Supports pagination and optional snapshot-based ranking.
 */
export async function getLeaderboard(
  params: GetLeaderboardParams
): Promise<LeaderboardEntry[]> {
  const { waitlistId, limit = 100, offset = 0, useSnapshot = false, snapshotDate } = params

  try {
    if (useSnapshot && snapshotDate) {
      // Use snapshot for historical ranking
      const snapshots = await prisma.rankingSnapshot.findMany({
        where: {
          waitlistId,
          calculatedAt: {
            lte: snapshotDate,
          },
          isFinal: true,
        },
        orderBy: [
          { position: 'asc' },
        ],
        take: limit,
        skip: offset,
        include: {
          subscriber: {
            select: {
              id: true,
              email: true,
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
          },
        },
      })

      return snapshots.map((snapshot) => ({
        subscriberId: snapshot.subscriber.id,
        email: snapshot.subscriber.email,
        score: snapshot.score,
        position: snapshot.position,
        referralCount: snapshot.subscriber.referralsAsReferrer.length,
        joinedAt: snapshot.subscriber.createdAt,
      }))
    }

    // Real-time leaderboard
    // Uses score as source of truth, position is best-effort cache
    const subscribers = await prisma.subscriber.findMany({
      where: { waitlistId },
      orderBy: [
        { score: 'desc' },
        { createdAt: 'asc' }, // Tie-breaker: earlier signup wins
      ],
      take: limit,
      skip: offset,
      select: {
        id: true,
        email: true,
        score: true,
        position: true, // Include cached position
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

    // Calculate positions (use cached if available, otherwise calculate)
    const entries: LeaderboardEntry[] = subscribers.map((subscriber, index) => ({
      subscriberId: subscriber.id,
      email: subscriber.email,
      score: subscriber.score,
      position: subscriber.position ?? (offset + index + 1), // Use cached or calculate
      referralCount: subscriber.referralsAsReferrer.length,
      joinedAt: subscriber.createdAt,
    }))

    return entries
  } catch (error) {
    console.error('Error getting leaderboard:', error)
    throw error
  }
}

/**
 * Get a subscriber's current position in the leaderboard.
 * 
 * Uses cached position if available (best-effort, eventually consistent).
 * Recalculates if position is null or if forceRecalculate is true.
 */
export async function getSubscriberPosition(
  waitlistId: string,
  subscriberId: string,
  forceRecalculate: boolean = false
): Promise<number> {
  if (!forceRecalculate) {
    // Try to use cached position first
    const subscriber = await prisma.subscriber.findUnique({
      where: { id: subscriberId },
      select: {
        position: true,
        score: true,
      },
    })

    if (subscriber && subscriber.position !== null) {
      return subscriber.position
    }
  }

  // Recalculate if no cached position or forceRecalculate is true
  return updateLeaderboardPosition({ waitlistId, subscriberId })
}

/**
 * Create a snapshot of the current leaderboard.
 * 
 * This is useful for:
 * - Final rankings at campaign end
 * - Historical leaderboard views
 * - Preventing position changes after campaign ends
 * 
 * Snapshots are materialized and immutable once created.
 */
export async function createLeaderboardSnapshot(
  waitlistId: string,
  isFinal: boolean = false
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Get all subscribers ranked
    const subscribers = await tx.subscriber.findMany({
      where: { waitlistId },
      orderBy: [
        { score: 'desc' },
        { createdAt: 'asc' },
      ],
      select: {
        id: true,
        score: true,
      },
    })

    // Create snapshot records
    const snapshots = subscribers.map((subscriber, index) => ({
      waitlistId,
      subscriberId: subscriber.id,
      position: index + 1,
      score: subscriber.score,
      calculatedAt: new Date(),
      isFinal,
    }))

    // Batch insert snapshots
    await tx.rankingSnapshot.createMany({
      data: snapshots,
    })
  })
}

/**
 * Get top N subscribers for a waitlist.
 * Optimized query for common use case.
 */
export async function getTopSubscribers(
  waitlistId: string,
  topN: number = 10
): Promise<LeaderboardEntry[]> {
  return getLeaderboard({
    waitlistId,
    limit: topN,
    offset: 0,
  })
}

