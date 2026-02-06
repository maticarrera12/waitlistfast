'use client'

import { useState, useTransition, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createReward, updateReward, deleteReward } from '@/actions/rewards'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlusSignIcon, Delete01Icon, Edit02Icon, Award01Icon } from '@hugeicons/core-free-icons'

interface Reward {
  id: string
  name: string
  description: string | null
  type: string
  distributionRule: string
  ruleParams: any
  payload: any
  maxRecipients: number | null
  _count: { subscriberRewards: number }
}

interface RewardsSectionProps {
  campaignId: string
  waitlistSlug: string
  rewards: Reward[]
}

export function RewardsSection({ campaignId, waitlistSlug, rewards: initialRewards }: RewardsSectionProps) {
  const [isPending, startTransition] = useTransition()
  const [rewards, setRewards] = useState(initialRewards)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Sync rewards when props change (e.g., after page refresh)
  useEffect(() => {
    setRewards(initialRewards)
  }, [initialRewards])

  const handleCreate = async (data: any) => {
    startTransition(async () => {
      const result = await createReward({
        campaignId,
        ...data,
      })

      if (result.success && result.reward) {
        setRewards([...rewards, { ...result.reward, _count: { subscriberRewards: 0 } }])
        setIsDialogOpen(false)
        toast.success('Reward created')
      } else {
        toast.error(result.error || 'Failed to create reward')
      }
    })
  }

  const handleUpdate = async (rewardId: string, data: any) => {
    startTransition(async () => {
      const result = await updateReward({
        rewardId,
        ...data,
      })

      if (result.success && result.reward) {
        setRewards(rewards.map((r) => (r.id === rewardId ? { ...result.reward, _count: r._count } : r)))
        setEditingReward(null)
        setIsDialogOpen(false)
        toast.success('Reward updated')
      } else {
        toast.error(result.error || 'Failed to update reward')
      }
    })
  }

  const handleDelete = async (rewardId: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) return

    startTransition(async () => {
      const result = await deleteReward(rewardId)

      if (result.success) {
        setRewards(rewards.filter((r) => r.id !== rewardId))
        toast.success('Reward deleted')
      } else {
        toast.error(result.error || 'Failed to delete reward')
      }
    })
  }

  const formatRuleParams = (rule: string, params: any): string => {
    if (rule === 'TOP_N') return `Top ${params.topN}`
    if (rule === 'MIN_SCORE') return `Score ≥ ${params.minScore}`
    if (rule === 'MIN_REFERRALS') return `${params.minReferrals}+ referrals`
    return 'Manual'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Rewards Configuration</CardTitle>
            <CardDescription>
              Define rewards that subscribers can unlock based on their performance
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingReward(null)}>
                <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 mr-2" />
                Add Reward
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingReward ? 'Edit Reward' : 'Create Reward'}</DialogTitle>
              </DialogHeader>
              <RewardForm
                reward={editingReward}
                onSubmit={(data) => {
                  if (editingReward) {
                    handleUpdate(editingReward.id, data)
                  } else {
                    handleCreate(data)
                  }
                }}
                onCancel={() => {
                  setEditingReward(null)
                  setIsDialogOpen(false)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {rewards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No rewards configured. Create rewards to incentivize referrals.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rewards.map((reward) => (
              <Card key={reward.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <HugeiconsIcon icon={Award01Icon} className="w-5 h-5" />
                        {reward.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {formatRuleParams(reward.distributionRule, reward.ruleParams)}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{reward.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {reward.description && (
                    <p className="text-sm text-muted-foreground mb-4">{reward.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {reward._count.subscriberRewards} assigned
                      {reward.maxRecipients && ` / ${reward.maxRecipients} max`}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingReward(reward)
                          setIsDialogOpen(true)
                        }}
                      >
                        <HugeiconsIcon icon={Edit02Icon} className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(reward.id)}
                        disabled={isPending}
                      >
                        <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RewardForm({
  reward,
  onSubmit,
  onCancel,
}: {
  reward: Reward | null
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: reward?.name || '',
    description: reward?.description || '',
    type: reward?.type || 'FEATURE',
    distributionRule: reward?.distributionRule || 'TOP_N',
    topN: reward?.ruleParams?.topN || 10,
    minScore: reward?.ruleParams?.minScore || '',
    minReferrals: reward?.ruleParams?.minReferrals || '',
    maxRecipients: reward?.maxRecipients || '',
    payloadJson: JSON.stringify(reward?.payload || {}, null, 2),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let ruleParams: any = {}
    if (formData.distributionRule === 'TOP_N') {
      ruleParams = { topN: parseInt(formData.topN.toString()) }
    } else if (formData.distributionRule === 'MIN_SCORE') {
      ruleParams = { minScore: parseInt(formData.minScore.toString()) }
    } else if (formData.distributionRule === 'MIN_REFERRALS') {
      ruleParams = { minReferrals: parseInt(formData.minReferrals.toString()) }
    }

    let payload: any = {}
    try {
      payload = JSON.parse(formData.payloadJson)
    } catch {
      toast.error('Invalid JSON in payload')
      return
    }

    onSubmit({
      name: formData.name,
      description: formData.description || null,
      type: formData.type,
      distributionRule: formData.distributionRule,
      ruleParams,
      payload,
      maxRecipients: formData.maxRecipients ? parseInt(formData.maxRecipients.toString()) : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Reward Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Reward Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FEATURE">Feature</SelectItem>
              <SelectItem value="ACCESS">Access</SelectItem>
              <SelectItem value="DISCOUNT">Discount</SelectItem>
              <SelectItem value="CUSTOM">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="distribution">Distribution Rule</Label>
          <Select
            value={formData.distributionRule}
            onValueChange={(value) => setFormData({ ...formData, distributionRule: value })}
          >
            <SelectTrigger id="distribution">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TOP_N">Top N</SelectItem>
              <SelectItem value="MIN_SCORE">Min Score</SelectItem>
              <SelectItem value="MIN_REFERRALS">Min Referrals</SelectItem>
              <SelectItem value="MANUAL">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.distributionRule === 'TOP_N' && (
        <div className="space-y-2">
          <Label htmlFor="topN">Top N</Label>
          <Input
            id="topN"
            type="number"
            min="1"
            value={formData.topN}
            onChange={(e) => setFormData({ ...formData, topN: parseInt(e.target.value) || 10 })}
            required
          />
        </div>
      )}

      {formData.distributionRule === 'MIN_SCORE' && (
        <div className="space-y-2">
          <Label htmlFor="minScore">Minimum Score</Label>
          <Input
            id="minScore"
            type="number"
            min="0"
            value={formData.minScore}
            onChange={(e) => setFormData({ ...formData, minScore: e.target.value })}
            required
          />
        </div>
      )}

      {formData.distributionRule === 'MIN_REFERRALS' && (
        <div className="space-y-2">
          <Label htmlFor="minReferrals">Minimum Referrals</Label>
          <Input
            id="minReferrals"
            type="number"
            min="1"
            value={formData.minReferrals}
            onChange={(e) => setFormData({ ...formData, minReferrals: e.target.value })}
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="maxRecipients">Max Recipients (optional)</Label>
        <Input
          id="maxRecipients"
          type="number"
          min="1"
          value={formData.maxRecipients}
          onChange={(e) => setFormData({ ...formData, maxRecipients: e.target.value })}
          placeholder="Unlimited"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="payload">Payload (JSON)</Label>
        <Textarea
          id="payload"
          value={formData.payloadJson}
          onChange={(e) => setFormData({ ...formData, payloadJson: e.target.value })}
          className="font-mono text-sm"
          rows={6}
          required
        />
        <p className="text-xs text-muted-foreground">
          JSON payload for this reward (e.g., {`{"couponCode": "EARLY50"}`})
        </p>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}

