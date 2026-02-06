'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { HugeiconsIcon } from '@hugeicons/react'
import { ChampionIcon } from '@hugeicons/core-free-icons'

interface LeaderboardEntry {
  subscriberId: string
  email: string
  score: number
  position: number
  referralCount: number
  joinedAt: Date
}

interface LeaderboardPreviewProps {
  leaderboard: LeaderboardEntry[]
}

export function LeaderboardPreview({ leaderboard }: LeaderboardPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={ChampionIcon} className="w-5 h-5" />
          <CardTitle>Leaderboard Preview</CardTitle>
        </div>
        <CardDescription>
          Top performers in your referral campaign (read-only)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No subscribers yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Position</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Referrals</TableHead>
                <TableHead className="text-right">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((entry, index) => (
                <TableRow key={entry.subscriberId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {index < 3 && (
                        <HugeiconsIcon
                          icon={ChampionIcon}
                          className={`w-4 h-4 ${
                            index === 0
                              ? 'text-yellow-500'
                              : index === 1
                                ? 'text-zinc-400'
                                : 'text-amber-600'
                          }`}
                        />
                      )}
                      <span className="font-bold">#{entry.position}</span>
                    </div>
                  </TableCell>
                  <TableCell>{entry.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {entry.score}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {entry.referralCount > 0 ? (
                      <Badge variant="secondary">{entry.referralCount} friends</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {new Date(entry.joinedAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Tie-breaker:</strong> When scores are equal, earlier signups rank higher.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

