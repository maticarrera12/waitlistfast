'use client'

import { cn } from '@/lib/utils'
import { useTheme, getTheme, ThemeName } from '@/lib/themes'

interface EarlyAccessItem {
  emoji?: string
  title: string
  description: string
}

interface EarlyAccessContent {
  sectionTitle: string
  sectionSubtitle: string
  items: EarlyAccessItem[]
}

interface EarlyAccessSectionProps {
  themeName: ThemeName
  content: EarlyAccessContent
}

export function EarlyAccessSection({ themeName, content }: EarlyAccessSectionProps) {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {content.items.map((item, index) => (
          <div
            key={index}
            className={cn(
              "flex items-start gap-4 p-6 border-2 transition-all duration-300",
              theme.classes.card
            )}
            style={{
              backgroundColor: theme.colors.muted,
              borderColor: `${theme.colors.border}40`,
              borderRadius: themeConfig.layout.borderRadius.xl,
            }}
          >
            {item.emoji && <span className="text-2xl shrink-0">{item.emoji}</span>}
            <div>
              <h3
                className={cn("font-bold mb-1", theme.classes.heading)}
                style={{ color: theme.colors.foreground }}
              >
                {item.title}
              </h3>
              <p
                className={cn("text-sm", theme.classes.body)}
                style={{ opacity: 0.7, color: theme.colors.foreground }}
              >
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
