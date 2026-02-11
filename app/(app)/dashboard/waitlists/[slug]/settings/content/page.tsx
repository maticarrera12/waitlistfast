import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getContentSchema } from '@/lib/waitlist/content-resolver'
import { ContentEditor } from './_components/content-editor'
import { MobileAppEditor } from './_components/mobile-app-editor'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ContentSettingsPage({ params }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return redirect('/auth/login')

  const { slug } = await params

  let orgId = session.session?.activeOrganizationId
  if (!orgId) {
    const membership = await prisma.member.findFirst({
      where: { userId: session.user.id },
      select: { organizationId: true },
    })
    if (membership) orgId = membership.organizationId
  }

  if (!orgId) return notFound()

  const waitlist = await prisma.waitlist.findFirst({
    where: { slug, organizationId: orgId },
    select: {
      id: true,
      name: true,
      slug: true,
      templateKey: true,
      content: true,
      templateConfig: true,
    },
  })

  if (!waitlist) return notFound()

  const templateKey = waitlist.templateKey || 'saas-minimal'

  return (
    <div className="space-y-8 p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Content</h1>
        <p className="text-muted-foreground">
          Customize all text and cards for{' '}
          <span className="font-medium">{waitlist.name}</span>
          <span className="ml-2 text-xs border rounded px-2 py-0.5 font-mono">{templateKey}</span>
        </p>
      </div>

      {templateKey === 'mobile-app' ? (
        <MobileAppEditor
          waitlistId={waitlist.id}
          waitlistSlug={waitlist.slug}
          storedConfig={waitlist.templateConfig as Record<string, any> | null}
        />
      ) : (
        <ContentEditor
          waitlistId={waitlist.id}
          waitlistSlug={waitlist.slug}
          templateKey={templateKey}
          storedContent={waitlist.content as Record<string, any> | null}
          schema={getContentSchema(templateKey)}
        />
      )}
    </div>
  )
}
