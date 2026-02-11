'use client'

import { cn } from '@/lib/utils'
import { useTheme, getTheme, ThemeName } from '@/lib/themes'

interface FeaturesProps {
  themeName: ThemeName
}

export function Features({ themeName }: FeaturesProps) {
  const theme = useTheme(themeName)
  const themeConfig = getTheme(themeName)

  const features = [
    { title: 'Early Access', description: 'Get priority access to new features' },
    { title: 'Exclusive Updates', description: 'Stay ahead with insider information' },
    { title: 'Community Access', description: 'Join our exclusive community' },
  ]

  return (
    <section className="mb-40">
      <h2 
        className={cn(
          "font-black uppercase tracking-tighter italic mb-12 text-center",
          theme.classes.heading
        )}
        style={{
          fontSize: themeConfig.typography.fontSize['5xl'],
        }}
      >
        Why Join?
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className={cn(
              "p-8 border-2 text-center",
              theme.classes.card
            )}
            style={{
              backgroundColor: theme.colors.muted,
              borderColor: `${theme.colors.border}40`,
              borderRadius: themeConfig.layout.borderRadius.xl,
            }}
          >
            <h3 
              className={cn(
                "font-black uppercase mb-4",
                theme.classes.heading
              )}
              style={{
                fontSize: themeConfig.typography.fontSize['2xl'],
                color: theme.colors.primary,
              }}
            >
              {feature.title}
            </h3>
            <p 
              className={cn(theme.classes.body)}
              style={{
                opacity: 0.6,
                fontSize: themeConfig.typography.fontSize.base,
              }}
            >
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

