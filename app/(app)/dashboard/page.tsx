import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PlusSignIcon, Share06Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { CreateWaitlistModal } from '../_components/create-waitlist-modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

async function getDashboardData() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    return null
  }

  // Get user's organization
  let orgId = session.session?.activeOrganizationId

  if (!orgId) {
    const membership = await prisma.member.findFirst({
      where: { userId: session.user.id },
      select: { organizationId: true }
    })
    
    if (membership) {
      orgId = membership.organizationId
    } else {
      return null
    }
  }

  // Get all waitlists with subscriber counts
  const waitlists = await prisma.waitlist.findMany({
    where: {
      organizationId: orgId
    },
    include: {
      _count: {
        select: {
          subscribers: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Calculate KPIs
  const totalSignups = waitlists.reduce((sum, w) => sum + w._count.subscribers, 0)
  
  // Calculate average conversion rate (simplified - you might want to track actual conversions)
  // For now, we'll use a placeholder calculation
  const avgConversionRate = waitlists.length > 0 
    ? (waitlists.reduce((sum, w) => {
        // Simplified: assume conversion rate based on subscriber count
        // You might want to track actual conversions separately
        return sum + (w._count.subscribers > 0 ? 70 : 0)
      }, 0) / waitlists.length).toFixed(1)
    : '0'

  // Calculate growth percentages (simplified - you'd want to compare with previous period)
  const signupsGrowth = '+18.4%' // Placeholder
  const conversionGrowth = '+5.2%' // Placeholder

  return {
    waitlists,
    totalSignups,
    avgConversionRate,
    signupsGrowth,
    conversionGrowth
  }
}

function calculateWaitTime(createdAt: Date): string {
  const days = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return '1 Day'
  return `${days} Days`
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  if (!data) {
    redirect('/auth/login')
  }

  const { waitlists, totalSignups, avgConversionRate, signupsGrowth, conversionGrowth } = data

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className='flex justify-between items-center'>
        <div className='flex flex-col gap-2'>
          <h1 className='text-2xl ml-12 md:ml-0 md:text-[clamp(60px,13vw,80px)]  font-bold font-space-mono'>DASHBOARD</h1>
          <p className='text-sm md:text-md text-muted-foreground'>Welcome back. Your Waitlists are heating up.</p>
        </div>
        <div className='flex items-center justify-center gap-4'>
          <CreateWaitlistModal 
            trigger={
              <button className='bg-primary  text-background hover:bg-primary/80 rounded-full cursor-pointer p-2 md:px-6 md:py-8 font-bold text-xs md:text-xl flex items-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] transition-all'>
                NEW WAITLIST
                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-6 p-1 font-bold text-primary bg-background rounded-full" />
              </button>
            }
          />
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Total Active Signups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3">
              <div className="text-5xl font-bold text-secondary">{totalSignups.toLocaleString()}</div>
              <div className="text-sm font-semibold text-secondary">{signupsGrowth}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Avg. Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3">
              <div className="text-5xl font-bold text-secondary">{avgConversionRate}%</div>
              <div className="text-sm font-semibold text-secondary">{conversionGrowth}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Waitlists Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-space-mono">ACTIVE WAITLISTS</h2>
          <span className="text-sm text-muted-foreground">SORTED BY: RECENCY</span>
        </div>

        {waitlists.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No waitlists yet. Create your first one to get started!</p>
            <CreateWaitlistModal 
              trigger={
                <Button className="bg-primary text-background hover:bg-primary/80">
                  Create Your First Waitlist
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {waitlists.map((waitlist) => {
              const waitTime = calculateWaitTime(waitlist.createdAt)
              const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/w/${waitlist.slug}`
              
              return (
                <Card key={waitlist.id} className="overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all group">
                  <div className="relative h-32 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
                    {/* Optional: Add background image here if you store one */}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{waitlist.name}</h3>
                        {waitlist.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{waitlist.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-md text-muted-foreground uppercase tracking-wider">LEADS</p>
                          <p className="text-2xl font-bold text-white">{waitlist._count.subscribers.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-md text-muted-foreground uppercase tracking-wider">WAIT TIME</p>
                          <p className="text-2xl font-bold text-white">{waitTime}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-8">
                      <Button asChild className="flex-1 py-8 bg-primary text-background hover:bg-primary/80 font-bold text-xl">
                        <Link href={`/dashboard/waitlists/${waitlist.slug}`}>
                          Manage Campaign
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        asChild
                        className='bg-card border border-muted-foreground text-muted-foreground hover:bg-card/80 p-8'
                      >
                        <a 
                          href={publicUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center text-muted-foreground  p-8"
                        >
                          <HugeiconsIcon icon={Share06Icon} size={12} strokeWidth={2} className="w-12 h-12" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
