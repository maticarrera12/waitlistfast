import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const subscribeSchema = z.object({
  waitlistId: z.string(),
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = subscribeSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    const { waitlistId, email } = validated.data

    // Verificar que la waitlist existe
    const waitlist = await prisma.waitlist.findUnique({
      where: { id: waitlistId }
    })

    if (!waitlist) {
      return NextResponse.json(
        { error: 'Waitlist not found' },
        { status: 404 }
      )
    }

    // Verificar si el email ya está suscrito
    const existingSubscriber = await prisma.subscriber.findFirst({
      where: {
        waitlistId,
        email: email.toLowerCase()
      }
    })

    if (existingSubscriber) {
      return NextResponse.json(
        { error: 'Email already subscribed to this waitlist' },
        { status: 400 }
      )
    }

    // Generar código de referencia único
    const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase()

    // Obtener el número de suscriptores para calcular la posición
    const subscriberCount = await prisma.subscriber.count({
      where: { waitlistId }
    })

    // Crear el suscriptor
    const subscriber = await prisma.subscriber.create({
      data: {
        email: email.toLowerCase(),
        waitlistId,
        referralCode,
        position: subscriberCount + 1,
        score: 0,
        verified: false
      }
    })

    return NextResponse.json({
      success: true,
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        referralCode: subscriber.referralCode,
        position: subscriber.position
      }
    })
  } catch (error) {
    console.error('Error subscribing to waitlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

