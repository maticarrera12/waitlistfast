'use client'

import { cn } from '@/lib/utils'
import { useTheme, getTheme, ThemeName, isValidTheme } from '@/lib/themes'
import { ReferralCookieHandler } from '@/app/w/[slug]/_components/referral-cookie-handler'
import { Hero } from './Hero'
import { HowItWorks } from './HowItWorks'
import { CTA } from './CTA'
import type { RewardModel } from '@/src/generated/models/Reward'
import type { PointRuleModel } from '@/src/generated/models/PointRule'

interface StartupMinimalTemplateProps {
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

export function StartupMinimalTemplate({
  waitlist,
  subscriberCount,
  rewards,
  pointRules,
  subscriber,
}: StartupMinimalTemplateProps) {
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
      
      <main className="max-w-4xl mx-auto px-6 pt-12 pb-32">
        <Hero 
          waitlist={waitlist}
          subscriberCount={subscriberCount}
          themeName={themeName}
        />
        
        <HowItWorks themeName={themeName} />
        
        <CTA themeName={themeName} />
      </main>
    </div>
  )
}

