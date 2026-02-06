'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getWaitlistAccess } from './referral-campaign'

// ============================================================================
// SCHEMAS
// ============================================================================

const rewardPayloadSchema = z.record(z.any()) // JSON payload

const rewardRuleParamsSchema = z.object({
  topN: z.number().int().positive().optional(),
  minScore: z.number().int().optional(),
  minReferrals: z.number().int().positive().optional(),
})

const createRewardSchema = z.object({
  campaignId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['FEATURE', 'ACCESS', 'DISCOUNT', 'CUSTOM']),
  distributionRule: z.enum(['TOP_N', 'MIN_SCORE', 'MIN_REFERRALS', 'MANUAL']),
  ruleParams: rewardRuleParamsSchema,
  payload: rewardPayloadSchema,
  maxRecipients: z.number().int().positive().nullable().optional(),
})

const updateRewardSchema = createRewardSchema.partial().extend({
  rewardId: z.string(),
})

// ============================================================================
// REWARD CRUD
// ============================================================================

export async function getRewards(campaignId: string) {
  try {
    const campaign = await prisma.referralCampaign.findUnique({
      where: { id: campaignId },
      include: { waitlist: true },
    })

    if (!campaign) {
      return { success: false, error: 'Campaign not found' }
    }

    await getWaitlistAccess(campaign.waitlistId)

    const rewards = await prisma.reward.findMany({
      where: { campaignId },
      include: {
        _count: {
          select: { subscriberRewards: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return { success: true, rewards }
  } catch (error) {
    console.error('Error getting rewards:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get rewards',
    }
  }
}

export async function createReward(data: z.infer<typeof createRewardSchema>) {
  try {
    const validated = createRewardSchema.parse(data)
    const campaign = await prisma.referralCampaign.findUnique({
      where: { id: validated.campaignId },
      include: { waitlist: true },
    })

    if (!campaign) {
      return { success: false, error: 'Campaign not found' }
    }

    await getWaitlistAccess(campaign.waitlistId)

    const reward = await prisma.reward.create({
      data: {
        campaignId: validated.campaignId,
        name: validated.name,
        description: validated.description || null,
        type: validated.type,
        distributionRule: validated.distributionRule,
        ruleParams: validated.ruleParams,
        payload: validated.payload,
        maxRecipients: validated.maxRecipients || null,
      },
    })

    revalidatePath(`/dashboard/waitlists/${campaign.waitlist.slug}/settings/referral`)
    return { success: true, reward }
  } catch (error) {
    console.error('Error creating reward:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create reward',
    }
  }
}

export async function updateReward(data: z.infer<typeof updateRewardSchema>) {
  try {
    const validated = updateRewardSchema.parse(data)
    const reward = await prisma.reward.findUnique({
      where: { id: validated.rewardId },
      include: {
        campaign: {
          include: { waitlist: true },
        },
      },
    })

    if (!reward) {
      return { success: false, error: 'Reward not found' }
    }

    await getWaitlistAccess(reward.campaign.waitlistId)

    const updated = await prisma.reward.update({
      where: { id: validated.rewardId },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.type && { type: validated.type }),
        ...(validated.distributionRule && { distributionRule: validated.distributionRule }),
        ...(validated.ruleParams && { ruleParams: validated.ruleParams }),
        ...(validated.payload && { payload: validated.payload }),
        ...(validated.maxRecipients !== undefined && { maxRecipients: validated.maxRecipients }),
      },
    })

    revalidatePath(`/dashboard/waitlists/${reward.campaign.waitlist.slug}/settings/referral`)
    return { success: true, reward: updated }
  } catch (error) {
    console.error('Error updating reward:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update reward',
    }
  }
}

export async function deleteReward(rewardId: string) {
  try {
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
      include: {
        campaign: {
          include: { waitlist: true },
        },
      },
    })

    if (!reward) {
      return { success: false, error: 'Reward not found' }
    }

    await getWaitlistAccess(reward.campaign.waitlistId)

    await prisma.reward.delete({
      where: { id: rewardId },
    })

    revalidatePath(`/dashboard/waitlists/${reward.campaign.waitlist.slug}/settings/referral`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting reward:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete reward',
    }
  }
}

