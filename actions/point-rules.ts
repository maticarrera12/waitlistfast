'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getWaitlistAccess } from './referral-campaign'

// ============================================================================
// SCHEMAS
// ============================================================================

const pointRuleSchema = z.object({
  waitlistId: z.string(),
  event: z.enum(['SIGNUP', 'REFERRAL_CONFIRMED', 'EMAIL_VERIFIED', 'MILESTONE', 'MANUAL']),
  points: z.number().int(),
  conditions: z.record(z.any()).nullable().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  priority: z.number().int().default(0),
})

const updatePointRuleSchema = pointRuleSchema.partial().extend({
  ruleId: z.string(),
})

// ============================================================================
// POINT RULE CRUD
// ============================================================================

export async function getPointRules(waitlistId: string) {
  try {
    await getWaitlistAccess(waitlistId)

    const rules = await prisma.pointRule.findMany({
      where: { waitlistId },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    })

    return { success: true, rules }
  } catch (error) {
    console.error('Error getting point rules:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get rules',
    }
  }
}

export async function createPointRule(data: z.infer<typeof pointRuleSchema>) {
  try {
    const { waitlist } = await getWaitlistAccess(data.waitlistId)
    const validated = pointRuleSchema.parse(data)

    const rule = await prisma.pointRule.create({
      data: {
        waitlistId: validated.waitlistId,
        event: validated.event,
        points: validated.points,
        conditions: validated.conditions || undefined,
        name: validated.name || null,
        description: validated.description || null,
        isActive: validated.isActive,
        priority: validated.priority,
      },
    })

    revalidatePath(`/dashboard/waitlists/${waitlist.slug}/settings/referral`)
    return { success: true, rule }
  } catch (error) {
    console.error('Error creating point rule:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create rule',
    }
  }
}

export async function updatePointRule(data: z.infer<typeof updatePointRuleSchema>) {
  try {
    const validated = updatePointRuleSchema.parse(data)
    const rule = await prisma.pointRule.findUnique({
      where: { id: validated.ruleId },
      include: { waitlist: true },
    })

    if (!rule) {
      return { success: false, error: 'Rule not found' }
    }

    await getWaitlistAccess(rule.waitlistId)

    const updated = await prisma.pointRule.update({
      where: { id: validated.ruleId },
      data: {
        ...(validated.event && { event: validated.event }),
        ...(validated.points !== undefined && { points: validated.points }),
        ...(validated.conditions !== undefined && { 
          conditions: validated.conditions === null ? undefined : validated.conditions 
        }),
        ...(validated.name !== undefined && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.isActive !== undefined && { isActive: validated.isActive }),
        ...(validated.priority !== undefined && { priority: validated.priority }),
      },
    })

    revalidatePath(`/dashboard/waitlists/${rule.waitlist.slug}/settings/referral`)
    return { success: true, rule: updated }
  } catch (error) {
    console.error('Error updating point rule:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update rule',
    }
  }
}

export async function deletePointRule(ruleId: string) {
  try {
    const rule = await prisma.pointRule.findUnique({
      where: { id: ruleId },
      include: { waitlist: true },
    })

    if (!rule) {
      return { success: false, error: 'Rule not found' }
    }

    await getWaitlistAccess(rule.waitlistId)

    await prisma.pointRule.delete({
      where: { id: ruleId },
    })

    revalidatePath(`/dashboard/waitlists/${rule.waitlist.slug}/settings/referral`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting point rule:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete rule',
    }
  }
}

export async function reorderPointRules(ruleIds: string[]) {
  try {
    if (ruleIds.length === 0) {
      return { success: false, error: 'No rules provided' }
    }

    // Get first rule to verify access
    const firstRule = await prisma.pointRule.findUnique({
      where: { id: ruleIds[0] },
      include: { waitlist: true },
    })

    if (!firstRule) {
      return { success: false, error: 'Rule not found' }
    }

    await getWaitlistAccess(firstRule.waitlistId)

    // Update priorities based on order
    await prisma.$transaction(
      ruleIds.map((id, index) =>
        prisma.pointRule.update({
          where: { id },
          data: { priority: index },
        })
      )
    )

    revalidatePath(`/dashboard/waitlists/${firstRule.waitlist.slug}/settings/referral`)
    return { success: true }
  } catch (error) {
    console.error('Error reordering point rules:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder rules',
    }
  }
}

