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
    <section className="flex flex-col items-center text-center mb-24 py-20">
      <h1 
        className={cn(
          "font-bold mb-6",
          theme.classes.heading
        )}
        style={{
          fontSize: 'clamp(2.5rem, 8vw, 5rem)',
          lineHeight: 1.2,
          color: theme.colors.primary,
        }}
      >
        {waitlist.headline || waitlist.name}
      </h1>
      
      {waitlist.description && (
        <p 
          className={cn(
            "max-w-2xl mb-8",
            theme.classes.body
          )}
          style={{
            fontSize: themeConfig.typography.fontSize.lg,
            opacity: 0.7,
          }}
        >
          {waitlist.description}
        </p>
      )}

      <div className="w-full max-w-md space-y-6">
        <JoinForm 
          waitlistId={waitlist.id}
          waitlistSlug={waitlist.slug}
          themeName={themeName}
          subscriberCount={subscriberCount}
        />
        
        <p 
          className={cn(
            "text-xs text-center",
            theme.classes.body
          )}
          style={{ 
            opacity: 0.5,
          }}
        >
          {subscriberCount.toLocaleString()} people have joined
        </p>
      </div>
    </section>
  )
}

