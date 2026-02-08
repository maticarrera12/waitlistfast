'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { headers } from 'next/headers'
import { processReferral } from '@/lib/services/referral-flow'
import { evaluatePointRules } from '@/lib/services/scoring'
import { getSubscriberPosition } from '@/lib/services/leaderboard'

const joinSchema = z.object({
  email: z.string().email(),
  waitlistId: z.string(),
  referralCode: z.string().optional(),
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
  const referralCodeFromForm = formData.get('referralCode') as string | null

  // 1. Validar inputs (solo email y waitlistId, referralCode es opcional)
  const validation = joinSchema.safeParse({ 
    email, 
    waitlistId,
    ...(referralCodeFromForm ? { referralCode: referralCodeFromForm } : {})
  })
  if (!validation.success) {
    console.error('[JOIN_WAITLIST] Validation error:', validation.error.errors)
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

    // Guardar cookie con el email del subscriber para mostrar progreso en rewards
    const cookieStore = await cookies()
    cookieStore.set(`waitlist_subscriber_${waitlistId}`, email.toLowerCase(), {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      sameSite: 'lax',
    })

    return { 
      success: true, 
      subscriber: existingSubscriber,
      position 
    }
  }

  // 3. Obtener referral code (prioridad: form > cookie > referer)
  const cookieStore = await cookies()
  const headersList = await headers()
  const referralCodeFromCookie = cookieStore.get('waitlist_ref')?.value || null
  
  // Prioridad: 1. Form (directo), 2. Cookie, 3. Referer header
  let referralCode = referralCodeFromForm || referralCodeFromCookie || null

  if (!referralCode) {
    const referer = headersList.get('referer')
    if (referer) {
      try {
        const url = new URL(referer)
        const refParam = url.searchParams.get('ref')
        if (refParam) {
          referralCode = refParam
          console.log('[JOIN_WAITLIST] Found referral code from referer:', refParam)
        }
      } catch (e) {
        // Ignore URL parsing errors
      }
    }
  }
  
  if (referralCodeFromForm) {
    console.log('[JOIN_WAITLIST] Found referral code from form:', referralCodeFromForm)
  } else if (referralCodeFromCookie) {
    console.log('[JOIN_WAITLIST] Found referral code from cookie:', referralCodeFromCookie)
  } else {
    console.log('[JOIN_WAITLIST] No referral code found')
  }

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
      console.log('[JOIN_WAITLIST] Processing referral with code:', referralCode)
      const referralResult = await processReferral({
        subscriberId: newSubscriber.id,
        referralCode,
        waitlistId,
        email: email.toLowerCase(),
      })

      // Si hay error en el referral, no fallamos el join, solo lo registramos
      if (!referralResult.success && referralResult.error) {
        console.warn('[JOIN_WAITLIST] Referral processing failed:', referralResult.error)
      } else if (referralResult.success) {
        console.log('[JOIN_WAITLIST] Referral processed successfully. Points awarded:', referralResult.pointsAwarded)
      }
    } else {
      console.log('[JOIN_WAITLIST] No referral code found in cookies')
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

    // 9. Guardar cookie con el email del subscriber para mostrar progreso en rewards
    const cookieStore = await cookies()
    const cookieName = `waitlist_subscriber_${waitlistId}`
    cookieStore.set(cookieName, email.toLowerCase(), {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      sameSite: 'lax',
    })

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
        
        // Guardar cookie con el email del subscriber para mostrar progreso en rewards
        const cookieStore = await cookies()
        cookieStore.set(`waitlist_subscriber_${waitlistId}`, email.toLowerCase(), {
          maxAge: 60 * 60 * 24 * 365, // 1 year
          path: '/',
          sameSite: 'lax',
        })
        
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

