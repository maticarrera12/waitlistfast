'use client'

import { cn } from '@/lib/utils'
import { useTheme, getTheme, ThemeName } from '@/lib/themes'
import type { PointRuleModel } from '@/src/generated/models/PointRule'

interface PointRulesProps {
  pointRules: PointRuleModel[]
  themeName: ThemeName
}

export function PointRules({ pointRules, themeName }: PointRulesProps) {
  const theme = useTheme(themeName)
  const themeConfig = getTheme(themeName)

  if (pointRules.length === 0) {
    return null
  }

  return (
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
            </tr>
          </thead>
          <tbody>
            {pointRules.map((rule) => (
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
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

