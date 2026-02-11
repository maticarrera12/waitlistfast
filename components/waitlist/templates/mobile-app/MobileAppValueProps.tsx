'use client'

import { cn } from '@/lib/utils'
import { useTheme, getTheme, ThemeName } from '@/lib/themes'
import type { MobileAppValuePropItem } from '@/lib/waitlist/templates/mobile-app.config'

interface MobileAppValuePropsProps {
  themeName: ThemeName
  items: MobileAppValuePropItem[]
}

export function MobileAppValueProps({ themeName, items }: MobileAppValuePropsProps) {
  const theme = useTheme(themeName)
  const themeConfig = getTheme(themeName)

  if (!items || items.length === 0) return null

  // Cycle through accent colors for left border
  const borderColors = [
    theme.colors.primary,
    theme.colors.accent,
    theme.colors.secondary || theme.colors.primary,
  ]

  return (
    <section
      className="max-w-7xl mx-auto px-6 py-32 border-y"
      style={{ borderColor: `${theme.colors.foreground}0d` }}
    >
      <div
        className="grid gap-8"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        }}
      >
        {items.map((item, idx) => {
          const borderColor = borderColors[idx % borderColors.length]
          return (
            <div
              key={idx}
              className="space-y-4 p-8 border-l-4"
              style={{ borderColor }}
            >
              <h3
                className={cn("text-3xl font-black uppercase italic", theme.classes.heading)}
                style={{ color: borderColor }}
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.title}
              </h3>
              {item.description && (
                <p
                  className={cn("text-lg font-medium leading-relaxed", theme.classes.body)}
                  style={{ color: `${theme.colors.foreground}99` }}
                >
                  {item.description}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
