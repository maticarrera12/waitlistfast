'use client'

import { cn } from '@/lib/utils'
import { useTheme, getTheme, ThemeName } from '@/lib/themes'

interface HowItWorksProps {
  themeName: ThemeName
}

export function HowItWorks({ themeName }: HowItWorksProps) {
  const theme = useTheme(themeName)
  const themeConfig = getTheme(themeName)

  const steps = [
    { number: '1', title: 'Join the Waitlist', description: 'Enter your email to secure your spot' },
    { number: '2', title: 'Invite Friends', description: 'Share your unique link and earn rewards' },
    { number: '3', title: 'Get Early Access', description: 'Be among the first to experience it' },
  ]

  return (
    <section className="mb-24">
      <h2 
        className={cn(
          "font-bold mb-12 text-center",
          theme.classes.heading
        )}
        style={{
          fontSize: themeConfig.typography.fontSize['3xl'],
        }}
      >
        How It Works
      </h2>
      
      <div className="max-w-3xl mx-auto space-y-8">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex items-start gap-6"
          >
            <div
              className={cn(
                "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold",
                theme.classes.heading
              )}
              style={{
                backgroundColor: theme.colors.accent,
                color: theme.colors.foreground,
              }}
            >
              {step.number}
            </div>
            <div>
              <h3 
                className={cn(
                  "font-bold mb-2",
                  theme.classes.heading
                )}
                style={{
                  fontSize: themeConfig.typography.fontSize.xl,
                }}
              >
                {step.title}
              </h3>
              <p 
                className={cn(theme.classes.body)}
                style={{
                  opacity: 0.7,
                  fontSize: themeConfig.typography.fontSize.base,
                }}
              >
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

