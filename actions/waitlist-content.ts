'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function getWaitlistContent(waitlistId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { error: 'Unauthorized' }

  const waitlist = await prisma.waitlist.findUnique({
    where: { id: waitlistId },
    select: {
      id: true,
      content: true,
      templateKey: true,
      slug: true,
    },
  })

  if (!waitlist) return { error: 'Waitlist not found' }

  return {
    content: waitlist.content as Record<string, any> | null,
    templateKey: waitlist.templateKey,
    slug: waitlist.slug,
  }
}

export async function saveWaitlistContent(
  waitlistId: string,
  content: Record<string, any>,
  waitlistSlug: string,
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { error: 'Unauthorized' }

  let orgId = session.session?.activeOrganizationId
  if (!orgId) {
    const membership = await prisma.member.findFirst({
      where: { userId: session.user.id },
      select: { organizationId: true },
    })
    if (membership) orgId = membership.organizationId
  }

  if (!orgId) return { error: 'No organization found' }

  const waitlist = await prisma.waitlist.findFirst({
    where: { id: waitlistId, organizationId: orgId },
    select: { id: true },
  })

  if (!waitlist) return { error: 'Waitlist not found or unauthorized' }

  await prisma.waitlist.update({
    where: { id: waitlistId },
    data: { content },
  })

  revalidatePath(`/dashboard/waitlists/${waitlistSlug}/settings/content`)
  revalidatePath(`/w/${waitlistSlug}`)

  return { success: true }
}


