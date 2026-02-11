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
    <section className="mb-24 text-center py-16">
      <h2 
        className={cn(
          "font-bold mb-4",
          theme.classes.heading
        )}
        style={{
          fontSize: themeConfig.typography.fontSize['2xl'],
        }}
      >
        Ready to join?
      </h2>
      <p 
        className={cn(theme.classes.body)}
        style={{
          opacity: 0.7,
          fontSize: themeConfig.typography.fontSize.base,
        }}
      >
        Enter your email above to get started.
      </p>
    </section>
  )
}

