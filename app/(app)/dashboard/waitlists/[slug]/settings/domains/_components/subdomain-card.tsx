'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon, CheckCircleIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'

interface SubdomainCardProps {
  subdomain: string
}

export function SubdomainCard({ subdomain }: SubdomainCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${subdomain}`)
      setCopied(true)
      toast.success('Subdomain copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy subdomain')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Subdomain</CardTitle>
            <CardDescription className="mt-1">
              Your waitlist is automatically available at this subdomain
            </CardDescription>
          </div>
          <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
            <HugeiconsIcon icon={CheckCircleIcon} className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                readOnly
                value={`https://${subdomain}`}
                className="font-mono text-sm bg-muted/50 cursor-default"
              />
            </div>
            <Button
              variant="outline"
              size="default"
              onClick={handleCopy}
              className="gap-2 shrink-0"
            >
              <HugeiconsIcon 
                icon={copied ? CheckCircleIcon : Copy01Icon} 
                strokeWidth={2} 
                className="w-4 h-4" 
              />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            This subdomain is automatically provisioned for your waitlist.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

