'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { updateCampaignStatus, createReferralCampaign } from '@/actions/referral-campaign'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlayIcon, PauseIcon, StopIcon, Edit02Icon } from '@hugeicons/core-free-icons'

interface CampaignStatusSectionProps {
  waitlistId: string
  waitlistSlug: string
  campaign: {
    id: string
    name: string
    status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED'
    settings: any
  } | null
}

const statusConfig = {
  DRAFT: { label: 'Draft', variant: 'secondary' as const, color: 'bg-zinc-100 text-zinc-700' },
  ACTIVE: { label: 'Active', variant: 'default' as const, color: 'bg-green-100 text-green-700' },
  PAUSED: { label: 'Paused', variant: 'outline' as const, color: 'bg-yellow-100 text-yellow-700' },
  ENDED: { label: 'Ended', variant: 'destructive' as const, color: 'bg-red-100 text-red-700' },
}

export function CampaignStatusSection({ waitlistId, waitlistSlug, campaign }: CampaignStatusSectionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [localStatus, setLocalStatus] = useState(campaign?.status || 'DRAFT')

  // Sync local status with campaign prop when it changes
  useEffect(() => {
    if (campaign) {
      setLocalStatus(campaign.status)
    }
  }, [campaign])

  const handleStatusChange = async (newStatus: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED') => {
    startTransition(async () => {
      try {
        if (!campaign) {
          // Create campaign if it doesn't exist
          const result = await createReferralCampaign({
            waitlistId,
            name: 'Default Campaign',
            settings: {
              referralsEnabled: true,
              leaderboardEnabled: true,
              maxWinners: null,
              scoringMode: 'POINTS',
              snapshotLeaderboard: false,
              allowSelfReferrals: false,
              requireEmailVerification: false,
              tieBreaker: 'EARLIEST_SIGNUP',
            },
          })

          if (result.success && result.campaign) {
            // Then update status
            const statusResult = await updateCampaignStatus(result.campaign.id, newStatus)
            if (statusResult.success) {
              setLocalStatus(newStatus)
              toast.success(`Campaign ${newStatus.toLowerCase()}`)
              router.refresh() // Refresh page to load new campaign data
            } else {
              toast.error(statusResult.error || 'Failed to update status')
            }
          } else {
            toast.error(result.error || 'Failed to create campaign')
          }
        } else {
          const result = await updateCampaignStatus(campaign.id, newStatus)
          if (result.success) {
            setLocalStatus(newStatus)
            toast.success(`Campaign ${newStatus.toLowerCase()}`)
            router.refresh() // Refresh page to load updated campaign data
          } else {
            toast.error(result.error || 'Failed to update status')
          }
        }
      } catch (error) {
        toast.error('An error occurred')
        console.error(error)
      }
    })
  }

  const currentStatus = campaign ? localStatus : 'DRAFT'
  const status = statusConfig[currentStatus]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Campaign Status</CardTitle>
            <CardDescription>
              {campaign ? campaign.name : 'No campaign created yet'}
            </CardDescription>
          </div>
          <Badge className={status.color}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {currentStatus !== 'ACTIVE' && (
            <Button
              onClick={() => handleStatusChange('ACTIVE')}
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <HugeiconsIcon icon={PlayIcon} className="w-4 h-4 mr-2" />
              Activate
            </Button>
          )}

          {currentStatus === 'ACTIVE' && (
            <Button
              onClick={() => handleStatusChange('PAUSED')}
              disabled={isPending}
              variant="outline"
              className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
            >
              <HugeiconsIcon icon={PauseIcon} className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}

          {currentStatus === 'PAUSED' && (
            <Button
              onClick={() => handleStatusChange('ACTIVE')}
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <HugeiconsIcon icon={PlayIcon} className="w-4 h-4 mr-2" />
              Resume
            </Button>
          )}

          {(currentStatus === 'ACTIVE' || currentStatus === 'PAUSED') && (
            <Button
              onClick={() => handleStatusChange('ENDED')}
              disabled={isPending}
              variant="outline"
              className="border-red-500 text-red-700 hover:bg-red-50"
            >
              <HugeiconsIcon icon={StopIcon} className="w-4 h-4 mr-2" />
              End Campaign
            </Button>
          )}

          {currentStatus === 'DRAFT' && campaign && (
            <Button
              onClick={() => handleStatusChange('ACTIVE')}
              disabled={isPending}
              variant="outline"
            >
              <HugeiconsIcon icon={Edit02Icon} className="w-4 h-4 mr-2" />
              Edit Settings
            </Button>
          )}
        </div>

        {currentStatus === 'ACTIVE' && (
          <p className="text-sm text-muted-foreground mt-4">
            This campaign is live. Subscribers are earning points and unlocking rewards.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

