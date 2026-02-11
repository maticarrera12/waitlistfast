'use client'

import { cn } from '@/lib/utils'
import { useTheme, getTheme, ThemeName } from '@/lib/themes'
import type { MobileAppFeaturePreviewItem } from '@/lib/waitlist/templates/mobile-app.config'

interface MobileAppFeaturePreviewProps {
  themeName: ThemeName
  items: MobileAppFeaturePreviewItem[]
}

export function MobileAppFeaturePreview({ themeName, items }: MobileAppFeaturePreviewProps) {
  const theme = useTheme(themeName)
  const themeConfig = getTheme(themeName)

  if (!items || items.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-6 py-32">
      <div className="space-y-32">
        {items.map((item, idx) => {
          const isReversed = idx % 2 === 1
          return (
            <div
              key={idx}
              className={cn(
                "flex flex-col items-center gap-16",
                isReversed ? "md:flex-row-reverse" : "md:flex-row"
              )}
            >
              {/* Phone mockup */}
              {item.image && (
                <div className="w-full md:w-1/2">
                  <div
                    className="relative aspect-[9/16] overflow-hidden shadow-2xl"
                    style={{
                      backgroundColor: theme.colors.muted,
                      border: `4px solid ${theme.colors.foreground}1a`,
                      borderRadius: '3rem',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Text */}
              <div className={cn("w-full", item.image ? "md:w-1/2" : "max-w-2xl mx-auto text-center")}>
                <h2
                  className={cn(
                    "text-6xl font-black uppercase italic mb-6 leading-none",
                    theme.classes.heading,
                    isReversed && !item.image ? "" : ""
                  )}
                  style={{ color: theme.colors.foreground }}
                >
                  {item.title}
                </h2>
                {item.description && (
                  <p
                    className={cn("text-2xl font-medium", theme.classes.body)}
                    style={{ color: `${theme.colors.foreground}99` }}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
