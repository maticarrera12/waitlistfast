'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getDefaultPointRules, getDefaultRewards } from '@/lib/defaults/referral-campaign-defaults'

// ============================================================================
// SCHEMAS
// ============================================================================

const campaignSettingsSchema = z.object({
  referralsEnabled: z.boolean().default(true),
  leaderboardEnabled: z.boolean().default(true),
  maxWinners: z.number().int().positive().nullish(), // Accepts null, undefined, or positive number
  scoringMode: z.enum(['POINTS', 'REFERRALS_ONLY']).default('POINTS'),
  snapshotLeaderboard: z.boolean().default(false),
  allowSelfReferrals: z.boolean().default(false),
  requireEmailVerification: z.boolean().default(false),
  tieBreaker: z.enum(['EARLIEST_SIGNUP', 'LATEST_SIGNUP']).default('EARLIEST_SIGNUP'),
})

const createCampaignSchema = z.object({
  waitlistId: z.string(),
  name: z.string().min(1),
  settings: campaignSettingsSchema,
  startsAt: z.date().nullable().optional(),
  endsAt: z.date().nullable().optional(),
})

const updateCampaignSchema = z.object({
  campaignId: z.string(),
  name: z.string().min(1).optional(),
  settings: campaignSettingsSchema.optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED']).optional(),
  startsAt: z.date().nullable().optional(),
  endsAt: z.date().nullable().optional(),
})

// ============================================================================
// HELPER: Get user's organization and verify waitlist access
// ============================================================================

export async function getWaitlistAccess(waitlistId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  let orgId = session.session?.activeOrganizationId
  if (!orgId) {
    const membership = await prisma.member.findFirst({
      where: { userId: session.user.id },
      select: { organizationId: true },
    })
    if (membership) orgId = membership.organizationId
  }

  if (!orgId) {
    throw new Error('No organization found')
  }

  const waitlist = await prisma.waitlist.findFirst({
    where: {
      id: waitlistId,
      organizationId: orgId,
    },
  })

  if (!waitlist) {
    throw new Error('Waitlist not found or access denied')
  }

  return { waitlist, orgId }
}

// ============================================================================
// CAMPAIGN CRUD
// ============================================================================

export async function getReferralCampaign(waitlistId: string) {
  try {
    await getWaitlistAccess(waitlistId)

    const campaign = await prisma.referralCampaign.findFirst({
      where: { waitlistId },
      include: {
        rewards: {
          include: {
            _count: {
              select: { subscriberRewards: true },
            },
          },
        },
        pointLedgers: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, campaign }
  } catch (error) {
    console.error('Error getting campaign:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get campaign',
    }
  }
}

export async function createReferralCampaign(data: z.infer<typeof createCampaignSchema>) {
  try {
    const { waitlist } = await getWaitlistAccess(data.waitlistId)

    // Check if there's already an active campaign
    const existingActive = await prisma.referralCampaign.findFirst({
      where: {
        waitlistId: data.waitlistId,
        status: 'ACTIVE',
      },
    })

    if (existingActive) {
      return {
        success: false,
        error: 'An active campaign already exists. Please pause or end it first.',
      }
    }

    const validated = createCampaignSchema.parse(data)

    // Create campaign with defaults in a transaction
    const campaign = await prisma.$transaction(async (tx) => {
      // Create campaign
      const newCampaign = await tx.referralCampaign.create({
        data: {
          waitlistId: validated.waitlistId,
          name: validated.name,
          status: 'DRAFT',
          settings: validated.settings,
          startsAt: validated.startsAt || null,
          endsAt: validated.endsAt || null,
        },
      })

      // Create default point rules
      const defaultPointRules = getDefaultPointRules(validated.waitlistId)
      if (defaultPointRules.length > 0) {
        await tx.pointRule.createMany({
          data: defaultPointRules.map((rule) => ({
            waitlistId: validated.waitlistId,
            event: rule.event,
            points: rule.points,
            conditions: rule.conditions,
            name: rule.name,
            description: rule.description,
            isActive: rule.isActive,
            priority: rule.priority,
          })),
        })
      }

      // Create default rewards
      const defaultRewards = getDefaultRewards(newCampaign.id)
      if (defaultRewards.length > 0) {
        await tx.reward.createMany({
          data: defaultRewards.map((reward) => ({
            campaignId: newCampaign.id,
            name: reward.name,
            description: reward.description,
            type: reward.type,
            distributionRule: reward.distributionRule,
            ruleParams: reward.ruleParams,
            payload: reward.payload,
            maxRecipients: reward.maxRecipients,
          })),
        })
      }

      return newCampaign
    })

    revalidatePath(`/dashboard/waitlists/${waitlist.slug}/settings/referral`)
    return { success: true, campaign }
  } catch (error) {
    console.error('Error creating campaign:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create campaign',
    }
  }
}

export async function updateReferralCampaign(data: z.infer<typeof updateCampaignSchema>) {
  try {
    const validated = updateCampaignSchema.parse(data)
    const campaign = await prisma.referralCampaign.findUnique({
      where: { id: validated.campaignId },
      include: { waitlist: true },
    })

    if (!campaign) {
      return { success: false, error: 'Campaign not found' }
    }

    await getWaitlistAccess(campaign.waitlistId)

    // Prevent status changes that would create multiple active campaigns
    if (validated.status === 'ACTIVE') {
      const existingActive = await prisma.referralCampaign.findFirst({
        where: {
          waitlistId: campaign.waitlistId,
          status: 'ACTIVE',
          id: { not: validated.campaignId },
        },
      })

      if (existingActive) {
        return {
          success: false,
          error: 'Another active campaign exists. Please pause or end it first.',
        }
      }
    }

    const updated = await prisma.referralCampaign.update({
      where: { id: validated.campaignId },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.settings && { settings: validated.settings }),
        ...(validated.status && { status: validated.status }),
        ...(validated.startsAt !== undefined && { startsAt: validated.startsAt }),
        ...(validated.endsAt !== undefined && { endsAt: validated.endsAt }),
      },
    })

    revalidatePath(`/dashboard/waitlists/${campaign.waitlist.slug}/settings/referral`)
    return { success: true, campaign: updated }
  } catch (error) {
    console.error('Error updating campaign:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update campaign',
    }
  }
}

export async function updateCampaignStatus(
  campaignId: string,
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED'
) {
  try {
    const campaign = await prisma.referralCampaign.findUnique({
      where: { id: campaignId },
      include: { waitlist: true },
    })

    if (!campaign) {
      return { success: false, error: 'Campaign not found' }
    }

    await getWaitlistAccess(campaign.waitlistId)

    // Prevent multiple active campaigns
    if (status === 'ACTIVE') {
      const existingActive = await prisma.referralCampaign.findFirst({
        where: {
          waitlistId: campaign.waitlistId,
          status: 'ACTIVE',
          id: { not: campaignId },
        },
      })

      if (existingActive) {
        return {
          success: false,
          error: 'Another active campaign exists. Please pause or end it first.',
        }
      }
    }

    const updated = await prisma.referralCampaign.update({
      where: { id: campaignId },
      data: { status },
    })

    revalidatePath(`/dashboard/waitlists/${campaign.waitlist.slug}/settings/referral`)
    return { success: true, campaign: updated }
  } catch (error) {
    console.error('Error updating campaign status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update status',
    }
  }
}

