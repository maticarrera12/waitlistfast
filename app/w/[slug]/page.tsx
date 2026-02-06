import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { WaitlistPublicView } from './_components/waitlist-public-view'

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

  return (
    <WaitlistPublicView 
      waitlist={waitlist}
      subscriberCount={waitlist._count.subscribers}
      settings={settings}
    />
  )
}

