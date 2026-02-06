'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { updateReferralCampaign } from '@/actions/referral-campaign'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle03Icon } from '@hugeicons/core-free-icons'

interface CoreRulesSectionProps {
  campaign: {
    id: string
    settings: any
  }
  waitlistSlug: string
}

export function CoreRulesSection({ campaign, waitlistSlug }: CoreRulesSectionProps) {
  const [isPending, startTransition] = useTransition()
  const [settings, setSettings] = useState(campaign.settings || {
    referralsEnabled: true,
    leaderboardEnabled: true,
    maxWinners: null,
    scoringMode: 'POINTS',
    snapshotLeaderboard: false,
    allowSelfReferrals: false,
    requireEmailVerification: false,
    tieBreaker: 'EARLIEST_SIGNUP',
  })

  const handleUpdate = async () => {
    startTransition(async () => {
      const result = await updateReferralCampaign({
        campaignId: campaign.id,
        settings,
      })

      if (result.success) {
        toast.success('Settings updated')
      } else {
        toast.error(result.error || 'Failed to update settings')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Core Rules</CardTitle>
        <CardDescription>
          Configure the fundamental behavior of your referral campaign
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Referrals */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="referrals-enabled">Enable Referrals</Label>
            <p className="text-sm text-muted-foreground">
              Allow subscribers to refer others and earn points
            </p>
          </div>
          <Switch
            id="referrals-enabled"
            checked={settings.referralsEnabled}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, referralsEnabled: checked })
            }
          />
        </div>

        {/* Enable Leaderboard */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="leaderboard-enabled">Enable Leaderboard</Label>
            <p className="text-sm text-muted-foreground">
              Show ranked leaderboard to subscribers
            </p>
          </div>
          <Switch
            id="leaderboard-enabled"
            checked={settings.leaderboardEnabled}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, leaderboardEnabled: checked })
            }
          />
        </div>

        {/* Scoring Mode */}
        <div className="space-y-2">
          <Label htmlFor="scoring-mode">Scoring Mode</Label>
          <Select
            value={settings.scoringMode}
            onValueChange={(value: 'POINTS' | 'REFERRALS_ONLY') =>
              setSettings({ ...settings, scoringMode: value })
            }
          >
            <SelectTrigger id="scoring-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="POINTS">Points-based (flexible scoring)</SelectItem>
              <SelectItem value="REFERRALS_ONLY">Referrals only (count-based)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {settings.scoringMode === 'POINTS'
              ? 'Subscribers earn points based on configured rules'
              : 'Leaderboard ranks by referral count only'}
          </p>
        </div>

        {/* Max Winners */}
        <div className="space-y-2">
          <Label htmlFor="max-winners">Max Winners (optional)</Label>
          <Input
            id="max-winners"
            type="number"
            min="1"
            placeholder="Unlimited"
            value={settings.maxWinners || ''}
            onChange={(e) =>
              setSettings({
                ...settings,
                maxWinners: e.target.value ? parseInt(e.target.value) : null,
              })
            }
          />
          <p className="text-sm text-muted-foreground">
            Limit the number of winners shown on leaderboard (leave empty for unlimited)
          </p>
        </div>

        {/* Tie Breaker */}
        <div className="space-y-2">
          <Label htmlFor="tie-breaker">Tie Breaker</Label>
          <Select
            value={settings.tieBreaker}
            onValueChange={(value: 'EARLIEST_SIGNUP' | 'LATEST_SIGNUP') =>
              setSettings({ ...settings, tieBreaker: value })
            }
          >
            <SelectTrigger id="tie-breaker">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EARLIEST_SIGNUP">Earliest signup wins</SelectItem>
              <SelectItem value="LATEST_SIGNUP">Latest signup wins</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            When scores are tied, this determines the ranking
          </p>
        </div>

        {/* Require Email Verification */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="require-verification">Require Email Verification</Label>
            <p className="text-sm text-muted-foreground">
              Only verified emails can participate in referrals
            </p>
          </div>
          <Switch
            id="require-verification"
            checked={settings.requireEmailVerification}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, requireEmailVerification: checked })
            }
          />
        </div>

        {/* Snapshot Leaderboard */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="snapshot-leaderboard">Snapshot Leaderboard</Label>
            <p className="text-sm text-muted-foreground">
              Create immutable snapshot at campaign end
            </p>
          </div>
          <Switch
            id="snapshot-leaderboard"
            checked={settings.snapshotLeaderboard}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, snapshotLeaderboard: checked })
            }
          />
        </div>

        {/* Save Button */}
        <Button onClick={handleUpdate} disabled={isPending} className="w-full">
          <HugeiconsIcon icon={CheckmarkCircle03Icon} className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </CardContent>
    </Card>
  )
}

