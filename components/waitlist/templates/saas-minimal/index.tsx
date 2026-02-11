'use client'

import { cn } from '@/lib/utils'
import { useTheme, ThemeName, isValidTheme } from '@/lib/themes'
import { ReferralCookieHandler } from '@/app/w/[slug]/_components/referral-cookie-handler'
import { resolveTemplate } from '@/lib/waitlist/template-resolver'
import { resolveContent } from '@/lib/waitlist/content-resolver'
import { sectionRegistry, type SectionProps } from '@/lib/waitlist/section-registry'
import type { RewardModel } from '@/src/generated/models/Reward'
import type { PointRuleModel } from '@/src/generated/models/PointRule'

interface SaaSMinimalTemplateProps {
  waitlist: {
    id: string
    name: string
    slug: string
    headline: string | null
    description: string | null
    settings: any
    content?: any
  }
  subscriberCount: number
  rewards: RewardModel[]
  pointRules: PointRuleModel[]
  subscriber?: {
    id: string
    email: string
    score: number
    position: number | null
    referralCount: number
  } | null
}

const themeMapping: Record<string, ThemeName> = {
  'neon': 'webflow',
  'minimal': 'linear',
  'luxury': 'apple',
}

function normalizeTheme(theme: string | undefined): ThemeName {
  if (!theme) return 'default'
  if (isValidTheme(theme)) return theme
  if (theme in themeMapping) return themeMapping[theme]
  return 'default'
}

export function SaaSMinimalTemplate({
  waitlist,
  subscriberCount,
  rewards,
  pointRules,
  subscriber,
}: SaaSMinimalTemplateProps) {
  const settings = waitlist.settings as { theme?: string } | null
  const themeName = normalizeTheme(settings?.theme)
  const theme = useTheme(themeName)

  const template = resolveTemplate('saas-minimal')
  const content = resolveContent('saas-minimal', waitlist.content)

  const sharedProps: SectionProps = {
    waitlist,
    subscriberCount,
    subscriber: subscriber || undefined,
    themeName,
    rewards,
    pointRules,
    content,
  }

  return (
    <div
      className={cn(
        "min-h-screen relative overflow-x-hidden",
        theme.classes.container
      )}
      style={theme.styles}
    >
      <ReferralCookieHandler />

      <div className="fixed inset-0 pointer-events-none -z-10">
        <div
          className="absolute top-0 right-0 w-1/2 h-1/2 rounded-full blur-[120px] opacity-5"
          style={{ backgroundColor: theme.colors.primary }}
        />
        <div
          className="absolute bottom-0 left-0 w-1/2 h-1/2 rounded-full blur-[120px] opacity-5"
          style={{ backgroundColor: theme.colors.accent }}
        />
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-12 pb-32">
        {template.sections.map((sectionKey) => {
          const Section = sectionRegistry[sectionKey as keyof typeof sectionRegistry]
          if (!Section) return null
          return <Section key={sectionKey} {...sharedProps} />
        })}
      </main>
    </div>
  )
}
