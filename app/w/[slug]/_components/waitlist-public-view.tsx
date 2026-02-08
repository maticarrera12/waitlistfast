'use client'

import { cn } from '@/lib/utils'
import { JoinForm } from '@/components/waitlist/join-form'
import { useTheme, ThemeName, isValidTheme, getTheme } from '@/lib/themes'
import type { RewardModel } from '@/lib/generated/prisma/models/Reward'
import type { PointRuleModel } from '@/lib/generated/prisma/models/PointRule'
import { ReferralCookieHandler } from './referral-cookie-handler'

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
  rewards: RewardModel[]
  pointRules: PointRuleModel[]
  subscriber?: {
    id: string
    email: string
    score: number
    position: number | null
    referralCount: number
  } | null
}

// Mapeo de temas antiguos a nuevos para compatibilidad
const themeMapping: Record<string, ThemeName> = {
  'neon': 'webflow',
  'minimal': 'linear',
  'luxury': 'apple',
}

function normalizeTheme(theme: string | undefined): ThemeName {
  if (!theme) return 'default'
  
  // Si es un tema nuevo válido, usarlo directamente
  if (isValidTheme(theme)) {
    return theme
  }
  
  // Si es un tema antiguo, mapearlo
  if (theme in themeMapping) {
    return themeMapping[theme]
  }
  
  // Por defecto
  return 'default'
}

// Helper to get reward display info
function getRewardDisplayInfo(
  reward: RewardModel,
  subscriber?: {
    score: number
    position: number | null
    referralCount: number
  } | null
) {
  const ruleParams = reward.ruleParams as any || {}
  
  if (reward.distributionRule === 'TOP_N') {
    const threshold = reward.maxRecipients || ruleParams.topN || 10
    // For TOP_N, if user is within top N, show 100% progress
    // Otherwise show their position relative to threshold
    const isWithinTopN = subscriber?.position ? subscriber.position <= threshold : false
    const current = subscriber?.position || null
    return {
      type: 'Top N',
      threshold,
      label: `Top ${threshold}`,
      current: isWithinTopN ? threshold : (current !== null ? current : 0),
      showProgress: current !== null,
      isUnlocked: isWithinTopN,
    }
  }
  
  if (reward.distributionRule === 'MIN_SCORE') {
    const threshold = ruleParams.minScore || 0
    const current = subscriber?.score || 0
    return {
      type: 'Min Score',
      threshold,
      label: `${threshold} Points`,
      current,
      showProgress: !!subscriber,
      isUnlocked: current >= threshold,
    }
  }
  
  if (reward.distributionRule === 'MIN_REFERRALS') {
    const threshold = ruleParams.minReferrals || 0
    const current = subscriber?.referralCount || 0
    return {
      type: 'Min Referrals',
      threshold,
      label: `${threshold} Referrals`,
      current,
      showProgress: !!subscriber,
      isUnlocked: current >= threshold,
    }
  }
  
  return {
    type: 'Manual',
    threshold: 0,
    label: 'Manual',
    current: 0,
    showProgress: false,
    isUnlocked: false,
  }
}

// Helper to calculate progress percentage
function calculateProgress(current: number, threshold: number): number {
  if (threshold === 0) return 0
  return Math.min(100, Math.max(0, (current / threshold) * 100))
}

// Helper to organize rewards into rows with alternating 66/33 and 33/66 pattern
function organizeRewardsIntoRows(rewards: RewardModel[]) {
  const rows: Array<{ rewards: RewardModel[], layout: '66-33' | '33-66' | 'full', isReversed: boolean }> = []
  let currentRow: RewardModel[] = []
  let rowIndex = 0
  
  for (let i = 0; i < rewards.length; i++) {
    currentRow.push(rewards[i])
    
    // If we have 2 rewards, create a row with alternating pattern
    if (currentRow.length === 2) {
      // Alternate between 66-33 and 33-66
      const isReversed = rowIndex % 2 === 1
      rows.push({ 
        rewards: [...currentRow], 
        layout: isReversed ? '33-66' : '66-33',
        isReversed 
      })
      currentRow = []
      rowIndex++
    }
  }
  
  // If there's a remaining reward (odd number), make it full width
  if (currentRow.length === 1) {
    rows.push({ rewards: [...currentRow], layout: 'full', isReversed: false })
  }
  
  return rows
}

// Icon mapping for reward types
const rewardIcons: Record<string, string> = {
  'FEATURE': '🚀',
  'ACCESS': '🎫',
  'DISCOUNT': '💳',
  'CUSTOM': '🎁',
  'PHYSICAL': '📦',
}

export function WaitlistPublicView({ waitlist, subscriberCount, settings, rewards, pointRules, subscriber }: WaitlistPublicViewProps) {
  const themeName = normalizeTheme(settings?.theme)
  const theme = useTheme(themeName)
  const themeConfig = getTheme(themeName)
  const brandColor = settings?.brandColor || theme.colors.primary

  // Filter and sort rewards for display
  const displayRewards = rewards
    .filter(r => r.distributionRule !== 'MANUAL') // Hide manual rewards from public view
    .slice(0, 6) // Limit to 6 rewards
  
  // Organize rewards into rows with 66/33 pattern
  const rewardRows = organizeRewardsIntoRows(displayRewards)

  return (
    <div 
      className={cn(
        "min-h-screen relative overflow-x-hidden",
        theme.classes.container
      )}
      style={theme.styles}
    >
      {/* Capture referral code from URL and store in cookie */}
      <ReferralCookieHandler />
      
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div 
          className="absolute top-0 right-0 w-1/2 h-1/2 rounded-full blur-[120px] opacity-5"
          style={{ backgroundColor: theme.colors.primary }}
        />
        <div 
          className="absolute bottom-0 left-0 w-1/2 h-1/2 rounded-full blur-[120px] opacity-5"
          style={{ backgroundColor: theme.colors.accent }}
        />
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-12 pb-32">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center mb-32">
          <h1 
            className={cn(
              "font-black uppercase italic mb-8",
              theme.classes.heading
            )}
            style={{
              fontSize: 'clamp(4rem, 13vw, 12rem)',
              lineHeight: 0.85,
              letterSpacing: '-0.05em',
              color: theme.colors.primary,
            }}
          >
            {waitlist.headline || waitlist.name}
          </h1>
          
          <div className="w-full max-w-2xl space-y-8">
        {/* Subscriber Count */}
            <div 
            className={cn(
                "font-black tracking-tighter uppercase mb-4",
                theme.classes.heading
            )}
              style={{
                fontSize: 'clamp(2rem, 6vw, 4rem)',
                color: theme.colors.accent,
              }}
          >
              JOIN {subscriberCount.toLocaleString()} OTHERS
        </div>

            {/* Join Form */}
        <JoinForm 
          waitlistId={waitlist.id}
          waitlistSlug={waitlist.slug}
          themeName={themeName}
          subscriberCount={subscriberCount}
        />
 
              <p 
                className={cn(
                  "text-sm text-center mt-4",
                  theme.classes.body
                )}
                style={{ 
                  opacity: 0.5,
                  fontSize: themeConfig.typography.fontSize.sm,
                }}
              >
                If you&apos;re already on the waitlist, enter your email to see your progress.
              </p>

            {waitlist.description && (
              <p 
                className={cn(
                  "font-medium",
                  theme.classes.body
                )}
                style={{ 
                  opacity: 0.4,
                  fontSize: themeConfig.typography.fontSize.base,
                }}
              >
                {waitlist.description}
              </p>
            )}
          </div>
        </section>

        {/* Rewards & Goals Section */}
        {displayRewards.length > 0 && (
          <section className="mb-40">
            <div className="flex items-end justify-between mb-12 border-b-4 pb-6" style={{ borderColor: theme.colors.foreground }}>
              <div>
                <h2 
                  className={cn(
                    "font-black uppercase tracking-tighter italic",
                    theme.classes.heading
                  )}
                  style={{
                    fontSize: themeConfig.typography.fontSize['6xl'],
                  }}
                >
                  Rewards & Goals
                </h2>
                <p 
                  className={cn(
                    "font-bold uppercase tracking-widest mt-2",
                    theme.classes.body
                  )}
                  style={{
                    color: theme.colors.accent,
                    fontSize: themeConfig.typography.fontSize.sm,
                  }}
                >
                  Unlock as you climb the rank
                </p>
              </div>
              <div className="hidden md:block text-right">
                <span 
                  className={cn(
                    "uppercase font-bold text-xs",
                    theme.classes.body
                  )}
                  style={{ opacity: 0.3 }}
                >
                  Scroll to explore
                </span>
              </div>
            </div>

            <div className="space-y-8">
              {rewardRows.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className={cn(
                    "grid gap-8",
                    (row.layout === '66-33' || row.layout === '33-66')
                      ? "grid-cols-1 md:grid-cols-3" 
                      : "grid-cols-1"
                  )}
                >
                  {row.rewards.map((reward, cardIndex) => {
                    const displayInfo = getRewardDisplayInfo(reward, subscriber)
                    const icon = rewardIcons[reward.type] || '🎁'
                    // Only show progress if subscriber exists and showProgress is true
                    const progress = (subscriber && displayInfo.showProgress) 
                      ? calculateProgress(displayInfo.current, displayInfo.threshold)
                      : 0
                    const showProgressBar = !!subscriber && displayInfo.showProgress
                    // First card is large in 66-33, second card is large in 33-66
                    const isLarge = (row.layout === '66-33' && cardIndex === 0) || (row.layout === '33-66' && cardIndex === 1)

                    return (
                      <div
                        key={reward.id}
                        className={cn(
                          "group relative overflow-hidden transition-all duration-300 p-8 border-2 flex flex-col",
                          // 66-33: first card spans 2 columns, second spans 1
                          // 33-66: first card spans 1 column, second spans 2
                          row.layout === '66-33' && cardIndex === 0 ? "md:col-span-2" : "",
                          row.layout === '33-66' && cardIndex === 1 ? "md:col-span-2" : "",
                          row.layout === '33-66' && cardIndex === 0 ? "md:col-span-1" : "",
                          theme.classes.card
                        )}
                        style={{
                          backgroundColor: theme.colors.muted,
                          borderColor: `${theme.colors.border}40`,
                          borderRadius: themeConfig.layout.borderRadius.xl,
                          minHeight: '100%', // Ensure equal height
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = theme.colors.accent
                          e.currentTarget.style.transform = 'scale(1.02)'
                          e.currentTarget.style.boxShadow = `0 0 30px ${theme.colors.accent}33`
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = `${theme.colors.border}40`
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <div className="flex justify-between items-start mb-12">
                          <span 
                            className="text-6xl"
                            style={{ color: theme.colors.accent }}
                          >
                            {icon}
                          </span>
                      <span
                        className="px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border"
                        style={{
                          backgroundColor: themeName === 'brutalist' 
                            ? theme.colors.accent 
                            : `${theme.colors.accent}10`,
                          color: themeName === 'brutalist' 
                            ? theme.colors.foreground 
                            : theme.colors.accent,
                          borderColor: themeName === 'brutalist' 
                            ? theme.colors.foreground 
                            : `${theme.colors.accent}20`,
                        }}
                      >
                        {displayInfo.label}
                      </span>
                        </div>

                        <h3 
                          className={cn(
                            "font-black uppercase italic mb-4 transition-colors group-hover:transition-colors",
                            theme.classes.heading
                          )}
                          style={{
                            fontSize: isLarge ? themeConfig.typography.fontSize['4xl'] : themeConfig.typography.fontSize['3xl'],
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = theme.colors.accent
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = theme.colors.foreground
                          }}
                        >
                          {reward.name}
                        </h3>

                        <p 
                          className={cn(
                            "text-lg mb-8 grow",
                            theme.classes.body
                          )}
                          style={{
                            opacity: 0.6,
                            fontSize: themeConfig.typography.fontSize.base,
                          }}
                        >
                          {reward.description || 'Unlock this reward by reaching the required milestone.'}
                        </p>

                        {/* Progress bar - only show if subscriber exists */}
                        <div className="mt-auto">
                          <div 
                            className="h-2 rounded-full overflow-hidden"
                            style={{
                              backgroundColor: `${theme.colors.foreground}05`,
                            }}
                          >
                            <div 
                              className="h-full transition-all duration-300"
                              style={{
                                backgroundColor: showProgressBar ? theme.colors.accent : `${theme.colors.foreground}10`,
                                width: showProgressBar ? `${progress}%` : '0%',
                              }}
                            />
                          </div>
                          <div className="mt-2 flex justify-between text-xs font-bold uppercase tracking-widest" style={{ opacity: 0.3 }}>
                            <span>Progress</span>
                            <span>
                              {showProgressBar ? (
                                <>
                                  {displayInfo.type === 'Top N' && displayInfo.isUnlocked ? (
                                    `Top ${displayInfo.threshold} ✓`
                                  ) : displayInfo.type === 'Top N' ? (
                                    `Position #${subscriber?.position || '?'} / Top ${displayInfo.threshold}`
                                  ) : (
                                    <>
                                      {displayInfo.current} / {displayInfo.threshold}
                                      {displayInfo.type === 'Min Score' && ' points'}
                                      {displayInfo.type === 'Min Referrals' && ' referrals'}
                                      {displayInfo.isUnlocked && ' ✓'}
                                    </>
                                  )}
                                </>
                              ) : (
                                'Join to track'
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Point Rules Section */}
        {pointRules.length > 0 && (
          <section className="mb-40">
            <div className="mb-12">
              <h2 
                className={cn(
                  "font-black uppercase tracking-tighter italic mb-2",
                  theme.classes.heading
                )}
                style={{
                  fontSize: themeConfig.typography.fontSize['6xl'],
                }}
              >
                Point Rules
              </h2>
              <p 
                className={cn(
                  "uppercase tracking-widest",
                  theme.classes.body
                )}
                style={{
                  opacity: 0.6,
                  fontSize: themeConfig.typography.fontSize.sm,
                }}
              >
                Stack points to climb the leaderboard
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2" style={{ borderColor: theme.colors.border }}>
                    <th 
                      className={cn(
                        "text-left py-4 px-6 uppercase tracking-widest font-bold text-xs",
                        theme.classes.body
                      )}
                      style={{ opacity: 0.6 }}
                    >
                      Event
                    </th>
                    <th 
                      className={cn(
                        "text-left py-4 px-6 uppercase tracking-widest font-bold text-xs",
                        theme.classes.body
                      )}
                      style={{ opacity: 0.6 }}
                    >
                      Points
                    </th>
                    <th 
                      className={cn(
                        "text-left py-4 px-6 uppercase tracking-widest font-bold text-xs",
                        theme.classes.body
                      )}
                      style={{ opacity: 0.6 }}
                    >
                      Name
                    </th>
                    <th 
                      className={cn(
                        "text-left py-4 px-6 uppercase tracking-widest font-bold text-xs",
                        theme.classes.body
                      )}
                      style={{ opacity: 0.6 }}
                    >
                      Condition
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pointRules.map((rule) => {
                    const conditions = rule.conditions as any || {}
                    let conditionText = 'None'
                    
                    if (conditions.onlyFirst) {
                      conditionText = 'First time only'
                    } else if (conditions.maxOccurrences) {
                      conditionText = `Max ${conditions.maxOccurrences} times`
                    } else if (conditions.referralCount) {
                      conditionText = `Exactly ${conditions.referralCount} referrals`
                    } else if (conditions.minReferralCount) {
                      conditionText = `At least ${conditions.minReferralCount} referrals`
                    } else if (conditions.once) {
                      conditionText = 'Once'
                    }

                    return (
                      <tr 
                        key={rule.id}
                        className="border-b"
                        style={{ 
                          borderColor: `${theme.colors.border}20`,
                        }}
                      >
                        <td className="py-4 px-6">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                            style={{
                              backgroundColor: themeName === 'brutalist' 
                                ? theme.colors.accent 
                                : `${theme.colors.accent}10`,
                              color: themeName === 'brutalist' 
                                ? theme.colors.foreground 
                                : theme.colors.accent,
                              border: `1px solid ${theme.colors.accent}${themeName === 'brutalist' ? '' : '30'}`,
                            }}
                          >
                            {rule.event.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={cn(
                              "font-bold text-lg",
                              theme.classes.heading
                            )}
                            style={{
                              color: themeName === 'brutalist' 
                                ? theme.colors.foreground 
                                : theme.colors.accent,
                              backgroundColor: themeName === 'brutalist' 
                                ? theme.colors.accent 
                                : 'transparent',
                              padding: themeName === 'brutalist' ? '0.25rem 0.5rem' : '0',
                              border: themeName === 'brutalist' ? `2px solid ${theme.colors.foreground}` : 'none',
                            }}
                          >
                            +{rule.points}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={cn(theme.classes.body)}>
                            {rule.name || rule.event.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span 
                            className={cn(theme.classes.body)}
                            style={{ opacity: 0.6 }}
                          >
                            {conditionText}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
      </div>
          </section>
        )}
      </main>
    </div>
  )
}
