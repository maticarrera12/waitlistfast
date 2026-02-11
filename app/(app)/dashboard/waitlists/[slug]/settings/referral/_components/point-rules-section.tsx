'use client'

import { useState, useTransition, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createPointRule, updatePointRule, deletePointRule, reorderPointRules } from '@/actions/point-rules'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlusSignIcon, Delete02Icon, Edit02Icon, ArrowUp01Icon, ArrowDown01Icon } from '@hugeicons/core-free-icons'

interface PointRule {
  id: string
  event: string
  points: number
  conditions: any
  name: string | null
  description: string | null
  isActive: boolean
  priority: number
}

interface PointRulesSectionProps {
  waitlistId: string
  waitlistSlug: string
  rules: PointRule[]
}

export function PointRulesSection({ waitlistId, waitlistSlug, rules: initialRules }: PointRulesSectionProps) {
  const [isPending, startTransition] = useTransition()
  const [rules, setRules] = useState(initialRules)
  const [editingRule, setEditingRule] = useState<PointRule | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Sync rules when props change (e.g., after page refresh)
  useEffect(() => {
    setRules(initialRules)
  }, [initialRules])

  const handleCreate = async (data: any) => {
    startTransition(async () => {
      const result = await createPointRule({
        waitlistId,
        ...data,
      })

      if (result.success && result.rule) {
        setRules([...rules, result.rule])
        setIsDialogOpen(false)
        toast.success('Rule created')
      } else {
        toast.error(result.error || 'Failed to create rule')
      }
    })
  }

  const handleUpdate = async (ruleId: string, data: any) => {
    startTransition(async () => {
      const result = await updatePointRule({
        ruleId,
        ...data,
      })

      if (result.success && result.rule) {
        setRules(rules.map((r) => (r.id === ruleId ? result.rule : r)))
        setEditingRule(null)
        setIsDialogOpen(false)
        toast.success('Rule updated')
      } else {
        toast.error(result.error || 'Failed to update rule')
      }
    })
  }

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return

    startTransition(async () => {
      const result = await deletePointRule(ruleId)

      if (result.success) {
        setRules(rules.filter((r) => r.id !== ruleId))
        toast.success('Rule deleted')
      } else {
        toast.error(result.error || 'Failed to delete rule')
      }
    })
  }

  const handleReorder = async (ruleId: string, direction: 'up' | 'down') => {
    const index = rules.findIndex((r) => r.id === ruleId)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= rules.length) return

    const newRules = [...rules]
    ;[newRules[index], newRules[newIndex]] = [newRules[newIndex], newRules[index]]

    // Optimistic update
    setRules(newRules)

    startTransition(async () => {
      const result = await reorderPointRules(newRules.map((r) => r.id))

      if (!result.success) {
        // Revert on error
        setRules(rules)
        toast.error(result.error || 'Failed to reorder rules')
      }
    })
  }

  const toggleActive = async (rule: PointRule) => {
    const newActive = !rule.isActive
    // Optimistic update
    setRules(rules.map((r) => (r.id === rule.id ? { ...r, isActive: newActive } : r)))

    startTransition(async () => {
      const result = await updatePointRule({
        ruleId: rule.id,
        isActive: newActive,
      })

      if (!result.success) {
        // Revert on error
        setRules(rules)
        toast.error(result.error || 'Failed to update rule')
      }
    })
  }

  const formatCondition = (conditions: any): string => {
    if (!conditions) return 'None'
    if (conditions.firstReferralOnly) return 'First referral only'
    if (conditions.referralCount) {
      const ref = conditions.referralCount
      if (ref.equals) return `Exactly ${ref.equals} referrals`
      if (ref.gte) return `${ref.gte}+ referrals`
      if (ref.lte) return `${ref.lte} or fewer referrals`
    }
    return JSON.stringify(conditions)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Point Rules Engine</CardTitle>
            <CardDescription>
              Configure how points are awarded for different events
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingRule(null)}>
                <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingRule ? 'Edit Rule' : 'Create Rule'}</DialogTitle>
              </DialogHeader>
              <PointRuleForm
                rule={editingRule}
                onSubmit={(data) => {
                  if (editingRule) {
                    handleUpdate(editingRule.id, data)
                  } else {
                    handleCreate(data)
                  }
                }}
                onCancel={() => {
                  setEditingRule(null)
                  setIsDialogOpen(false)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No rules configured. Create your first rule to start awarding points.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Priority</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-[80px]">Active</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule, index) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleReorder(rule.id, 'up')}
                        disabled={index === 0 || isPending}
                      >
                        <HugeiconsIcon icon={ArrowUp01Icon} className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleReorder(rule.id, 'down')}
                        disabled={index === rules.length - 1 || isPending}
                      >
                        <HugeiconsIcon icon={ArrowDown01Icon} className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{rule.event}</Badge>
                  </TableCell>
                  <TableCell className="font-mono font-semibold">
                    {rule.points > 0 ? '+' : ''}
                    {rule.points}
                  </TableCell>
                  <TableCell>{rule.name || '-'}</TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={() => toggleActive(rule)}
                      disabled={isPending}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingRule(rule)
                          setIsDialogOpen(true)
                        }}
                      >
                        <HugeiconsIcon icon={Edit02Icon} className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rule.id)}
                        disabled={isPending}
                      >
                        <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

// Point Rule Form Component
function PointRuleForm({
  rule,
  onSubmit,
  onCancel,
}: {
  rule: PointRule | null
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    event: rule?.event || 'REFERRAL_CONFIRMED',
    points: rule?.points || 10,
    name: rule?.name || '',
    description: rule?.description || '',
    isActive: rule?.isActive ?? true,
    priority: rule?.priority || 0,
    conditionType: rule?.conditions?.firstReferralOnly
      ? 'firstReferralOnly'
      : rule?.conditions?.referralCount
        ? 'referralCount'
        : 'none',
    referralCountValue: rule?.conditions?.referralCount?.equals || '',
    referralCountOp: rule?.conditions?.referralCount?.gte
      ? 'gte'
      : rule?.conditions?.referralCount?.equals
        ? 'equals'
        : 'equals',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let conditions: any = null
    if (formData.conditionType === 'firstReferralOnly') {
      conditions = { firstReferralOnly: true }
    } else if (formData.conditionType === 'referralCount' && formData.referralCountValue) {
      conditions = {
        referralCount: {
          [formData.referralCountOp]: parseInt(formData.referralCountValue),
        },
      }
    }

    onSubmit({
      event: formData.event,
      points: formData.points,
      name: formData.name || null,
      description: formData.description || null,
      isActive: formData.isActive,
      priority: formData.priority,
      conditions,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="event">Event</Label>
        <Select
          value={formData.event}
          onValueChange={(value) => setFormData({ ...formData, event: value })}
        >
          <SelectTrigger id="event">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SIGNUP">Signup</SelectItem>
            <SelectItem value="REFERRAL_CONFIRMED">Referral Confirmed</SelectItem>
            <SelectItem value="EMAIL_VERIFIED">Email Verified</SelectItem>
            <SelectItem value="MILESTONE">Milestone</SelectItem>
            <SelectItem value="MANUAL">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="points">Points</Label>
        <Input
          id="points"
          type="number"
          value={formData.points}
          onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="condition">Condition</Label>
        <Select
          value={formData.conditionType}
          onValueChange={(value) => setFormData({ ...formData, conditionType: value })}
        >
          <SelectTrigger id="condition">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="firstReferralOnly">First Referral Only</SelectItem>
            <SelectItem value="referralCount">Referral Count</SelectItem>
          </SelectContent>
        </Select>

        {formData.conditionType === 'referralCount' && (
          <div className="flex gap-2 mt-2">
            <Select
              value={formData.referralCountOp}
              onValueChange={(value) => setFormData({ ...formData, referralCountOp: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Exactly</SelectItem>
                <SelectItem value="gte">At least</SelectItem>
                <SelectItem value="lte">At most</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="5"
              value={formData.referralCountValue}
              onChange={(e) => setFormData({ ...formData, referralCountValue: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name (optional)</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., First Referral Bonus"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe this rule..."
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label>Active</Label>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </div>
    </form>
  )
}

