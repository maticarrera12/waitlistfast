/**
 * Subdomain extraction and validation utilities
 * Compatible with Vercel Edge Middleware
 */

const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'admin', 'api'])

/**
 * Extracts subdomain from request host
 * Works with both production (waitlistfast.com) and local dev (localhost:3000)
 */
export function getSubdomain(host: string): string | null {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'waitlistfast.com'
  
  // Remove port if present (e.g., localhost:3000)
  const hostWithoutPort = host.split(':')[0]
  
  // Handle localhost development - check for subdomain.localhost format FIRST
  if (hostWithoutPort.endsWith('.localhost')) {
    // In local dev, subdomain format is: subdomain.localhost
    const parts = hostWithoutPort.split('.')
    if (parts.length > 1 && parts[parts.length - 1] === 'localhost') {
      return parts[0] || null
    }
    return null
  }
  
  // If it's exactly localhost or 127.0.0.1, no subdomain
  if (hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1') {
    return null
  }
  
  // Handle production domain
  if (hostWithoutPort.endsWith(`.${rootDomain}`)) {
    const subdomain = hostWithoutPort.replace(`.${rootDomain}`, '')
    return subdomain || null
  }
  
  // If host exactly matches root domain, no subdomain
  if (hostWithoutPort === rootDomain) {
    return null
  }
  
  return null
}

/**
 * Checks if subdomain is reserved and should not resolve to a waitlist
 */
export function isReservedSubdomain(subdomain: string | null): boolean {
  if (!subdomain) return false
  return RESERVED_SUBDOMAINS.has(subdomain.toLowerCase())
}

/**
 * Checks if path should skip subdomain middleware
 */
export function shouldSkipSubdomainRouting(pathname: string): boolean {
  const skipPaths = [
    '/api',
    '/_next',
    '/favicon.ico',
    '/dashboard',
    '/signin',
    '/signup',
    '/reset-password',
  ]
  
  return skipPaths.some(path => pathname.startsWith(path))
}

