'use client'

import { useActionState } from 'react'
import { joinWaitlist } from '@/actions/join-waitlist'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon, CheckmarkBadge02Icon } from '@hugeicons/core-free-icons'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useTheme, ThemeName } from '@/lib/themes'

interface JoinFormProps {
  waitlistId: string
  themeName: ThemeName
  waitlistSlug: string
  subscriberCount?: number
}

export function JoinForm({ waitlistId, themeName, waitlistSlug, subscriberCount }: JoinFormProps) {
  const theme = useTheme(themeName)
  const [state, action, isPending] = useActionState(joinWaitlist, null)
  const [copied, setCopied] = useState(false)
  const [shareLink, setShareLink] = useState('')

  // Generar el link de compartir cuando el usuario se suscribe
  useEffect(() => {
    if (state?.success && state.subscriber) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      setShareLink(`${baseUrl}/w/${waitlistSlug}?ref=${state.subscriber.referralCode}`)
    }
  }, [state, waitlistSlug])

  // SI HAY ÉXITO: MUESTRA LA VISTA DE "SUSCRITO"
  if (state?.success && state.subscriber) {
    const copyToClipboard = () => {
      navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success("Link copied!")
    }

    return (
      <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
        {/* CARD DE POSICION */}
        <div className={cn(
          "border p-6 text-center",
          theme.classes.card,
          theme.config.layout.borderRadius.xl
        )}>
          <h3 className={cn(
            "uppercase tracking-widest text-xs font-bold mb-2",
            theme.classes.body
          )}>
            Current Position
          </h3>
          <div 
            className="text-5xl font-black mb-2"
            style={{ color: theme.colors.accent }}
          >
            #{state.position}
          </div>
          <p className={cn("text-sm", theme.classes.body)}>
            You are in line!
          </p>
        </div>

        {/* AREA DE REFERIDOS */}
        <div className="space-y-3">
          <p className={cn("text-sm text-center", theme.classes.body)}>
            Invite friends to move up the list. 
            <br/>
            <span className="font-bold" style={{ color: theme.colors.accent }}>+1 spot</span> per referral.
          </p>
          
          <div className="flex gap-2">
            <Input 
              readOnly 
              value={shareLink} 
              className={cn(
                "flex-1 font-mono text-sm",
                theme.classes.input
              )}
            />
            <Button 
              onClick={copyToClipboard}
              className={cn(
                "shrink-0 font-bold",
                theme.classes.buttonPrimary
              )}
            >
              <HugeiconsIcon 
                icon={copied ? CheckmarkBadge02Icon : Copy01Icon} 
                strokeWidth={2} 
                className="w-5 h-5" 
              />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // SI NO: MUESTRA FORMULARIO NORMAL
  return (
    <form action={action} className="w-full max-w-md mx-auto flex flex-col gap-4">
      <input type="hidden" name="waitlistId" value={waitlistId} />
      
      <div className="flex flex-col sm:flex-row gap-2">
        <Input 
          name="email"
          type="email" 
          placeholder="name@work-email.com" 
          required
          className={cn(
            "flex-1 h-12",
            theme.classes.input,
            theme.config.typography.fontFamily.mono && "font-mono"
          )}
        />
        <Button 
          type="submit" 
          disabled={isPending}
          className={cn(
            "h-12 px-8 font-bold whitespace-nowrap",
            theme.classes.buttonPrimary,
            theme.config.layout.borderRadius.full
          )}
        >
          {isPending ? 'Joining...' : 'JOIN'}
        </Button>
      </div>
      
      {state?.error && (
        <p 
          className="text-sm text-center"
          style={{ color: theme.colors.error }}
        >
          {state.error}
        </p>
      )}
      
      <p className={cn("text-xs text-center mt-2", theme.classes.body)}>
        Join {subscriberCount?.toLocaleString() || 'thousands'} waiting. Unsubscribe anytime.
      </p>
    </form>
  )
}

