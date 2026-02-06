'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getTheme } from '@/lib/themes'

// El mismo Schema del frontend para validación doble seguridad
const createWaitlistSchema = z.object({
  type: z.string().min(1),
  name: z.string().min(2),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Lowercase, numbers and dashes only"),
  description: z.string().optional(),
  theme: z.enum(['linear', 'stripe', 'notion', 'apple', 'brutalist', 'webflow']).default('linear'),
})

export type CreateWaitlistState = {
  error?: string
  success?: boolean
}

export async function createWaitlist(data: z.infer<typeof createWaitlistSchema>) {
  console.log("createWaitlist called with data:", data)
  
  // 1. Verificar Sesión
  const session = await auth.api.getSession({
    headers: await headers()
  })

  console.log("Session:", session ? "exists" : "null", session?.user?.id)

  if (!session?.user) {
    console.error("No session or user found")
    return { error: "Unauthorized" }
  }

  // 2. Resolver Organization ID
  // La organización personal se crea automáticamente al registrarse (ver lib/auth.ts)
  // Primero intentamos obtenerla de la sesión
  let orgId = (session as any).activeOrganizationId || session.session?.activeOrganizationId

  console.log("Initial orgId from session:", orgId)

  if (!orgId) {
    // Fallback: buscar la primera organización donde es miembro
    // Esto debería existir siempre ya que se crea al registrarse, pero por seguridad lo verificamos
    const membership = await prisma.member.findFirst({
        where: { userId: session.user.id },
        select: { organizationId: true },
        orderBy: { createdAt: 'desc' }
    })
    
    console.log("Membership found:", membership)
    
    if (membership) {
        orgId = membership.organizationId
        
        // Actualizar la sesión con el orgId encontrado
        try {
          await prisma.session.updateMany({
            where: { 
              userId: session.user.id,
              expiresAt: { gt: new Date() }
            },
            data: {
              activeOrganizationId: orgId
            }
          })
        } catch (sessionError) {
          console.warn("Could not update sessions:", sessionError)
        }
    } else {
        // Edge case: Usuario sin organización (no debería pasar, pero por seguridad)
        console.error("No organization found for user - this should not happen")
        return { error: "No organization found. Please contact support." }
    }
  }

  console.log("Final orgId:", orgId)

  // Validar que orgId existe
  if (!orgId) {
    console.error("No organization ID found")
    return { error: "No organization found. Please contact support." }
  }

  // 3. Validar Datos
  const validatedFields = createWaitlistSchema.safeParse(data)
  
  if (!validatedFields.success) {
    console.error("Validation failed:", validatedFields.error)
    return { error: `Invalid fields: ${validatedFields.error.errors.map(e => e.message).join(", ")}` }
  }

  const { name, slug, description, theme, type } = validatedFields.data

  console.log("Creating waitlist with:", { name, slug, description, theme, type, orgId })

  try {
    // 4. Crear en Base de Datos
    // Verificar que el modelo waitlist está disponible
    if (typeof prisma.waitlist === 'undefined' || !prisma.waitlist) {
      const availableModels = Object.getOwnPropertyNames(prisma).filter(
        key => !key.startsWith('_') && !key.startsWith('$') && typeof prisma[key as keyof typeof prisma] === 'object'
      )
      console.error("prisma.waitlist is undefined")
      console.error("Available properties on prisma:", availableModels)
      console.error("prisma type:", typeof prisma)
      console.error("prisma constructor:", prisma.constructor?.name)
      return { 
        error: `Database model 'waitlist' not found. This usually means the Prisma client needs to be regenerated. Please run: npx prisma generate. Available models: ${availableModels.slice(0, 10).join(', ')}` 
      }
    }

    const created = await prisma.waitlist.create({
      data: {
        name,
        slug,
        description: description || null,
        organizationId: orgId,
        // Guardamos 'theme' y 'type' dentro del JSON settings
        settings: {
          theme,
          projectType: type,
          // Get brand color from theme config
          brandColor: (() => {
            try {
              const themeConfig = getTheme(theme as any)
              return themeConfig.colors.primary
            } catch {
              return '#5e6ad2' // Default Linear color
            }
          })(),
        }
      }
    })

    console.log("Waitlist created successfully:", created.id)

  } catch (error: any) {
    // 5. Manejo de Errores (Ej: Slug duplicado)
    console.error("Error creating waitlist:", error)
    console.error("Error type:", typeof error)
    console.error("Error name:", error?.name)
    console.error("Error message:", error?.message)
    console.error("Error code:", error?.code)
    console.error("Error stack:", error?.stack)
    
    if (error?.code === 'P2002') {
      return { error: "This URL slug is already taken. Please try another one." }
    }
    if (error?.message) {
      return { error: error.message }
    }
    return { error: "Something went wrong. Please try again." }
  }

  // 6. Revalidar y Redirigir
  revalidatePath('/dashboard')
  redirect(`/dashboard/waitlists/${slug}`)
}