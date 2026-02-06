import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  ArrowRight01Icon, 
  Users, 
  Award01Icon, 
  Share06Icon, 
  Link01Icon 
} from "@hugeicons/core-free-icons"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function WaitlistAnalyticsPage({ params }: PageProps) {
  // 1. Auth & Sesión
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return redirect("/auth/login")

  const { slug } = await params

  // 2. Buscar Waitlist + Stats (Optimized Query)
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
      return notFound()
    }
  }

  const waitlist = await prisma.waitlist.findFirst({
    where: { 
      slug,
      organizationId: orgId
    },
    include: {
      _count: {
        select: { subscribers: true }
      },
      // Traer los últimos 50 suscriptores ordenados por score (puntos)
      subscribers: {
        orderBy: { score: 'desc' },
        take: 50,
        include: {
            _count: { select: { referrals: true } } // Contar cuántos referidos trajo cada uno
        }
      }
    }
  })

  // 3. Security Check: ¿Esta waitlist pertenece a la org del usuario?
  if (!waitlist) return notFound()

  // Calculos simples para KPIs
  const totalSubscribers = waitlist._count.subscribers
  
  // Calcular % de usuarios que han referido a alguien (Viralidad)
  const usersWhoReferred = await prisma.subscriber.count({
    where: {
        waitlistId: waitlist.id,
        referrals: { some: {} } // Tienen al menos 1 hijo
    }
  })
  
  const referralRate = totalSubscribers > 0 
    ? ((usersWhoReferred / totalSubscribers) * 100).toFixed(1) 
    : "0"

  // URL pública
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/w/${waitlist.slug}`

  return (
    <div className="space-y-8 p-2 md:p-8 max-w-7xl mx-auto w-full min-w-0">
      {/* HEADER DE LA PAGINA */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{waitlist.name}</h1>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-800 flex items-center gap-1 text-sm font-medium">
                {publicUrl} <HugeiconsIcon icon={Link01Icon} className="w-3 h-3" />
            </a>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <Button variant="outline" asChild className="flex-1 md:flex-initial">
                <Link href={`/dashboard/waitlists/${slug}/settings/referral`}>
                    Settings
                </Link>
            </Button>
            <Button asChild className="flex-1 md:flex-initial">
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    Open <HugeiconsIcon icon={ArrowRight01Icon} className="ml-2 w-4 h-4" />
                </a>
            </Button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Signups</CardTitle>
            <HugeiconsIcon icon={Users} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl text-secondary font-bold">{totalSubscribers}</div>
            <p className="text-xl text-secondary">+0 from last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viral Rate</CardTitle>
            <HugeiconsIcon icon={Share06Icon} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl text-secondary font-bold">{referralRate}%</div>
            <p className="text-xl text-secondary">Users who referred friends</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waitlist Score</CardTitle>
            <HugeiconsIcon icon={Award01Icon} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl text-secondary font-bold">Top 5%</div>
            <p className="text-xl text-secondary">Compared to other projects</p>
          </CardContent>
        </Card>
      </div>

      {/* DATA TABLE */}
      <Card className="w-full min-w-0">
        <CardHeader>
            <CardTitle>Leaderboard & Subscribers</CardTitle>
        </CardHeader>
        <CardContent className="p-0 min-w-0">
            <div className="overflow-x-auto min-w-0">
                <Table className="min-w-[600px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Position</TableHead>
                            <TableHead className="min-w-[200px]">Email</TableHead>
                            <TableHead className="min-w-[120px]">Referrals</TableHead>
                            <TableHead className="min-w-[80px]">Score</TableHead>
                            <TableHead className="text-right min-w-[120px]">Signed Up</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {waitlist.subscribers.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                                    No signups yet. Share your link to get started!
                                </TableCell>
                             </TableRow>
                        ) : (
                            waitlist.subscribers.map((sub, index) => (
                                <TableRow key={sub.id}>
                                    <TableCell className="font-medium">#{index + 1}</TableCell>
                                    <TableCell className="truncate max-w-[200px]">{sub.email}</TableCell>
                                    <TableCell>
                                        {sub._count.referrals > 0 && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                {sub._count.referrals} friends
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>{sub.score}</TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                        {new Date(sub.createdAt).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}