'use client'

import { cn } from '@/lib/utils'
import { useTheme, getTheme, ThemeName } from '@/lib/themes'

interface CTAProps {
  themeName: ThemeName
}

export function CTA({ themeName }: CTAProps) {
  const theme = useTheme(themeName)
  const themeConfig = getTheme(themeName)

  return (
    <section className="mb-40 text-center">
      <div 
        className={cn(
          "p-16 border-4",
          theme.classes.card
        )}
        style={{
          backgroundColor: theme.colors.muted,
          borderColor: theme.colors.accent,
          borderRadius: themeConfig.layout.borderRadius.xl,
        }}
      >
        <h2 
          className={cn(
            "font-black uppercase italic mb-6",
            theme.classes.heading
          )}
          style={{
            fontSize: themeConfig.typography.fontSize['4xl'],
            color: theme.colors.primary,
          }}
        >
          Ready to Get Started?
        </h2>
        <p 
          className={cn(theme.classes.body)}
          style={{
            opacity: 0.7,
            fontSize: themeConfig.typography.fontSize.lg,
            marginBottom: '2rem',
          }}
        >
          Join thousands of others and be the first to experience what&apos;s coming.
        </p>
      </div>
    </section>
  )
}

