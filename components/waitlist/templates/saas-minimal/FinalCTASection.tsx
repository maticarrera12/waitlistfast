'use client'

import { cn } from '@/lib/utils'
import { useTheme, getTheme, ThemeName } from '@/lib/themes'
import { JoinForm } from '@/components/waitlist/join-form'

interface FinalCTAContent {
  headline: string
  description: string
}

interface FinalCTASectionProps {
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
  content: FinalCTAContent
}

export function FinalCTASection({ waitlist, subscriberCount, themeName, content }: FinalCTASectionProps) {
  const theme = useTheme(themeName)
  const themeConfig = getTheme(themeName)

  return (
    <section
      className="text-center py-16 px-8 mb-24"
      style={{
        backgroundColor: theme.colors.muted,
        borderColor: `${theme.colors.border}40`,
        borderWidth: '2px',
        borderRadius: themeConfig.layout.borderRadius.xl,
      }}
    >
      <h2
        className={cn(
          "font-black uppercase italic mb-4",
          theme.classes.heading
        )}
        style={{
          fontSize: themeConfig.typography.fontSize['4xl'],
          color: theme.colors.primary,
        }}
      >
        {content.headline}
      </h2>
      <p
        className={cn(
          "text-lg mb-10 max-w-2xl mx-auto",
          theme.classes.body
        )}
        style={{
          opacity: 0.7,
          color: theme.colors.foreground,
        }}
      >
        {content.description}
      </p>

      {waitlist.slug && (
        <div className="max-w-md mx-auto">
          <JoinForm
            waitlistId={waitlist.id}
            waitlistSlug={waitlist.slug}
            themeName={themeName}
            subscriberCount={subscriberCount}
          />
        </div>
      )}
    </section>
  )
}
