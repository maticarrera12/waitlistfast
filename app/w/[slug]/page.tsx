import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { WaitlistPublicView } from './_components/waitlist-public-view'
import { getPublicRewards, getPublicPointRules } from '@/actions/public-rewards'
import { getSubscriberData } from '@/actions/get-subscriber-data'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

async function getWaitlist(slug: string) {
  const waitlist = await prisma.waitlist.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          subscribers: true
        }
      },
      organization: {
        select: {
          name: true
        }
      }
    }
  })

  return waitlist
}

export default async function PublicWaitlistPage({ params }: PageProps) {
  const { slug } = await params
  
  if (!slug) {
    notFound()
  }
  
  const waitlist = await getWaitlist(slug)

  if (!waitlist) {
    notFound()
  }

  const settings = waitlist.settings as { 
    theme?: string
    projectType?: string
    brandColor?: string
  } | null

  // Get rewards and point rules for the active referral campaign
  // Also get subscriber data if user has joined (from cookie)
  const [rewardsResult, pointRulesResult, subscriberDataResult] = await Promise.all([
    getPublicRewards(waitlist.id),
    getPublicPointRules(waitlist.id),
    getSubscriberData(waitlist.id),
  ])
  const rewards = rewardsResult.success ? rewardsResult.rewards || [] : []
  const pointRules = pointRulesResult.success ? pointRulesResult.rules || [] : []
  const subscriber = subscriberDataResult.success ? subscriberDataResult.subscriber : null

  return (
    <WaitlistPublicView 
      waitlist={waitlist}
      subscriberCount={waitlist._count.subscribers}
      settings={settings}
      rewards={rewards}
      pointRules={pointRules}
      subscriber={subscriber}
    />
  )
}

