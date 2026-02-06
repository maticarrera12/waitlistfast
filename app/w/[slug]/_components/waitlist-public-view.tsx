'use client'

import { cn } from '@/lib/utils'
import { JoinForm } from '@/components/waitlist/join-form'
import { useTheme, ThemeName, isValidTheme, getTheme } from '@/lib/themes'

interface WaitlistPublicViewProps {
  waitlist: {
    id: string
    name: string
    slug: string
    headline: string | null
    description: string | null
    settings: any
  }
  subscriberCount: number
  settings: {
    theme?: string
    projectType?: string
    brandColor?: string
  } | null
}

// Mapeo de temas antiguos a nuevos para compatibilidad
const themeMapping: Record<string, ThemeName> = {
  'neon': 'webflow',
  'minimal': 'linear',
  'luxury': 'apple',
}

function normalizeTheme(theme: string | undefined): ThemeName {
  if (!theme) return 'linear'
  
  // Si es un tema nuevo válido, usarlo directamente
  if (isValidTheme(theme)) {
    return theme
  }
  
  // Si es un tema antiguo, mapearlo
  if (theme in themeMapping) {
    return themeMapping[theme]
  }
  
  // Por defecto
  return 'linear'
}

export function WaitlistPublicView({ waitlist, subscriberCount, settings }: WaitlistPublicViewProps) {
  const themeName = normalizeTheme(settings?.theme)
  const theme = useTheme(themeName)
  const brandColor = settings?.brandColor || theme.colors.primary

  return (
    <div 
      className={cn(
        "min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8",
        theme.classes.container
      )}
      style={theme.styles}
    >
      <div className="max-w-4xl mx-auto w-full text-center space-y-8 py-16 flex flex-col items-center">
        {/* Header */}
        <div className="space-y-4">
          <h1 className={cn(
            "text-5xl sm:text-6xl md:text-7xl font-bold",
            theme.classes.heading,
            theme.config.typography.fontSize['7xl']
          )}>
            {waitlist.headline || waitlist.name}
          </h1>
          
          {waitlist.description && (
            <p className={cn(
              "text-lg sm:text-xl max-w-2xl mx-auto",
              theme.classes.body
            )}>
              {waitlist.description}
            </p>
          )}
        </div>

        {/* Subscriber Count */}
        <div className="flex items-center justify-center gap-2">
          <span 
            className={cn(
              "text-2xl sm:text-3xl font-bold",
              theme.config.typography.fontFamily.mono && "font-mono"
            )}
            style={{ color: theme.colors.accent }}
          >
            {subscriberCount.toLocaleString()}
          </span>
          <span className={cn("text-lg sm:text-xl", theme.classes.body)}>
            people waiting
          </span>
        </div>

        {/* Join Form Component */}
        <JoinForm 
          waitlistId={waitlist.id}
          waitlistSlug={waitlist.slug}
          themeName={themeName}
          subscriberCount={subscriberCount}
        />
      </div>
    </div>
  )
}

