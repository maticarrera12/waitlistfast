'use client'

import { cn } from '@/lib/utils'
import { useTheme, getTheme, ThemeName } from '@/lib/themes'
import type { RewardModel } from '@/src/generated/models/Reward'

interface RewardsProps {
  rewards: RewardModel[]
  subscriber?: {
    id: string
    email: string
    score: number
    position: number | null
    referralCount: number
  } | null
  themeName: ThemeName
}

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

function calculateProgress(current: number, threshold: number): number {
  if (threshold === 0) return 0
  return Math.min(100, Math.max(0, (current / threshold) * 100))
}

function organizeRewardsIntoRows(rewards: RewardModel[]) {
  const rows: Array<{ rewards: RewardModel[], layout: '66-33' | '33-66' | 'full', isReversed: boolean }> = []
  let currentRow: RewardModel[] = []
  let rowIndex = 0
  
  for (let i = 0; i < rewards.length; i++) {
    currentRow.push(rewards[i])
    
    if (currentRow.length === 2) {
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
  
  if (currentRow.length === 1) {
    rows.push({ rewards: [...currentRow], layout: 'full', isReversed: false })
  }
  
  return rows
}

const rewardIcons: Record<string, string> = {
  'FEATURE': '🚀',
  'ACCESS': '🎫',
  'DISCOUNT': '💳',
  'CUSTOM': '🎁',
  'PHYSICAL': '📦',
}

export function Rewards({ rewards, subscriber, themeName }: RewardsProps) {
  const theme = useTheme(themeName)
  const themeConfig = getTheme(themeName)

  const displayRewards = rewards
    .filter(r => r.distributionRule !== 'MANUAL')
    .slice(0, 6)
  
  const rewardRows = organizeRewardsIntoRows(displayRewards)

  if (displayRewards.length === 0) {
    return null
  }

  return (
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
              const progress = (subscriber && displayInfo.showProgress) 
                ? calculateProgress(displayInfo.current, displayInfo.threshold)
                : 0
              const showProgressBar = !!subscriber && displayInfo.showProgress
              const isLarge = (row.layout === '66-33' && cardIndex === 0) || (row.layout === '33-66' && cardIndex === 1)

              return (
                <div
                  key={reward.id}
                  className={cn(
                    "group relative overflow-hidden transition-all duration-300 p-8 border-2 flex flex-col",
                    row.layout === '66-33' && cardIndex === 0 ? "md:col-span-2" : "",
                    row.layout === '33-66' && cardIndex === 1 ? "md:col-span-2" : "",
                    row.layout === '33-66' && cardIndex === 0 ? "md:col-span-1" : "",
                    theme.classes.card
                  )}
                  style={{
                    backgroundColor: theme.colors.muted,
                    borderColor: `${theme.colors.border}40`,
                    borderRadius: themeConfig.layout.borderRadius.xl,
                    minHeight: '100%',
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
  )
}

