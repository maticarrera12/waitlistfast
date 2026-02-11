import { notFound } from 'next/navigation'
import { getWaitlistBySlug } from '@/src/lib/waitlist/getWaitlistBySlug'
import { getWaitlistRewards } from '@/src/lib/waitlist/getWaitlistRewards'
import { getSubscriberData } from '@/actions/get-subscriber-data'
import { getTemplate } from '@/src/templates/registry'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function PublicWaitlistPage({ params }: PageProps) {
  const { slug } = await params
  
  if (!slug) {
    notFound()
  }
  
  const waitlist = await getWaitlistBySlug(slug)

  if (!waitlist) {
    notFound()
  }

  // Get template key from waitlist, default to 'saas-minimal'
  const templateKey = waitlist.templateKey || 'saas-minimal'
  const Template = getTemplate(templateKey)

  // Get rewards, point rules, and subscriber data
  const [rewardsData, subscriberDataResult] = await Promise.all([
    getWaitlistRewards(waitlist.id),
    getSubscriberData(waitlist.id),
  ])
  
  const rewards = rewardsData.rewards || []
  const pointRules = rewardsData.pointRules || []
  const subscriber = subscriberDataResult.success ? subscriberDataResult.subscriber : null

  return (
    <Template 
      waitlist={{
        id: waitlist.id,
        name: waitlist.name,
        slug: waitlist.slug,
        headline: waitlist.headline,
        description: waitlist.description,
        settings: waitlist.settings,
        content: waitlist.content,
        templateConfig: waitlist.templateConfig,
      }}
      subscriberCount={waitlist._count.subscribers}
      rewards={rewards}
      pointRules={pointRules}
      subscriber={subscriber}
    />
  )
}

