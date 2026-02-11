// ──────────────────────────────────────────
// Types for mobile-app templateConfig
// ──────────────────────────────────────────

export interface MobileAppHeroConfig {
  type: 'gallery' | 'video'
  headline: string
  subheadline: string
  ctaText: string
  media: {
    images: string[]
    videoUrl?: string
  }
}

export interface MobileAppValuePropItem {
  title: string
  description?: string
  icon?: string
}

export interface MobileAppFeaturePreviewItem {
  title: string
  description?: string
  image?: string
}

export interface MobileAppPlatformConfig {
  ios: boolean
  android: boolean
  text?: string
}

export interface MobileAppTemplateConfig {
  hero: MobileAppHeroConfig
  valueProps: {
    items: MobileAppValuePropItem[]
  }
  featurePreview: {
    items: MobileAppFeaturePreviewItem[]
  }
  socialProof?: {
    text?: string
  }
  platforms: MobileAppPlatformConfig
}

// ──────────────────────────────────────────
// Demo / fallback content
// ──────────────────────────────────────────

export const mobileAppDemoConfig: MobileAppTemplateConfig = {
  hero: {
    type: 'gallery',
    headline: 'The App You\'ve Been Waiting For',
    subheadline: 'A beautifully crafted mobile experience that simplifies your daily workflow.',
    ctaText: 'Get Early Access',
    media: {
      images: [
        'https://placehold.co/400x800/1a1a2e/e0e0e0?text=Screen+1',
        'https://placehold.co/400x800/16213e/e0e0e0?text=Screen+2',
        'https://placehold.co/400x800/0f3460/e0e0e0?text=Screen+3',
      ],
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
  },
  valueProps: {
    items: [
      { title: 'Lightning Fast', description: 'Optimized for speed on every device.', icon: '⚡' },
      { title: 'Privacy First', description: 'Your data stays on your device.', icon: '🔒' },
      { title: 'Works Offline', description: 'Full functionality without internet.', icon: '📡' },
      { title: 'Beautiful UI', description: 'Designed with care, down to the pixel.', icon: '✨' },
    ],
  },
  featurePreview: {
    items: [
      {
        title: 'Smart Dashboard',
        description: 'Get a bird\'s-eye view of everything that matters.',
        image: 'https://placehold.co/600x400/1a1a2e/e0e0e0?text=Dashboard',
      },
      {
        title: 'Instant Sync',
        description: 'Seamlessly sync across all your devices in real time.',
        image: 'https://placehold.co/600x400/16213e/e0e0e0?text=Sync',
      },
      {
        title: 'Smart Notifications',
        description: 'Only the alerts that matter, when they matter.',
        image: 'https://placehold.co/600x400/0f3460/e0e0e0?text=Notifications',
      },
    ],
  },
  socialProof: {
    text: 'Trusted by early adopters from companies like Google, Stripe, and Vercel.',
  },
  platforms: {
    ios: true,
    android: true,
    text: 'Launching Q2 2026',
  },
}

export function resolveMobileAppConfig(
  stored: Record<string, any> | null | undefined,
): MobileAppTemplateConfig {
  if (!stored) return { ...mobileAppDemoConfig }

  return {
    hero: {
      type: stored.hero?.type || mobileAppDemoConfig.hero.type,
      headline: stored.hero?.headline || mobileAppDemoConfig.hero.headline,
      subheadline: stored.hero?.subheadline || mobileAppDemoConfig.hero.subheadline,
      ctaText: stored.hero?.ctaText || mobileAppDemoConfig.hero.ctaText,
      media: {
        images: stored.hero?.media?.images?.length
          ? stored.hero.media.images
          : mobileAppDemoConfig.hero.media.images,
        videoUrl: stored.hero?.media?.videoUrl || mobileAppDemoConfig.hero.media.videoUrl,
      },
    },
    valueProps: {
      items: stored.valueProps?.items?.length
        ? stored.valueProps.items
        : mobileAppDemoConfig.valueProps.items,
    },
    featurePreview: {
      items: stored.featurePreview?.items?.length
        ? stored.featurePreview.items
        : mobileAppDemoConfig.featurePreview.items,
    },
    socialProof: {
      text: stored.socialProof?.text ?? mobileAppDemoConfig.socialProof?.text,
    },
    platforms: {
      ios: stored.platforms?.ios ?? mobileAppDemoConfig.platforms.ios,
      android: stored.platforms?.android ?? mobileAppDemoConfig.platforms.android,
      text: stored.platforms?.text ?? mobileAppDemoConfig.platforms.text,
    },
  }
}

