'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  PlusSignIcon,
  Delete02Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  FloppyDiskIcon,
} from '@hugeicons/core-free-icons'
import { saveWaitlistContent } from '@/actions/waitlist-content'
import { resolveContent } from '@/lib/waitlist/content-resolver'
import type { TemplateContentSchema, SectionSchema } from '@/lib/waitlist/templates/saas-minimal.schema'

interface ContentEditorProps {
  waitlistId: string
  waitlistSlug: string
  templateKey: string
  storedContent: Record<string, any> | null
  schema: TemplateContentSchema
}

export function ContentEditor({
  waitlistId,
  waitlistSlug,
  templateKey,
  storedContent,
  schema,
}: ContentEditorProps) {
  const router = useRouter()
  const resolved = resolveContent(templateKey, storedContent)
  const [content, setContent] = useState<Record<string, any>>(resolved)
  const [isSaving, setIsSaving] = useState(false)

  const updateField = useCallback((sectionKey: string, fieldKey: string, value: string) => {
    setContent((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [fieldKey]: value,
      },
    }))
  }, [])

  const updateItemField = useCallback(
    (sectionKey: string, index: number, fieldKey: string, value: string) => {
      setContent((prev) => {
        const section = { ...prev[sectionKey] }
        const items = [...(section.items || [])]
        items[index] = { ...items[index], [fieldKey]: value }
        return { ...prev, [sectionKey]: { ...section, items } }
      })
    },
    []
  )

  const addItem = useCallback((sectionKey: string, sectionSchema: SectionSchema) => {
    setContent((prev) => {
      const section = { ...prev[sectionKey] }
      const items = [...(section.items || [])]
      if (sectionSchema.maxItems && items.length >= sectionSchema.maxItems) {
        toast.error(`Maximum ${sectionSchema.maxItems} items allowed`)
        return prev
      }
      const newItem: Record<string, string> = {}
      if (sectionSchema.itemFields) {
        for (const key of Object.keys(sectionSchema.itemFields)) {
          newItem[key] = ''
        }
      }
      items.push(newItem)
      return { ...prev, [sectionKey]: { ...section, items } }
    })
  }, [])

  const removeItem = useCallback((sectionKey: string, index: number) => {
    setContent((prev) => {
      const section = { ...prev[sectionKey] }
      const items = [...(section.items || [])]
      items.splice(index, 1)
      return { ...prev, [sectionKey]: { ...section, items } }
    })
  }, [])

  const moveItem = useCallback((sectionKey: string, index: number, direction: 'up' | 'down') => {
    setContent((prev) => {
      const section = { ...prev[sectionKey] }
      const items = [...(section.items || [])]
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= items.length) return prev
      ;[items[index], items[target]] = [items[target], items[index]]
      return { ...prev, [sectionKey]: { ...section, items } }
    })
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await saveWaitlistContent(waitlistId, content, waitlistSlug)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Content saved successfully')
        router.refresh()
      }
    } catch {
      toast.error('Failed to save content')
    } finally {
      setIsSaving(false)
    }
  }

  const sectionKeys = Object.keys(schema)

  return (
    <div className="space-y-6">
      {sectionKeys.map((sectionKey) => {
        const sectionSchema = schema[sectionKey]
        const sectionContent = content[sectionKey] || {}

        return (
          <Card key={sectionKey}>
            <CardHeader>
              <CardTitle className="text-lg">{sectionSchema.label}</CardTitle>
              <CardDescription>
                {sectionSchema.repeatable
                  ? `Editable cards — add, remove, or reorder ${sectionSchema.itemLabel?.toLowerCase() || 'item'}s`
                  : 'Edit the text content for this section'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Static fields */}
              {sectionSchema.fields &&
                Object.entries(sectionSchema.fields).map(([fieldKey, fieldDef]) => (
                  <div key={fieldKey} className="space-y-2">
                    <Label htmlFor={`${sectionKey}-${fieldKey}`} className="text-sm font-medium">
                      {fieldDef.label}
                    </Label>
                    {fieldDef.type === 'text' ? (
                      <Textarea
                        id={`${sectionKey}-${fieldKey}`}
                        value={sectionContent[fieldKey] || ''}
                        onChange={(e) => updateField(sectionKey, fieldKey, e.target.value)}
                        placeholder={fieldDef.placeholder}
                        className="min-h-[100px] resize-y"
                      />
                    ) : (
                      <Input
                        id={`${sectionKey}-${fieldKey}`}
                        value={sectionContent[fieldKey] || ''}
                        onChange={(e) => updateField(sectionKey, fieldKey, e.target.value)}
                        placeholder={fieldDef.placeholder}
                      />
                    )}
                  </div>
                ))}

              {/* Repeatable items */}
              {sectionSchema.repeatable && sectionSchema.itemFields && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {sectionSchema.itemLabel || 'Item'}s ({(sectionContent.items || []).length}
                      {sectionSchema.maxItems ? ` / ${sectionSchema.maxItems}` : ''})
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addItem(sectionKey, sectionSchema)}
                      disabled={
                        sectionSchema.maxItems
                          ? (sectionContent.items || []).length >= sectionSchema.maxItems
                          : false
                      }
                    >
                      <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 mr-1" />
                      Add {sectionSchema.itemLabel || 'Item'}
                    </Button>
                  </div>

                  {(sectionContent.items || []).map((item: Record<string, any>, index: number) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-3 bg-muted/30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {sectionSchema.itemLabel || 'Item'} {index + 1}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveItem(sectionKey, index, 'up')}
                            disabled={index === 0}
                            className="h-7 w-7 p-0"
                          >
                            <HugeiconsIcon icon={ArrowUp01Icon} className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveItem(sectionKey, index, 'down')}
                            disabled={index === (sectionContent.items || []).length - 1}
                            className="h-7 w-7 p-0"
                          >
                            <HugeiconsIcon icon={ArrowDown01Icon} className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(sectionKey, index)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <HugeiconsIcon icon={Delete02Icon} className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(sectionSchema.itemFields!).map(([fieldKey, fieldDef]) => (
                          <div key={fieldKey} className="space-y-1">
                            <Label className="text-xs text-muted-foreground">{fieldDef.label}</Label>
                            <Input
                              value={item[fieldKey] || ''}
                              onChange={(e) =>
                                updateItemField(sectionKey, index, fieldKey, e.target.value)
                              }
                              placeholder={fieldDef.placeholder}
                              className="h-9"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {(sectionContent.items || []).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                      No {sectionSchema.itemLabel?.toLowerCase() || 'item'}s yet. Click &quot;Add&quot; to create one.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <HugeiconsIcon icon={FloppyDiskIcon} className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Content'}
        </Button>
      </div>
    </div>
  )
}

