'use server'

import { prisma } from '@/lib/prisma'

/**
 * Public function to get point rules for a waitlist's active referral campaign
 * No authentication required - for public waitlist pages
 */
export async function getPublicPointRules(waitlistId: string) {
  try {
    const campaign = await prisma.referralCampaign.findFirst({
      where: { 
        waitlistId,
        status: 'ACTIVE' // Only show rules for active campaigns
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!campaign) {
      return { success: true, rules: [] }
    }

    // Get point rules for the waitlist (they're linked to waitlist, not campaign directly)
    const rules = await prisma.pointRule.findMany({
      where: { 
        waitlistId,
        isActive: true, // Only show active rules
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    })

    return { 
      success: true, 
      rules,
    }
  } catch (error) {
    console.error('Error getting public point rules:', error)
    return {
      success: false,
      rules: [],
      error: error instanceof Error ? error.message : 'Failed to get point rules',
    }
  }
}

/**
 * Public function to get rewards for a waitlist's active referral campaign
 * No authentication required - for public waitlist pages
 */
export async function getPublicRewards(waitlistId: string) {
  try {
    const campaign = await prisma.referralCampaign.findFirst({
      where: { 
        waitlistId,
        status: 'ACTIVE' // Only show rewards for active campaigns
      },
      include: {
        rewards: {
          where: {
            // Only show active rewards (you might want to add an active field)
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!campaign) {
      return { success: true, rewards: [] }
    }

    return { 
      success: true, 
      rewards: campaign.rewards,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
      }
    }
  } catch (error) {
    console.error('Error getting public rewards:', error)
    return {
      success: false,
      rewards: [],
      error: error instanceof Error ? error.message : 'Failed to get rewards',
    }
  }
}

