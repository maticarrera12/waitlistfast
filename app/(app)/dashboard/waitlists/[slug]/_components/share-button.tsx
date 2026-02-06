'use client'

import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Share06Icon } from '@hugeicons/core-free-icons'

interface ShareButtonProps {
  url: string
}

export function ShareButton({ url }: ShareButtonProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my waitlist',
          url: url
        })
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url)
      } catch (error) {
        // Fallback failed
      }
    }
  }

  return (
    <Button 
      onClick={handleShare}
      className="bg-primary text-primary-foreground gap-2"
    >
      <HugeiconsIcon icon={Share06Icon} strokeWidth={2} className="w-4 h-4" />
      Share
    </Button>
  )
}

