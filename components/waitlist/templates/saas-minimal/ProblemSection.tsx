'use client'

import { cn } from '@/lib/utils'
import { useTheme, getTheme, ThemeName } from '@/lib/themes'

interface ProblemContent {
  badge: string
  title: string
  description: string
}

interface ProblemSectionProps {
  themeName: ThemeName
  content: ProblemContent
}

export function ProblemSection({ themeName, content }: ProblemSectionProps) {
  const theme = useTheme(themeName)
  const themeConfig = getTheme(themeName)

  return (
    <section className="mb-24">
      <div
        className={cn(
          "p-10 md:p-16 border-2",
          theme.classes.card
        )}
        style={{
          backgroundColor: theme.colors.muted,
          borderColor: `${theme.colors.border}40`,
          borderRadius: themeConfig.layout.borderRadius.xl,
        }}
      >
        <span
          className="inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-6"
          style={{
            backgroundColor: `${theme.colors.accent}15`,
            color: theme.colors.accent,
            border: `1px solid ${theme.colors.accent}30`,
          }}
        >
          {content.badge}
        </span>
        <h2
          className={cn(
            "font-black uppercase tracking-tighter italic mb-6",
            theme.classes.heading
          )}
          style={{
            fontSize: themeConfig.typography.fontSize['4xl'],
            color: theme.colors.foreground,
          }}
        >
          {content.title}
        </h2>
        <p
          className={cn(
            "text-lg leading-relaxed max-w-3xl",
            theme.classes.body
          )}
          style={{
            opacity: 0.7,
            fontSize: themeConfig.typography.fontSize.lg,
            color: theme.colors.foreground,
          }}
        >
          {content.description}
        </p>
      </div>
    </section>
  )
}
