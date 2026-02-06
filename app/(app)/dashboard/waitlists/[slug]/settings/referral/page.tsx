import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getReferralCampaign } from '@/actions/referral-campaign'
import { getPointRules } from '@/actions/point-rules'
import { getRewards } from '@/actions/rewards'
import { getLeaderboard } from '@/lib/services/leaderboard'
import { CampaignStatusSection } from './_components/campaign-status-section'
import { CoreRulesSection } from './_components/core-rules-section'
import { PointRulesSection } from './_components/point-rules-section'
import { RewardsSection } from './_components/rewards-section'
import { LeaderboardPreview } from './_components/leaderboard-preview'
import { AdvancedSection } from './_components/advanced-section'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon } from '@hugeicons/core-free-icons'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ReferralCampaignSettingsPage({ params }: PageProps) {
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
  })

  if (!waitlist) return notFound()

  // Get campaign first
  const campaignResult = await getReferralCampaign(waitlist.id)
  const campaign = campaignResult.success ? campaignResult.campaign : null

  // Get rules and rewards only if campaign exists
  const [rulesResult, rewardsResult] = await Promise.all([
    campaign ? getPointRules(waitlist.id) : Promise.resolve({ success: true, rules: [] }),
    campaign ? getRewards(campaign.id) : Promise.resolve({ success: true, rewards: [] }),
  ])

  const rules = rulesResult.success ? rulesResult.rules : []
  const rewards = rewardsResult.success ? rewardsResult.rewards : []

  // Get leaderboard preview (top 10)
  const leaderboard = campaign?.status === 'ACTIVE'
    ? await getLeaderboard({
        waitlistId: waitlist.id,
        limit: 10,
        offset: 0,
      }).catch(() => [])
    : []

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Referral Campaign</h1>
        <p className="text-muted-foreground">
          Configure your referral system, scoring rules, and rewards for{' '}
          <span className="font-medium">{waitlist.name}</span>
        </p>
      </div>

      {/* Campaign Status Section */}
      <CampaignStatusSection
        waitlistId={waitlist.id}
        waitlistSlug={waitlist.slug}
        campaign={campaign}
      />

      {/* Warning if campaign is active */}
      {campaign?.status === 'ACTIVE' && (
        <Alert>
          <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4" />
          <AlertDescription>
            This campaign is currently active. Changes may affect live scoring and rewards.
          </AlertDescription>
        </Alert>
      )}

      {/* Core Rules Section */}
      {campaign && (
        <CoreRulesSection
          campaign={campaign}
          waitlistSlug={waitlist.slug}
        />
      )}

      {/* Point Rules Engine */}
      {campaign && (
        <PointRulesSection
          waitlistId={waitlist.id}
          waitlistSlug={waitlist.slug}
          rules={rules}
        />
      )}

      {/* Rewards Configuration */}
      {campaign && (
        <RewardsSection
          campaignId={campaign.id}
          waitlistSlug={waitlist.slug}
          rewards={rewards}
        />
      )}

      {/* Leaderboard Preview */}
      {campaign?.status === 'ACTIVE' && leaderboard.length > 0 && (
        <LeaderboardPreview leaderboard={leaderboard} />
      )}

      {/* Advanced Section */}
      {campaign && (
        <AdvancedSection
          campaign={campaign}
          waitlistId={waitlist.id}
          waitlistSlug={waitlist.slug}
        />
      )}

      {/* Empty State - No Campaign */}
      {!campaign && (
        <Card>
          <CardHeader>
            <CardTitle>No Campaign Created</CardTitle>
            <CardDescription>
              Create a referral campaign to start configuring your referral system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              A campaign will be created automatically when you activate your first settings.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

