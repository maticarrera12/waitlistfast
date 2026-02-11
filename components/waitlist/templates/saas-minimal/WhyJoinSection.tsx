'use client'

import { cn } from '@/lib/utils'
import { useTheme, getTheme, ThemeName } from '@/lib/themes'

interface WhyJoinItem {
  emoji?: string
  title: string
  description: string
}

interface WhyJoinContent {
  sectionTitle: string
  sectionSubtitle: string
  items: WhyJoinItem[]
}

interface WhyJoinSectionProps {
  themeName: ThemeName
  content: WhyJoinContent
}

export function WhyJoinSection({ themeName, content }: WhyJoinSectionProps) {
  const theme = useTheme(themeName)
  const themeConfig = getTheme(themeName)

  if (!content.items || content.items.length === 0) return null

  return (
    <section className="mb-24">
      <div className="mb-12">
        <h2
          className={cn(
            "font-black uppercase tracking-tighter italic mb-2",
            theme.classes.heading
          )}
          style={{
            fontSize: themeConfig.typography.fontSize['5xl'],
            color: theme.colors.foreground,
          }}
        >
          {content.sectionTitle}
        </h2>
        <p
          className={cn(
            "uppercase tracking-widest",
            theme.classes.body
          )}
          style={{
            opacity: 0.6,
            fontSize: themeConfig.typography.fontSize.sm,
            color: theme.colors.foreground,
          }}
        >
          {content.sectionSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {content.items.map((item, index) => (
          <div
            key={index}
            className={cn(
              "p-6 border-2 transition-all duration-300",
              theme.classes.card
            )}
            style={{
              backgroundColor: theme.colors.muted,
              borderColor: `${theme.colors.border}40`,
              borderRadius: themeConfig.layout.borderRadius.xl,
            }}
          >
            {item.emoji && <span className="text-3xl mb-4 block">{item.emoji}</span>}
            <h3
              className={cn(
                "font-bold text-xl mb-2",
                theme.classes.heading
              )}
              style={{ color: theme.colors.foreground }}
            >
              {item.title}
            </h3>
            <p
              className={cn(theme.classes.body)}
              style={{ opacity: 0.7, color: theme.colors.foreground }}
            >
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
