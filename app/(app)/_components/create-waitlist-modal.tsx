'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Rocket, Smartphone, Laptop, GraduationCap, 
  ShoppingBag, Gamepad2, ChevronRight, Check, Sparkles 
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { cn } from '@/lib/utils'
import { createWaitlist } from '@/actions/create-waitlist'
import { toast } from 'sonner'
import { ThemeName, getAllThemes, getTheme } from '@/lib/themes'
import { useTheme } from '@/lib/themes'

// --- SCHEMAS ---
const formSchema = z.object({
  templateKey: z.enum(['saas-minimal', 'startup-minimal', 'mobile-app']),
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(3, "Slug must be at least 3 chars").regex(/^[a-z0-9-]+$/, "Lowercase, numbers and dashes only"),
  description: z.string().optional(),
  theme: z.enum(['default', 'linear', 'stripe', 'notion', 'apple', 'brutalist', 'webflow']).default('default'),
})

type FormValues = z.infer<typeof formSchema>

interface CreateWaitlistModalProps {
  trigger?: React.ReactNode;
}

// --- TEMPLATE OPTIONS FOR STEP 1 ---
const TEMPLATE_OPTIONS = [
  { 
    id: 'saas-minimal' as const, 
    label: 'SaaS Validation Waitlist', 
    icon: Laptop, 
    desc: 'Problem-solution focused with hero, why join, problem, solution, early access, and CTA',
    emoji: '📋'
  },
  { 
    id: 'startup-minimal' as const, 
    label: 'Startup Minimal', 
    icon: Rocket, 
    desc: 'Clean and simple with hero, how it works, and CTA',
    emoji: '✨'
  },
  { 
    id: 'mobile-app' as const, 
    label: 'Mobile App', 
    icon: Smartphone, 
    desc: 'App-focused with hero, preview, and download CTA',
    emoji: '📱'
  },
]

// Theme options with metadata
const THEME_OPTIONS = [
  { 
    id: 'default' as ThemeName, 
    icon: '🎨', 
    name: 'Default', 
    description: 'Uses your app theme - Matches your brand',
    emoji: '🎨'
  },
  { 
    id: 'linear' as ThemeName, 
    icon: '⚪️', 
    name: 'Linear', 
    description: 'Minimal Tech - Ultra clean, much whitespace',
    emoji: '⚪️'
  },
  { 
    id: 'stripe' as ThemeName, 
    icon: '💜', 
    name: 'Stripe', 
    description: 'Premium Bold - Gradients, purple/blue',
    emoji: '💜'
  },
  { 
    id: 'notion' as ThemeName, 
    icon: '📝', 
    name: 'Notion', 
    description: 'Playful & Warm - Beige/cream, rounded',
    emoji: '📝'
  },
  { 
    id: 'apple' as ThemeName, 
    icon: '🍎', 
    name: 'Apple', 
    description: 'Luxury Minimal - Black, white, one accent',
    emoji: '🍎'
  },
  { 
    id: 'brutalist' as ThemeName, 
    icon: '⚫', 
    name: 'Brutalist', 
    description: 'Raw & Edgy - Hard borders, high contrast',
    emoji: '⚫'
  },
  { 
    id: 'webflow' as ThemeName, 
    icon: '✨', 
    name: 'Webflow', 
    description: 'Modern Agency - Glass morphism, gradients',
    emoji: '✨'
  },
]

export function CreateWaitlistModal({ trigger }: CreateWaitlistModalProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      templateKey: 'saas-minimal' as 'saas-minimal' | 'startup-minimal' | 'mobile-app',
      name: '',
      slug: '',
      description: '',
      theme: 'default' as ThemeName,
    },
    mode: 'onChange'
  })

  // Watch values for Live Preview
  const watchedValues = useWatch({ control: form.control })

  // Navigation Logic
  const nextStep = async () => {
    let valid = false
    if (step === 1) valid = await form.trigger('templateKey')
    if (step === 2) valid = await form.trigger(['name', 'slug', 'description'])
    if (step === 3) valid = await form.trigger('theme')
    
    if (valid) setStep((s) => s + 1)
  }

  const prevStep = () => setStep((s) => s - 1)

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      console.log('Submitting form data:', data)
      const result = await createWaitlist(data)
      
      console.log('Result from createWaitlist:', result)
      
      // Si hay error, la acción retorna { error: string }
      if (result?.error) {
        console.error('Error from server:', result.error)
        toast.error(result.error)
        setIsSubmitting(false)
        return
      }
      
      // Si hay éxito, redirigir al subdominio
      if (result?.success && result?.subdomainUrl) {
        toast.success('Waitlist created successfully!')
        setOpen(false)
        form.reset()
        setStep(1)
        // Redirigir al subdominio
        window.location.href = result.subdomainUrl
        return
      }
      
      // Fallback: si no hay subdomainUrl, redirigir al dashboard
      toast.success('Waitlist created successfully!')
      setOpen(false)
      form.reset()
      setStep(1)
    } catch (error) {
      // El redirect puede lanzar un error de Next.js, lo ignoramos
      if (error && typeof error === 'object' && 'digest' in error) {
        // Es un redirect de Next.js, está bien
        console.log('Redirect detected, closing modal')
        setOpen(false)
        form.reset()
        setStep(1)
        return
      }
      console.error('Error creating waitlist:', error)
      toast.error('Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  // --- SUB-COMPONENTS (Local for simplicity) ---

  // Component: Desktop Preview with Real Theme System
  const LivePreview = () => {
    const themeName = (watchedValues.theme || 'linear') as ThemeName
    const theme = useTheme(themeName)
    const themeConfig = getTheme(themeName)

    return (
      <div className="relative mx-auto w-full h-full max-w-[600px] max-h-[500px] rounded-none border-2 border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl ring-1 ring-white/10">
        {/* Browser Chrome */}
        <div className="h-8 bg-zinc-800 border-b border-zinc-700 flex items-center px-3 gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
          </div>
          <div className="flex-1 h-5 bg-zinc-900/50 rounded text-[10px] flex items-center px-2 text-zinc-500 font-mono">
            waitlistfast.com/w/{watchedValues.slug || 'your-slug'}
          </div>
        </div>

        {/* Dynamic Content with Real Theme - Fixed Height with Scroll */}
        <div 
          className={cn(
            "h-[calc(100%-2rem)] w-full flex flex-col items-center justify-start text-center transition-all duration-500 overflow-y-auto",
            theme.classes.container
          )}
          style={theme.styles}
        >
          {/* Content Container - Fixed max-width, centered */}
          <div className="w-full max-w-2xl px-8 py-12 flex flex-col items-center justify-start min-h-full">
            {/* Fake Logo with theme-aware styling */}
            <div 
              className="mb-8 h-16 w-16 flex items-center justify-center text-2xl font-bold transition-all duration-300 shrink-0"
              style={{ 
                backgroundColor: theme.colors.muted,
                borderColor: theme.colors.border,
                borderWidth: '1px',
                borderRadius: themeConfig.layout.borderRadius.lg
              }}
            >
              🚀
            </div>

            <h2 
              className={cn(
                "text-4xl font-bold mb-4 leading-tight transition-all duration-300 shrink-0",
                theme.classes.heading
              )}
              style={{ fontSize: themeConfig.typography.fontSize['4xl'] }}
            >
              {watchedValues.name || "Your Project Name"}
            </h2>
            
            {/* Description with fixed max-height and scroll */}
            <div className="w-full max-h-24 overflow-y-auto mb-8 shrink-0">
              <p 
                className={cn(
                  "text-base opacity-80 leading-relaxed transition-all duration-300",
                  theme.classes.body
                )}
                style={{ fontSize: themeConfig.typography.fontSize.base }}
              >
                {watchedValues.description || "We are building something amazing. Join the waitlist to get early access."}
              </p>
            </div>

            {/* Form Section - Fixed at bottom */}
            <div className="w-full max-w-md space-y-4 mt-auto shrink-0">
               {/* Subscriber Count */}
               <div className="flex items-center justify-center gap-2 mb-4">
                 <span 
                   className="text-2xl font-bold transition-all duration-300"
                   style={{ 
                     color: theme.colors.accent,
                     fontSize: themeConfig.typography.fontSize['2xl']
                   }}
                 >
                   2,492
                 </span>
                 <span 
                   className={cn(
                     "text-base transition-all duration-300",
                     theme.classes.body
                   )}
                   style={{ 
                     fontSize: themeConfig.typography.fontSize.base,
                     opacity: 0.8
                   }}
                 >
                   people waiting
                 </span>
               </div>

               {/* Input Preview */}
               <div 
                 className={cn(
                   "h-12 w-full flex items-center px-4 transition-all duration-300",
                   theme.classes.input
                 )}
                 style={{ 
                   opacity: 0.6,
                   fontSize: themeConfig.typography.fontSize.sm
                 }}
               >
                  your@email.com
               </div>
               
               {/* Button Preview */}
               <div 
                 className={cn(
                   "h-12 w-full flex items-center justify-center text-base font-bold shadow-lg transition-all duration-300",
                   theme.classes.buttonPrimary
                 )}
                 style={{ 
                   fontSize: themeConfig.typography.fontSize.base,
                   borderRadius: themeConfig.layout.borderRadius.lg
                 }}
               >
                  JOIN WAITLIST
               </div>
               
               <p 
                 className={cn(
                   "text-xs mt-2 transition-all duration-300",
                   theme.classes.body
                 )}
                 style={{ 
                   fontSize: themeConfig.typography.fontSize.xs,
                   opacity: 0.7
                 }}
               >
                 Join thousands waiting. Unsubscribe anytime.
               </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/80 font-bold">
            Create New Waitlist
          </Button>
        )}
      </DialogTrigger>
      
      {/* Increased max-width for the split view */}
      <DialogContent className="sm:max-w-[900px] bg-zinc-950 text-white border-zinc-800 p-0 overflow-hidden gap-0 rounded-none">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {step === 1 ? "Choose Template" : step === 2 ? "Configure Waitlist Identity" : "Visualize Your Waitlist"}
          </DialogTitle>
        </DialogHeader>
        
        {/* HEADER */}
        <div className="p-6 pb-0 border-b border-zinc-800 bg-zinc-950">
           <div className="mb-4">
              <span className="text-zinc-400 text-sm font-medium tracking-wide">
                 {step === 1 ? "CHOOSE TEMPLATE" : step === 2 ? "CONFIGURE IDENTITY" : "VISUALIZE"}
              </span>
           </div>
        </div>
        
        {/* Progress Bar - 3 Steps (at the border, full width) */}
        <div className="w-full h-1 bg-zinc-800 flex">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-full transition-all duration-300",
                i <= step
                  ? "bg-primary"
                  : "bg-transparent"
              )}
              style={{ width: `${100 / 3}%` }}
            />
          ))}
        </div>

        <div className="flex h-[600px]">
            {/* LEFT COLUMN: CONTROLS */}
            <div className="w-1/2 p-8 overflow-y-auto scrollbar-hide border-r border-zinc-800/50 bg-zinc-950/50">
                
                {/* STEP 1: TEMPLATE SELECTION */}
                {step === 1 && (
                  <div className="space-y-4">
                    <h1 className="text-2xl font-bold mb-1">Let's start with <span className="text-primary">the basics.</span></h1>
                    <p className="text-zinc-500 text-sm mb-6">Choose a template for your waitlist page.</p>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {TEMPLATE_OPTIONS.map((opt) => {
                        const isSelected = form.watch('templateKey') === opt.id
                        
                        return (
                          <div 
                            key={opt.id}
                            onClick={() => form.setValue('templateKey', opt.id)}
                            className={cn(
                              "relative p-4 rounded-xl border transition-all duration-200 group cursor-pointer hover:border-zinc-600 hover:bg-zinc-900",
                              isSelected
                                ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                                : "border-zinc-800 bg-zinc-900/50"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-12 w-12 rounded-lg bg-zinc-800 flex items-center justify-center text-2xl shrink-0">
                                {opt.emoji}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <HugeiconsIcon 
                                    icon={opt.icon} 
                                    strokeWidth={2} 
                                    className={cn(
                                      "w-5 h-5", 
                                      isSelected ? "text-primary" : "text-zinc-500"
                                    )} 
                                  />
                                  <div className="font-bold text-sm text-white">{opt.label}</div>
                                </div>
                                <div className="text-xs text-zinc-500 mt-0.5">{opt.desc}</div>
                              </div>
                              {isSelected && (
                                <HugeiconsIcon 
                                  icon={Check} 
                                  strokeWidth={2} 
                                  className="w-5 h-5 text-primary shrink-0" 
                                />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 2: BASICS */}
                {step === 2 && (
                  <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
                    <div>
                      <h1 className="text-2xl font-bold">Project <span className="text-primary">Identity.</span></h1>
                      <p className="text-zinc-500 text-sm mt-1">Make it memorable.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold tracking-wider text-zinc-400 uppercase">Waitlist Name</Label>
                        <Input 
                          {...form.register('name')}
                          className="bg-zinc-900/50 border-zinc-800 h-12 text-lg focus-visible:ring-primary/50 focus-visible:border-primary transition-all" 
                          placeholder="Ex: The Neon Studio"
                          autoComplete='off'
                        />
                        {form.formState.errors.name && <span className="text-red-400 text-xs">{form.formState.errors.name.message}</span>}
                      </div>

                      <div className="space-y-2">
                         <Label className="text-xs font-bold tracking-wider text-zinc-400 uppercase">URL Slug</Label>
                         <div className="relative group">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm select-none pointer-events-none z-10">waitlistkit.com/w/</span>
                            <Input 
                              {...form.register('slug')}
                              className="pl-[140px] bg-zinc-900/50 border-zinc-800 h-12 font-mono text-sm focus-visible:ring-primary/50 group-hover:border-zinc-700 transition-all" 
                              placeholder="neon-studio"
                            />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <Label className="text-xs font-bold tracking-wider text-zinc-400 uppercase">Pitch / Tagline</Label>
                         <Textarea 
                           {...form.register('description')}
                           className="bg-zinc-900/50 border-zinc-800 resize-none min-h-[100px] focus-visible:ring-primary/50 focus-visible:border-primary transition-all" 
                           placeholder="We are building the future of..."
                         />
                      </div>
                    </div>
                  </div>
                )}

                 {/* STEP 3: THEME */}
                 {step === 3 && (
                  <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
                     <div>
                      <h1 className="text-2xl font-bold">Pick a <span className="text-primary">Vibe.</span></h1>
                      <p className="text-zinc-500 text-sm mt-1">How should your waitlist feel?</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto scrollbar-hide">
                        {THEME_OPTIONS.map((themeOption) => {
                          const isSelected = watchedValues.theme === themeOption.id
                          const theme = getTheme(themeOption.id)
                          
                          return (
                            <div 
                              key={themeOption.id}
                              onClick={() => form.setValue('theme', themeOption.id)}
                              className={cn(
                                "cursor-pointer relative p-4 rounded-xl border transition-all hover:scale-[1.02] group",
                                isSelected 
                                  ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                                  : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900"
                              )}
                            >
                              {/* Theme Preview Box */}
                              <div 
                                className="h-16 w-full rounded-lg mb-3 border transition-all duration-300"
                                style={{
                                  backgroundColor: theme.colors.background,
                                  borderColor: theme.colors.border,
                                  borderRadius: theme.layout.borderRadius.lg
                                }}
                              >
                                <div className="h-full flex items-center justify-center gap-2 p-2">
                                  {/* Mini preview elements */}
                                  <div 
                                    className="h-6 w-6 rounded"
                                    style={{
                                      backgroundColor: theme.colors.primary,
                                      borderRadius: theme.layout.borderRadius.sm
                                    }}
                                  />
                                  <div 
                                    className="h-4 flex-1 rounded"
                                    style={{
                                      backgroundColor: theme.colors.muted,
                                      borderRadius: theme.layout.borderRadius.sm
                                    }}
                                  />
                                  <div 
                                    className="h-6 px-2 rounded text-[8px] font-bold flex items-center"
                                    style={{
                                      backgroundColor: theme.colors.buttonBg,
                                      color: theme.colors.buttonText,
                                      borderRadius: theme.layout.borderRadius.md
                                    }}
                                  >
                                    JOIN
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-3">
                                <div 
                                  className="h-8 w-8 rounded-lg flex items-center justify-center text-lg shrink-0 transition-all"
                                  style={{
                                    backgroundColor: theme.colors.muted,
                                    borderRadius: theme.layout.borderRadius.md
                                  }}
                                >
                                  {themeOption.emoji}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-sm text-white">{themeOption.name}</div>
                                  <div className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{themeOption.description}</div>
                                </div>
                                {isSelected && (
                                  <HugeiconsIcon 
                                    icon={Check} 
                                    strokeWidth={2} 
                                    className="w-5 h-5 text-primary shrink-0" 
                                  />
                                )}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                 )}

            </div>

            {/* RIGHT COLUMN: PREVIEW */}
            <div className="w-1/2 bg-black flex flex-col items-center justify-center relative p-6">
               {/* Grid Pattern Background */}
               <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
               <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>

               {/* Live Preview Label */}
               <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] uppercase tracking-widest font-bold text-zinc-400 flex items-center gap-2 z-20">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 Live Preview
               </div>
              
              {/* Desktop Preview Component - Fixed Size */}
               <div className="relative z-10 w-full h-full flex items-center justify-center">
                  <LivePreview />
               </div>

               {/* Step 1 decorative text if data is empty */}
               {step === 1 && (
                  <p className="absolute bottom-6 text-zinc-600 text-xs text-center max-w-[200px] z-20">
                     Select a project type to unlock the customizer
                  </p>
               )}
            </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex justify-between items-center">
            <Button 
               variant="ghost" 
               onClick={prevStep} 
               disabled={step === 1}
               className="text-zinc-400 hover:text-white"
            >
              Back
            </Button>
            
            {step < 3 ? (
                <Button 
                  onClick={nextStep}
                  className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold px-8"
                >
                  Continue <HugeiconsIcon icon={ChevronRight} strokeWidth={2} className="w-4 h-4 ml-2" />
                </Button>
            ) : (
               <Button 
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold px-8 shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <HugeiconsIcon icon={Rocket} strokeWidth={2} className="w-4 h-4 mr-2" />
                 {isSubmitting ? 'Creating...' : 'Launch Waitlist'}
               </Button>
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}