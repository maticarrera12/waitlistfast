'use client'

import { cn } from '@/lib/utils'
import { useTheme, getTheme, ThemeName, isValidTheme } from '@/lib/themes'
import { ReferralCookieHandler } from '@/app/w/[slug]/_components/referral-cookie-handler'
import { Hero } from './Hero'
import { Features } from './Features'
import { Rewards } from '../shared/Rewards'
import { PointRules } from '../shared/PointRules'
import { CTA } from './CTA'
import type { RewardModel } from '@/src/generated/models/Reward'
import type { PointRuleModel } from '@/src/generated/models/PointRule'

interface SaaSModernTemplateProps {
  waitlist: {
    id: string
    name: string
    slug: string
    headline: string | null
    description: string | null
    settings: any
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

export function SaaSModernTemplate({
  waitlist,
  subscriberCount,
  rewards,
  pointRules,
  subscriber,
}: SaaSModernTemplateProps) {
  const settings = waitlist.settings as { theme?: string } | null
  const themeName = normalizeTheme(settings?.theme)
  const theme = useTheme(themeName)
  const themeConfig = getTheme(themeName)

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
        <Hero 
          waitlist={waitlist}
          subscriberCount={subscriberCount}
          themeName={themeName}
        />
        
        <Features themeName={themeName} />
        
        <Rewards 
          rewards={rewards}
          subscriber={subscriber}
          themeName={themeName}
        />
        
        <PointRules 
          pointRules={pointRules}
          themeName={themeName}
        />
        
        <CTA themeName={themeName} />
      </main>
    </div>
  )
}

