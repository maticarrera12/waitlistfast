'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HugeiconsIcon } from '@hugeicons/react'
import { LockIcon } from '@hugeicons/core-free-icons'

export function CustomDomainCard() {
  return (
    <Card className="opacity-75">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Custom Domain</CardTitle>
            <CardDescription className="mt-1">
              Use your own domain to host your waitlist
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 border-zinc-200">
            Coming Soon
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                disabled
                placeholder="yourdomain.com"
                className="font-mono text-sm bg-muted/30 cursor-not-allowed"
              />
            </div>
            <Button
              disabled
              variant="default"
              size="default"
              className="gap-2 shrink-0 cursor-not-allowed"
            >
              <HugeiconsIcon icon={LockIcon} strokeWidth={2} className="w-4 h-4" />
              Add Custom Domain
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Use your own domain like <span className="font-mono">waitlist.yourcompany.com</span> to host your waitlist.
            This feature will be available soon.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

