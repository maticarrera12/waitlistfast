'use client'

import { cn } from '@/lib/utils'
import { useTheme, getTheme, ThemeName } from '@/lib/themes'

interface MobileAppSocialProofProps {
  themeName: ThemeName
  text?: string
}

export function MobileAppSocialProof({ themeName, text }: MobileAppSocialProofProps) {
  const theme = useTheme(themeName)
  const themeConfig = getTheme(themeName)

  if (!text) return null

  return (
    <section
      className="max-w-7xl mx-auto px-6 py-32"
      style={{ backgroundColor: `${theme.colors.foreground}05` }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <span
          className="text-6xl mb-8 block"
          style={{ color: theme.colors.primary }}
        >
          &ldquo;
        </span>

        <blockquote
          className={cn("font-bold italic mb-12", theme.classes.body)}
          style={{
            fontSize: 'clamp(1.25rem, 3vw, 2.5rem)',
            lineHeight: 1.1,
            color: theme.colors.foreground,
          }}
        >
          &ldquo;{text}&rdquo;
        </blockquote>
      </div>
    </section>
  )
}
