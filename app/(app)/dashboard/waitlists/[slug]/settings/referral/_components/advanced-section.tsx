'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { adjustSubscriberPoints, createSnapshot } from '@/actions/advanced-operations'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Settings01Icon, CameraIcon } from '@hugeicons/core-free-icons'

interface AdvancedSectionProps {
  campaign: {
    id: string
    waitlistId: string
  }
  waitlistId: string
  waitlistSlug: string
}

export function AdvancedSection({ campaign, waitlistId, waitlistSlug }: AdvancedSectionProps) {
  const [isPending, startTransition] = useTransition()
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false)

  const handleManualAdjustment = async (subscriberId: string, points: number, reason: string) => {
    startTransition(async () => {
      const result = await adjustSubscriberPoints(
        waitlistId,
        campaign.id,
        subscriberId,
        points,
        reason
      )

      if (result.success) {
        toast.success('Points adjusted')
        setIsAdjustmentDialogOpen(false)
      } else {
        toast.error(result.error || 'Failed to adjust points')
      }
    })
  }

  const handleCreateSnapshot = async () => {
    if (!confirm('Create a snapshot of the current leaderboard? This cannot be undone.')) return

    startTransition(async () => {
      const result = await createSnapshot(waitlistId, true)

      if (result.success) {
        toast.success('Leaderboard snapshot created')
      } else {
        toast.error(result.error || 'Failed to create snapshot')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Settings01Icon} className="w-5 h-5" />
          <CardTitle>Advanced</CardTitle>
        </div>
        <CardDescription>
          Manual controls and administrative actions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Manual Point Adjustment */}
        <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <HugeiconsIcon icon={Settings01Icon} className="w-4 h-4 mr-2" />
              Manual Point Adjustment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Subscriber Points</DialogTitle>
            </DialogHeader>
            <PointAdjustmentForm
              onSubmit={(data) =>
                handleManualAdjustment(data.subscriberId, data.points, data.reason)
              }
              onCancel={() => setIsAdjustmentDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Create Snapshot */}
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleCreateSnapshot}
          disabled={isPending}
        >
          <HugeiconsIcon icon={CameraIcon} className="w-4 h-4 mr-2" />
          Create Leaderboard Snapshot
        </Button>

        <p className="text-sm text-muted-foreground">
          Snapshots create an immutable record of the leaderboard at a specific point in time.
        </p>
      </CardContent>
    </Card>
  )
}

function PointAdjustmentForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { subscriberId: string; points: number; reason: string }) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    subscriberId: '',
    points: '',
    reason: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      subscriberId: formData.subscriberId,
      points: parseInt(formData.points) || 0,
      reason: formData.reason,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="subscriberId">Subscriber ID</Label>
        <Input
          id="subscriberId"
          value={formData.subscriberId}
          onChange={(e) => setFormData({ ...formData, subscriberId: e.target.value })}
          placeholder="sub_abc123..."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="points">Points (can be negative)</Label>
        <Input
          id="points"
          type="number"
          value={formData.points}
          onChange={(e) => setFormData({ ...formData, points: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason</Label>
        <Textarea
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="e.g., Bonus for early supporter"
          required
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Apply Adjustment</Button>
      </div>
    </form>
  )
}

