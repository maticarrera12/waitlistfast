'use client'

import { cn } from '@/lib/utils'
import { useTheme, getTheme, ThemeName } from '@/lib/themes'
import { JoinForm } from '@/components/waitlist/join-form'

interface HeroContent {
  headline: string
  subheadline: string
  helperText: string
}

interface HeroSectionProps {
  waitlist: {
    id: string
    name: string
    slug?: string
    headline: string | null
    description: string | null
    settings: any
  }
  subscriberCount: number
  themeName: ThemeName
  content: HeroContent
}

export function HeroSection({ waitlist, subscriberCount, themeName, content }: HeroSectionProps) {
  const theme = useTheme(themeName)
  const themeConfig = getTheme(themeName)

  const headline = content.headline || waitlist.headline || waitlist.name
  const subheadline = content.subheadline || waitlist.description || ''

  return (
    <section className="flex flex-col items-center text-center mb-24">
      <h1
        className={cn(
          "font-black uppercase italic mb-6",
          theme.classes.heading
        )}
        style={{
          fontSize: 'clamp(3rem, 10vw, 8rem)',
          lineHeight: 0.9,
          letterSpacing: '-0.03em',
          color: theme.colors.primary,
        }}
      >
        {headline}
      </h1>

      {subheadline && (
        <p
          className={cn(
            "text-lg mb-8 max-w-2xl",
            theme.classes.body
          )}
          style={{
            opacity: 0.7,
            fontSize: themeConfig.typography.fontSize.lg,
            color: theme.colors.foreground,
          }}
        >
          {subheadline}
        </p>
      )}

      <div className="w-full max-w-md space-y-6">
        <div
          className={cn(
            "font-bold tracking-tighter uppercase mb-4",
            theme.classes.heading
          )}
          style={{
            fontSize: themeConfig.typography.fontSize['2xl'],
            color: theme.colors.accent,
          }}
        >
          JOIN {subscriberCount.toLocaleString()} OTHERS
        </div>

        {waitlist.slug && (
          <JoinForm
            waitlistId={waitlist.id}
            waitlistSlug={waitlist.slug}
            themeName={themeName}
            subscriberCount={subscriberCount}
          />
        )}

        {content.helperText && (
          <p
            className={cn(
              "text-sm text-center mt-4",
              theme.classes.body
            )}
            style={{
              opacity: 0.5,
              fontSize: themeConfig.typography.fontSize.sm,
              color: theme.colors.foreground,
            }}
          >
            {content.helperText}
          </p>
        )}
      </div>
    </section>
  )
}
