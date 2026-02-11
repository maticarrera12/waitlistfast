'use client'

import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  PlusSignIcon,
  Delete02Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  FloppyDiskIcon,
  CloudUploadIcon,
  Image01Icon,
  Video01Icon,
} from '@hugeicons/core-free-icons'
import { saveTemplateConfig } from '@/actions/waitlist-template-config'
import {
  resolveMobileAppConfig,
  type MobileAppTemplateConfig,
  type MobileAppValuePropItem,
  type MobileAppFeaturePreviewItem,
} from '@/lib/waitlist/templates/mobile-app.config'

interface MobileAppEditorProps {
  waitlistId: string
  waitlistSlug: string
  storedConfig: Record<string, any> | null
}

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/waitlist/upload', { method: 'POST', body: formData })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data.url
}

export function MobileAppEditor({ waitlistId, waitlistSlug, storedConfig }: MobileAppEditorProps) {
  const router = useRouter()
  const resolved = resolveMobileAppConfig(storedConfig)
  const [config, setConfig] = useState<MobileAppTemplateConfig>(resolved)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const featureImageRefs = useRef<Record<number, HTMLInputElement | null>>({})

  // ─── Hero ───
  const updateHero = useCallback((field: string, value: any) => {
    setConfig((prev) => ({ ...prev, hero: { ...prev.hero, [field]: value } }))
  }, [])

  const handleImageUpload = useCallback(async (files: FileList) => {
    setIsUploading(true)
    try {
      const urls: string[] = []
      for (let i = 0; i < files.length; i++) {
        const url = await uploadFile(files[i])
        urls.push(url)
      }
      setConfig((prev) => ({
        ...prev,
        hero: {
          ...prev.hero,
          media: {
            ...prev.hero.media,
            images: [...prev.hero.media.images, ...urls],
          },
        },
      }))
      toast.success(`${urls.length} image(s) uploaded`)
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed')
    } finally {
      setIsUploading(false)
    }
  }, [])

  const removeHeroImage = useCallback((idx: number) => {
    setConfig((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        media: {
          ...prev.hero.media,
          images: prev.hero.media.images.filter((_, i) => i !== idx),
        },
      },
    }))
  }, [])

  const handleVideoUpload = useCallback(async (file: File) => {
    setIsUploading(true)
    try {
      const url = await uploadFile(file)
      setConfig((prev) => ({
        ...prev,
        hero: {
          ...prev.hero,
          media: { ...prev.hero.media, videoUrl: url },
        },
      }))
      toast.success('Video uploaded')
    } catch (err: any) {
      toast.error(err.message || 'Video upload failed')
    } finally {
      setIsUploading(false)
    }
  }, [])

  // ─── Value Props ───
  const addValueProp = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      valueProps: {
        items: [...prev.valueProps.items, { title: '', description: '', icon: '' }],
      },
    }))
  }, [])

  const updateValueProp = useCallback((idx: number, field: keyof MobileAppValuePropItem, value: string) => {
    setConfig((prev) => {
      const items = [...prev.valueProps.items]
      items[idx] = { ...items[idx], [field]: value }
      return { ...prev, valueProps: { items } }
    })
  }, [])

  const removeValueProp = useCallback((idx: number) => {
    setConfig((prev) => ({
      ...prev,
      valueProps: { items: prev.valueProps.items.filter((_, i) => i !== idx) },
    }))
  }, [])

  const moveValueProp = useCallback((idx: number, dir: 'up' | 'down') => {
    setConfig((prev) => {
      const items = [...prev.valueProps.items]
      const target = dir === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= items.length) return prev
      ;[items[idx], items[target]] = [items[target], items[idx]]
      return { ...prev, valueProps: { items } }
    })
  }, [])

  // ─── Feature Preview ───
  const addFeature = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      featurePreview: {
        items: [...prev.featurePreview.items, { title: '', description: '', image: '' }],
      },
    }))
  }, [])

  const updateFeature = useCallback((idx: number, field: keyof MobileAppFeaturePreviewItem, value: string) => {
    setConfig((prev) => {
      const items = [...prev.featurePreview.items]
      items[idx] = { ...items[idx], [field]: value }
      return { ...prev, featurePreview: { items } }
    })
  }, [])

  const removeFeature = useCallback((idx: number) => {
    setConfig((prev) => ({
      ...prev,
      featurePreview: { items: prev.featurePreview.items.filter((_, i) => i !== idx) },
    }))
  }, [])

  const moveFeature = useCallback((idx: number, dir: 'up' | 'down') => {
    setConfig((prev) => {
      const items = [...prev.featurePreview.items]
      const target = dir === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= items.length) return prev
      ;[items[idx], items[target]] = [items[target], items[idx]]
      return { ...prev, featurePreview: { items } }
    })
  }, [])

  const handleFeatureImageUpload = useCallback(async (idx: number, file: File) => {
    setIsUploading(true)
    try {
      const url = await uploadFile(file)
      updateFeature(idx, 'image', url)
      toast.success('Feature image uploaded')
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }, [updateFeature])

  // ─── Save ───
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await saveTemplateConfig(waitlistId, config as any, waitlistSlug)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Template configuration saved')
        router.refresh()
      }
    } catch {
      toast.error('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── HERO SECTION ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hero Section</CardTitle>
          <CardDescription>Configure the main hero area with images or video</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Hero Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={config.hero.type === 'gallery' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateHero('type', 'gallery')}
              >
                <HugeiconsIcon icon={Image01Icon} className="w-4 h-4 mr-1" />
                Gallery
              </Button>
              <Button
                type="button"
                variant={config.hero.type === 'video' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateHero('type', 'video')}
              >
                <HugeiconsIcon icon={Video01Icon} className="w-4 h-4 mr-1" />
                Video
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Headline</Label>
            <Input
              value={config.hero.headline}
              onChange={(e) => updateHero('headline', e.target.value)}
              placeholder="The App You've Been Waiting For"
            />
          </div>

          <div className="space-y-2">
            <Label>Subheadline</Label>
            <Textarea
              value={config.hero.subheadline}
              onChange={(e) => updateHero('subheadline', e.target.value)}
              placeholder="A short description..."
              className="min-h-[80px] resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label>CTA Text</Label>
            <Input
              value={config.hero.ctaText}
              onChange={(e) => updateHero('ctaText', e.target.value)}
              placeholder="Get Early Access"
            />
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Hero Images</Label>
            {config.hero.media.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {config.hero.media.images.map((url, idx) => (
                  <div key={idx} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Hero ${idx + 1}`}
                      className="w-full aspect-[9/16] object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => removeHeroImage(idx)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => imageInputRef.current?.click()}
              disabled={isUploading}
            >
              <HugeiconsIcon icon={CloudUploadIcon} className="w-4 h-4 mr-1" />
              {isUploading ? 'Uploading...' : 'Upload Images'}
            </Button>
          </div>

          {/* Video */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Video URL</Label>
            <div className="flex gap-2">
              <Input
                value={config.hero.media.videoUrl || ''}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    hero: {
                      ...prev.hero,
                      media: { ...prev.hero.media, videoUrl: e.target.value },
                    },
                  }))
                }
                placeholder="https://... or upload"
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => videoInputRef.current?.click()}
                disabled={isUploading}
              >
                <HugeiconsIcon icon={CloudUploadIcon} className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── VALUE PROPS ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Value Props</CardTitle>
          <CardDescription>Key benefits of your app — add, remove, or reorder</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Items ({config.valueProps.items.length})
            </Label>
            <Button type="button" variant="outline" size="sm" onClick={addValueProp}>
              <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {config.valueProps.items.map((item, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Item {idx + 1}
                </span>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => moveValueProp(idx, 'up')} disabled={idx === 0} className="h-7 w-7 p-0">
                    <HugeiconsIcon icon={ArrowUp01Icon} className="w-3.5 h-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => moveValueProp(idx, 'down')} disabled={idx === config.valueProps.items.length - 1} className="h-7 w-7 p-0">
                    <HugeiconsIcon icon={ArrowDown01Icon} className="w-3.5 h-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeValueProp(idx)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                    <HugeiconsIcon icon={Delete02Icon} className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Icon (emoji)</Label>
                  <Input value={item.icon || ''} onChange={(e) => updateValueProp(idx, 'icon', e.target.value)} placeholder="⚡" className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input value={item.title} onChange={(e) => updateValueProp(idx, 'title', e.target.value)} placeholder="Feature name" className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Input value={item.description || ''} onChange={(e) => updateValueProp(idx, 'description', e.target.value)} placeholder="Short desc..." className="h-9" />
                </div>
              </div>
            </div>
          ))}

          {config.valueProps.items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
              No value props yet. Click &quot;Add&quot; to create one.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ─── FEATURE PREVIEW ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Feature Preview</CardTitle>
          <CardDescription>Showcase features with images</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Features ({config.featurePreview.items.length})
            </Label>
            <Button type="button" variant="outline" size="sm" onClick={addFeature}>
              <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {config.featurePreview.items.map((item, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Feature {idx + 1}
                </span>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => moveFeature(idx, 'up')} disabled={idx === 0} className="h-7 w-7 p-0">
                    <HugeiconsIcon icon={ArrowUp01Icon} className="w-3.5 h-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => moveFeature(idx, 'down')} disabled={idx === config.featurePreview.items.length - 1} className="h-7 w-7 p-0">
                    <HugeiconsIcon icon={ArrowDown01Icon} className="w-3.5 h-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFeature(idx)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                    <HugeiconsIcon icon={Delete02Icon} className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input value={item.title} onChange={(e) => updateFeature(idx, 'title', e.target.value)} placeholder="Feature name" className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Input value={item.description || ''} onChange={(e) => updateFeature(idx, 'description', e.target.value)} placeholder="Short desc..." className="h-9" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Image</Label>
                <div className="flex gap-2 items-center">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.title} className="w-20 h-14 object-cover rounded border" />
                  )}
                  <input
                    ref={(el) => { featureImageRefs.current[idx] = el }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFeatureImageUpload(idx, e.target.files[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => featureImageRefs.current[idx]?.click()}
                    disabled={isUploading}
                  >
                    <HugeiconsIcon icon={CloudUploadIcon} className="w-4 h-4 mr-1" />
                    {item.image ? 'Replace' : 'Upload'}
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {config.featurePreview.items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
              No features yet. Click &quot;Add&quot; to create one.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ─── SOCIAL PROOF ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Social Proof</CardTitle>
          <CardDescription>Optional testimonial or trust statement</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={config.socialProof?.text || ''}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                socialProof: { text: e.target.value },
              }))
            }
            placeholder="Trusted by early adopters from companies like..."
            className="min-h-[80px] resize-y"
          />
        </CardContent>
      </Card>

      {/* ─── PLATFORM AVAILABILITY ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Platform Availability</CardTitle>
          <CardDescription>Toggle which platforms your app supports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>iOS (App Store)</Label>
            <Switch
              checked={config.platforms.ios}
              onCheckedChange={(checked) =>
                setConfig((prev) => ({
                  ...prev,
                  platforms: { ...prev.platforms, ios: checked },
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Android (Google Play)</Label>
            <Switch
              checked={config.platforms.android}
              onCheckedChange={(checked) =>
                setConfig((prev) => ({
                  ...prev,
                  platforms: { ...prev.platforms, android: checked },
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Launch text</Label>
            <Input
              value={config.platforms.text || ''}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  platforms: { ...prev.platforms, text: e.target.value },
                }))
              }
              placeholder="Launching Q2 2026"
            />
          </div>
        </CardContent>
      </Card>

      {/* ─── SAVE BUTTON ─── */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving || isUploading} size="lg">
          <HugeiconsIcon icon={FloppyDiskIcon} className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  )
}

