import { prisma } from '@/lib/prisma'

export async function getWaitlistBySlug(slug: string) {
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

