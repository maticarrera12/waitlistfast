'use client'

import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { useState } from 'react'

interface CopyButtonProps {
  url: string
  variant?: 'default' | 'outline' | 'ghost'
}

export function CopyButton({ url, variant = 'default' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  return (
    <Button 
      variant={variant}
      onClick={handleCopy}
      className="gap-2"
    >
      <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="w-4 h-4" />
      {copied ? 'Copied!' : 'Copy Link'}
    </Button>
  )
}

