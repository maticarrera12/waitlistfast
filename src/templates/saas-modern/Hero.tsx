'use client'

import { cn } from '@/lib/utils'
import { useTheme, getTheme, ThemeName } from '@/lib/themes'
import { JoinForm } from '@/components/waitlist/join-form'

interface HeroProps {
  waitlist: {
    id: string
    name: string
    slug: string
    headline: string | null
    description: string | null
  }
  subscriberCount: number
  themeName: ThemeName
}

export function Hero({ waitlist, subscriberCount, themeName }: HeroProps) {
  const theme = useTheme(themeName)
  const themeConfig = getTheme(themeName)

  return (
    <section className="flex flex-col items-center text-center mb-32">
      <h1 
        className={cn(
          "font-black uppercase italic mb-8",
          theme.classes.heading
        )}
        style={{
          fontSize: 'clamp(4rem, 13vw, 12rem)',
          lineHeight: 0.85,
          letterSpacing: '-0.05em',
          color: theme.colors.primary,
        }}
      >
        {waitlist.headline || waitlist.name}
      </h1>
      
      <div className="w-full max-w-2xl space-y-8">
        <div 
          className={cn(
            "font-black tracking-tighter uppercase mb-4",
            theme.classes.heading
          )}
          style={{
            fontSize: 'clamp(2rem, 6vw, 4rem)',
            color: theme.colors.accent,
          }}
        >
          JOIN {subscriberCount.toLocaleString()} OTHERS
        </div>

        <JoinForm 
          waitlistId={waitlist.id}
          waitlistSlug={waitlist.slug}
          themeName={themeName}
          subscriberCount={subscriberCount}
        />

        <p 
          className={cn(
            "text-sm text-center mt-4",
            theme.classes.body
          )}
          style={{ 
            opacity: 0.5,
            fontSize: themeConfig.typography.fontSize.sm,
          }}
        >
          If you&apos;re already on the waitlist, enter your email to see your progress.
        </p>

        {waitlist.description && (
          <p 
            className={cn(
              "font-medium",
              theme.classes.body
            )}
            style={{ 
              opacity: 0.4,
              fontSize: themeConfig.typography.fontSize.base,
            }}
          >
            {waitlist.description}
          </p>
        )}
      </div>
    </section>
  )
}

