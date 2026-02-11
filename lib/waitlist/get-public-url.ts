export function getPublicWaitlistUrl(slug: string): string {
  const isDev = process.env.NODE_ENV !== 'production'
  const rootDomain = isDev ? 'localhost' : (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'waitlistfast.com')
  const protocol = isDev ? 'http' : 'https'
  const port = isDev ? ':3000' : ''
  return `${protocol}://${slug}.${rootDomain}${port}`
}

