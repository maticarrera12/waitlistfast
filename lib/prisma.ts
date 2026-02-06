// lib/prisma.ts
import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const client = new PrismaClient({ adapter })
  
  // Verificar que el modelo waitlist está disponible después de la inicialización
  // A veces el modelo no está disponible inmediatamente, así que verificamos después de un pequeño delay
  if (typeof (client as any).waitlist === 'undefined') {
    console.error("WARNING: prisma.waitlist is not available after client creation")
    console.error("Available models:", Object.keys(client).filter(key => !key.startsWith('_') && !key.startsWith('$')))
    console.error("This usually means the Prisma client needs to be regenerated with: npx prisma generate")
  }
  
  return client
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma