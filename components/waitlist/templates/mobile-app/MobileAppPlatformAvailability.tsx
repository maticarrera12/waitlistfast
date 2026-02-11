'use client'

import { cn } from '@/lib/utils'
import { useTheme, getTheme, ThemeName } from '@/lib/themes'
import type { MobileAppPlatformConfig } from '@/lib/waitlist/templates/mobile-app.config'

interface MobileAppPlatformAvailabilityProps {
  themeName: ThemeName
  platforms: MobileAppPlatformConfig
  waitlistName: string
}

export function MobileAppPlatformAvailability({ themeName, platforms, waitlistName }: MobileAppPlatformAvailabilityProps) {
  const theme = useTheme(themeName)

  if (!platforms.ios && !platforms.android) return null

  return (
    <section
      className="py-12 border-t"
      style={{ borderColor: `${theme.colors.foreground}0d` }}
    >
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 opacity-40 hover:opacity-100 transition-all duration-500">
        {/* Brand */}
        <div className="flex items-center gap-2 font-black italic text-2xl"
          style={{ color: theme.colors.foreground }}
        >
          <span
            className="px-2 py-0.5"
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.background,
            }}
          >
            {waitlistName.charAt(0).toUpperCase()}
          </span>
          {waitlistName.toUpperCase()}
        </div>

        {/* Platform versions */}
        <div className="flex gap-12 text-sm font-black uppercase tracking-widest"
          style={{ color: theme.colors.foreground }}
        >
          {platforms.ios && (
            <span className="flex items-center gap-2">
              🍎 iOS {platforms.text || ''}
            </span>
          )}
          {platforms.android && (
            <span className="flex items-center gap-2">
              🤖 Android {platforms.text || ''}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
