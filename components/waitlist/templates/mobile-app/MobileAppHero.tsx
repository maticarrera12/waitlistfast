'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useTheme, getTheme, ThemeName } from '@/lib/themes'
import { JoinForm } from '@/components/waitlist/join-form'
import type { MobileAppHeroConfig, MobileAppPlatformConfig } from '@/lib/waitlist/templates/mobile-app.config'

interface MobileAppHeroProps {
  waitlist: {
    id: string
    name: string
    slug: string
    headline: string | null
    description: string | null
  }
  subscriberCount: number
  themeName: ThemeName
  config: MobileAppHeroConfig
  platforms: MobileAppPlatformConfig
}

const SLIDE_INTERVAL = 5000 // 5 seconds per slide

export function MobileAppHero({ waitlist, subscriberCount, themeName, config, platforms }: MobileAppHeroProps) {
  const theme = useTheme(themeName)
  const themeConfig = getTheme(themeName)

  const headline = config.headline || waitlist.headline || waitlist.name
  const images = config.media.images || []

  const [activeIndex, setActiveIndex] = useState(0)

  const nextSlide = useCallback(() => {
    if (images.length <= 1) return
    setActiveIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(nextSlide, SLIDE_INTERVAL)
    return () => clearInterval(timer)
  }, [nextSlide, images.length])

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32">
      {/* Background — video or image slider */}
      {config.type === 'video' && config.media.videoUrl ? (
        <div className="absolute inset-0 z-0">
          <video
            src={config.media.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-40 grayscale"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${theme.colors.background}, ${theme.colors.background}cc, transparent)`,
            }}
          />
        </div>
      ) : images.length > 0 ? (
        <div className="absolute inset-0 z-0">
          {/* Stacked images — crossfade slider */}
          {images.map((src, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={idx}
              src={src}
              alt={`App Preview ${idx + 1}`}
              className="absolute inset-0 w-full h-full object-cover grayscale transition-opacity duration-1000 ease-in-out"
              style={{ opacity: idx === activeIndex ? 0.4 : 0 }}
            />
          ))}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${theme.colors.background}, ${theme.colors.background}cc, transparent)`,
            }}
          />
        </div>
      ) : (
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full"
            style={{ backgroundColor: theme.colors.background }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 text-center">
        <h1
          className={cn("font-black uppercase italic mb-8", theme.classes.heading)}
          style={{
            fontSize: 'clamp(3.5rem, 12vw, 10rem)',
            lineHeight: 0.8,
            letterSpacing: '-0.06em',
            color: theme.colors.primary,
          }}
        >
          {headline}
        </h1>

        <p
          className={cn("text-xl md:text-3xl font-bold max-w-3xl mx-auto mb-16 leading-tight", theme.classes.body)}
          style={{ color: `${theme.colors.foreground}e6` }}
        >
          {config.subheadline}
        </p>

        <div className="w-full max-w-2xl mx-auto">
          <JoinForm
            waitlistId={waitlist.id}
            waitlistSlug={waitlist.slug}
            themeName={themeName}
            subscriberCount={subscriberCount}
          />

          {/* Platform badges */}
          {(platforms.ios || platforms.android) && (
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              {platforms.ios && (
                <div
                  className="inline-flex items-center gap-2 px-4 py-1 rounded-full border font-black uppercase text-xs tracking-widest"
                  style={{
                    borderColor: theme.colors.accent,
                    color: theme.colors.accent,
                  }}
                >
                  <span>🍎</span> iOS
                </div>
              )}
              {platforms.android && (
                <div
                  className="inline-flex items-center gap-2 px-4 py-1 rounded-full border font-black uppercase text-xs tracking-widest"
                  style={{
                    borderColor: theme.colors.accent,
                    color: theme.colors.accent,
                  }}
                >
                  <span>🤖</span> Android
                </div>
              )}
            </div>
          )}

          {/* Slide indicators */}
          {images.length > 1 && config.type !== 'video' && (
            <div className="flex justify-center gap-2 mt-6">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: idx === activeIndex
                      ? theme.colors.primary
                      : `${theme.colors.foreground}30`,
                    transform: idx === activeIndex ? 'scale(1.5)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
