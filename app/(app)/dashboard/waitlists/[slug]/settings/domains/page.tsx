import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SubdomainCard } from './_components/subdomain-card'
import { CustomDomainCard } from './_components/custom-domain-card'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function DomainSettingsPage({ params }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return redirect('/auth/login')

  const { slug } = await params

  // Get user's organization
  let orgId = session.session?.activeOrganizationId
  if (!orgId) {
    const membership = await prisma.member.findFirst({
      where: { userId: session.user.id },
      select: { organizationId: true },
    })
    if (membership) orgId = membership.organizationId
  }

  if (!orgId) return notFound()

  // Get waitlist
  const waitlist = await prisma.waitlist.findFirst({
    where: { slug, organizationId: orgId },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  })

  if (!waitlist) return notFound()

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'waitlistfast.com'
  const subdomain = `${waitlist.slug}.${rootDomain}`

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Domain Settings</h1>
        <p className="text-muted-foreground">
          Manage your waitlist domain configuration for{' '}
          <span className="font-medium">{waitlist.name}</span>
        </p>
      </div>

      {/* Subdomain Card */}
      <SubdomainCard subdomain={subdomain} />

      {/* Custom Domain Card */}
      <CustomDomainCard />
    </div>
  )
}

