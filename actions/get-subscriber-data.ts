'use server'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

/**
 * Get subscriber data by email from a cookie
 * Used to show progress on rewards cards
 */
export async function getSubscriberData(waitlistId: string) {
  try {
    const cookieStore = await cookies()
    const cookieName = `waitlist_subscriber_${waitlistId}`
    const subscriberEmail = cookieStore.get(cookieName)?.value

    if (!subscriberEmail) {
      return { success: true, subscriber: null }
    }

    const subscriber = await prisma.subscriber.findUnique({
      where: {
        waitlistId_email: {
          waitlistId,
          email: subscriberEmail.toLowerCase(),
        },
      },
      select: {
        id: true,
        email: true,
        score: true,
        position: true,
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

    if (!subscriber) {
      return { success: true, subscriber: null }
    }

    return {
      success: true,
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        score: subscriber.score,
        position: subscriber.position,
        referralCount: subscriber.referralsAsReferrer.length,
      },
    }
  } catch (error) {
    console.error('Error getting subscriber data:', error)
    return { success: false, subscriber: null }
  }
}

