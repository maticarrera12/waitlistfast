'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { processReferral } from '@/lib/services/referral-flow'
import { evaluatePointRules } from '@/lib/services/scoring'
import { getSubscriberPosition } from '@/lib/services/leaderboard'

const joinSchema = z.object({
  email: z.string().email(),
  waitlistId: z.string(),
})

// Función para generar código de referencia único
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Sin 0, O, I, 1 para evitar confusión
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function joinWaitlist(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const waitlistId = formData.get('waitlistId') as string

  // 1. Validar inputs
  const validation = joinSchema.safeParse({ email, waitlistId })
  if (!validation.success) {
    return { error: "Please enter a valid email." }
  }

  // 2. Verificar si ya está registrado (Idempotencia)
  const existingSubscriber = await prisma.subscriber.findUnique({
    where: {
      waitlistId_email: { 
        waitlistId, 
        email: email.toLowerCase() 
      }
    }
  })

  // Si ya existe, simplemente devolvemos sus datos (Login implícito)
  if (existingSubscriber) {
    // Calcular su posición usando el servicio de leaderboard
    const position = await getSubscriberPosition(waitlistId, existingSubscriber.id)

    return { 
      success: true, 
      subscriber: existingSubscriber,
      position 
    }
  }

  // 3. Obtener referral code de cookie o query param
  const cookieStore = await cookies()
  const referralCode = cookieStore.get('waitlist_ref')?.value || null

  try {
    // 4. Generar código de referencia único
    let referralCodeNew = generateReferralCode()
    // Asegurar que sea único
    while (await prisma.subscriber.findUnique({ where: { referralCode: referralCodeNew } })) {
      referralCodeNew = generateReferralCode()
    }

    // 5. Crear Suscriptor (sin referredBy todavía, lo asignaremos después)
    const newSubscriber = await prisma.subscriber.create({
      data: {
        email: email.toLowerCase(),
        waitlistId,
        referralCode: referralCodeNew,
        score: 0, // Empieza con 0 puntos base
        referredById: null, // Se asignará en processReferral si hay referral code
      }
    })

    // 6. Procesar referral si existe código de referencia
    // Esto maneja: validación, prevención de self-referrals, asignación de puntos, etc.
    if (referralCode) {
      const referralResult = await processReferral({
        subscriberId: newSubscriber.id,
        referralCode,
        waitlistId,
        email: email.toLowerCase(),
      })

      // Si hay error en el referral, no fallamos el join, solo lo registramos
      if (!referralResult.success && referralResult.error) {
        console.warn('Referral processing failed:', referralResult.error)
      }
    }

    // 7. Evaluar puntos por signup (si hay reglas configuradas)
    // Por ejemplo, +5 puntos por unirse a la waitlist
    // Solo si hay una campaña activa
    const activeCampaign = await prisma.referralCampaign.findFirst({
      where: {
        waitlistId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    })

    if (activeCampaign) {
      await evaluatePointRules({
        waitlistId,
        campaignId: activeCampaign.id,
        subscriberId: newSubscriber.id,
        event: 'SIGNUP',
        metadata: {
          action: 'JOIN_WAITLIST',
        },
      }).catch((error) => {
        // No fallar el join si la evaluación de puntos falla
        console.warn('Point evaluation failed:', error)
      })
    }

    // 8. Calcular posición inicial
    const position = await getSubscriberPosition(waitlistId, newSubscriber.id)

    return { 
      success: true, 
      subscriber: newSubscriber,
      position 
    }

  } catch (error: any) {
    console.error("Join Error:", error)
    if (error.code === 'P2002') {
      // Duplicado detectado después de la verificación (race condition)
      const existing = await prisma.subscriber.findUnique({
        where: {
          waitlistId_email: { waitlistId, email: email.toLowerCase() }
        }
      })
      if (existing) {
        const position = await getSubscriberPosition(waitlistId, existing.id)
        return { 
          success: true, 
          subscriber: existing,
          position 
        }
      }
    }
    return { error: "Could not join waitlist. Please try again." }
  }
}

