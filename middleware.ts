import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSubdomain, isReservedSubdomain, shouldSkipSubdomainRouting } from './lib/middleware/subdomain'

/**
 * Subdomain-based routing middleware
 * 
 * Detects subdomain from request host and rewrites to /w/[slug]
 * Compatible with Vercel Edge Middleware
 * 
 * Behavior:
 * - acme.waitlistfast.com → /w/acme (if waitlist exists)
 * - www.waitlistfast.com → no rewrite (reserved)
 * - app.waitlistfast.com → no rewrite (reserved)
 * - waitlistfast.com → no rewrite (main app)
 * - localhost:3000 → no rewrite (dev)
 * - acme.localhost:3000 → /w/acme (if waitlist exists, dev)
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const host = request.headers.get('host') || ''

  // Skip subdomain routing for API routes, static assets, and app routes
  if (shouldSkipSubdomainRouting(pathname)) {
    // Still handle ref code cookie for /w routes
    if (pathname.startsWith('/w/')) {
      return handleRefCode(request)
    }
    return NextResponse.next()
  }

  // Extract subdomain from host
  const subdomain = getSubdomain(host)

  // No subdomain or reserved subdomain → continue normally
  if (!subdomain || isReservedSubdomain(subdomain)) {
    return handleRefCode(request)
  }

  // Verify waitlist exists by slug
  // Edge Runtime cannot use Prisma directly, so we use an internal API route
  // Use localhost for internal fetch (not the subdomain)
  const protocol = request.nextUrl.protocol
  const port = request.nextUrl.port ? `:${request.nextUrl.port}` : ''
  const internalHost = `localhost${port}`
  const verifyUrl = new URL(`/api/middleware/verify-slug`, `${protocol}//${internalHost}`)
  verifyUrl.searchParams.set('slug', subdomain)

  try {
    const verifyResponse = await fetch(verifyUrl.toString(), {
      headers: {
        // Forward necessary headers for internal request
        'x-forwarded-host': host,
        'host': internalHost,
      },
      // Cache verification for 1 minute to reduce DB queries
      next: { revalidate: 60 },
    })

    if (!verifyResponse.ok) {
      // If verification fails, continue normally (don't rewrite)
      return handleRefCode(request)
    }

    const { exists } = await verifyResponse.json()

    if (!exists) {
      // Waitlist doesn't exist, continue normally
      return handleRefCode(request)
    }

    // Waitlist exists → rewrite to /w/[slug]
    // Ensure pathname starts with /w/[slug] and handle root path correctly
    const targetPath = pathname === '/' ? `/w/${subdomain}` : `/w/${subdomain}${pathname}`
    const rewriteUrl = new URL(targetPath, request.url)
    rewriteUrl.search = request.nextUrl.search // Preserve query params

    const response = NextResponse.rewrite(rewriteUrl)
    
    // Handle ref code cookie
    return handleRefCode(request, response)
  } catch (error) {
    console.error('[MIDDLEWARE] Error verifying subdomain:', error)
    // On error, continue normally
    return handleRefCode(request)
  }
}

/**
 * Handles referral code cookie from ?ref= parameter
 * Preserves existing middleware behavior
 */
function handleRefCode(request: NextRequest, response?: NextResponse): NextResponse {
  const searchParams = request.nextUrl.searchParams
  const refCode = searchParams.get('ref')

  const finalResponse = response || NextResponse.next()

  if (refCode) {
    // Store referral code in cookie (30 days)
    finalResponse.cookies.set('waitlist_ref', refCode, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: 'lax',
    })
  }

  return finalResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
