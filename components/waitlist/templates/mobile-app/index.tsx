'use client'

import { cn } from '@/lib/utils'
import { useTheme, ThemeName, isValidTheme } from '@/lib/themes'
import { ReferralCookieHandler } from '@/app/w/[slug]/_components/referral-cookie-handler'
import { resolveMobileAppConfig } from '@/lib/waitlist/templates/mobile-app.config'
import { Rewards } from '@/src/templates/shared/Rewards'
import { PointRules } from '@/src/templates/shared/PointRules'
import { MobileAppHero } from './MobileAppHero'
import { MobileAppValueProps } from './MobileAppValueProps'
import { MobileAppFeaturePreview } from './MobileAppFeaturePreview'
import { MobileAppSocialProof } from './MobileAppSocialProof'
import { MobileAppFinalCTA } from './MobileAppFinalCTA'
import { MobileAppPlatformAvailability } from './MobileAppPlatformAvailability'
import type { RewardModel } from '@/src/generated/models/Reward'
import type { PointRuleModel } from '@/src/generated/models/PointRule'

interface MobileAppTemplateProps {
  waitlist: {
    id: string
    name: string
    slug: string
    headline: string | null
    description: string | null
    settings: any
    content?: any
    templateConfig?: any
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

export function MobileAppTemplate({
  waitlist,
  subscriberCount,
  rewards,
  pointRules,
  subscriber,
}: MobileAppTemplateProps) {
  const settings = waitlist.settings as { theme?: string } | null
  const themeName = normalizeTheme(settings?.theme)
  const theme = useTheme(themeName)

  const config = resolveMobileAppConfig(waitlist.templateConfig)

  return (
    <div
      className={cn(
        "min-h-screen relative overflow-x-hidden",
        theme.classes.container
      )}
      style={theme.styles}
    >
      <ReferralCookieHandler />

      {/* 1. Hero — full-screen bg image, massive headline, join form, platform badges */}
      <MobileAppHero
        waitlist={waitlist}
        subscriberCount={subscriberCount}
        themeName={themeName}
        config={config.hero}
        platforms={config.platforms}
      />

      {/* 2. Value Props — feature grid with colored left borders */}
      <MobileAppValueProps
        themeName={themeName}
        items={config.valueProps.items}
      />

      {/* 3. Feature Preview — alternating phone mockup + text */}
      <MobileAppFeaturePreview
        themeName={themeName}
        items={config.featurePreview.items}
      />

      {/* 4. Social Proof — editorial quote */}
      <MobileAppSocialProof
        themeName={themeName}
        text={config.socialProof?.text}
      />

      {/* 5. Rewards & Goals — existing component, untouched */}
      {rewards.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-16">
          <Rewards
            rewards={rewards}
            subscriber={subscriber || null}
            themeName={themeName}
          />
        </div>
      )}

      {/* 6. Point Rules — existing component, untouched */}
      {pointRules.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-16">
          <PointRules
            pointRules={pointRules}
            themeName={themeName}
          />
        </div>
      )}

      {/* 7. Final CTA — big CTA section */}
      <MobileAppFinalCTA
        waitlist={waitlist}
        subscriberCount={subscriberCount}
        themeName={themeName}
        ctaText={config.hero.ctaText}
      />

      {/* 8. Platform footer */}
      <MobileAppPlatformAvailability
        themeName={themeName}
        platforms={config.platforms}
        waitlistName={waitlist.name}
      />
    </div>
  )
}
