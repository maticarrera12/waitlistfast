/**
 * Internal API route to verify if a slug exists
 * Used by Edge Middleware (which cannot use Prisma directly)
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs' // Not edge, so we can use Prisma

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ exists: false }, { status: 400 })
  }

  try {
    const waitlist = await prisma.waitlist.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    })

    return NextResponse.json({ exists: !!waitlist })
  } catch (error) {
    console.error('[MIDDLEWARE] Error verifying slug:', error)
    return NextResponse.json({ exists: false }, { status: 500 })
  }
}

