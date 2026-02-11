'use client'

import { cn } from '@/lib/utils'
import { useTheme, getTheme, ThemeName } from '@/lib/themes'
import { JoinForm } from '@/components/waitlist/join-form'

interface MobileAppFinalCTAProps {
  waitlist: {
    id: string
    name: string
    slug: string
    headline: string | null
    description: string | null
  }
  subscriberCount: number
  themeName: ThemeName
  ctaText?: string
}

export function MobileAppFinalCTA({ waitlist, subscriberCount, themeName, ctaText }: MobileAppFinalCTAProps) {
  const theme = useTheme(themeName)
  const themeConfig = getTheme(themeName)

  return (
    <section className="py-32 px-6" style={{ backgroundColor: theme.colors.background }}>
      <div
        className="max-w-4xl mx-auto p-12 md:p-24 text-center relative overflow-hidden border-4"
        style={{
          backgroundColor: theme.colors.muted,
          borderColor: `${theme.colors.foreground}0d`,
        }}
      >
        {/* Decorative blur */}
        <div
          className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-[100px]"
          style={{ backgroundColor: `${theme.colors.accent}1a` }}
        />

        <div className="relative z-10">
          <h2
            className={cn("text-5xl md:text-7xl font-black uppercase italic mb-8 leading-none", theme.classes.heading)}
            style={{ color: theme.colors.foreground }}
          >
            Don&apos;t Get<br />
            <span style={{ color: theme.colors.primary }}>Left Behind.</span>
          </h2>

          <p
            className={cn("text-xl mb-12 font-bold max-w-xl mx-auto", theme.classes.body)}
            style={{ color: `${theme.colors.foreground}99` }}
          >
            Limited alpha spots available. Early adopters get priority access and exclusive rewards.
          </p>

          <div className="w-full max-w-xl mx-auto">
            <JoinForm
              waitlistId={waitlist.id}
              waitlistSlug={waitlist.slug}
              themeName={themeName}
              subscriberCount={subscriberCount}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

