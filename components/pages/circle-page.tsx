"use client"

import Link from "next/link"
import { Users } from "lucide-react"

import { PromiseCard } from "@/components/promises/promise-card"
import { ProfileAvatar } from "@/components/profile/profile-avatar"
import { CreateAccountButton } from "@/components/wallet/create-account-button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useProfilesByAddresses } from "@/hooks/use-profile"
import { useCircleSummary } from "@/hooks/use-promises"
import { useWallet } from "@/components/wallet/wallet-provider"
import { shortenAddress } from "@/lib/referrals"

export function CirclePage() {
  const { address, isConnected } = useWallet()
  const circle = useCircleSummary(address)
  const profileAddresses = circle?.map((c) => c.address) ?? []
  const profiles = useProfilesByAddresses(profileAddresses)

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Circle</CardTitle>
          <CardDescription>
            People you&apos;ve pinkie-promised with show up here automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateAccountButton />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="pinkie-gradient-text text-xl font-semibold">Your Circle</h1>
        <p className="text-sm text-violet-800/70">
          Friends appear here when you share a promise or witness theirs. Tap someone to see your
          history together.
        </p>
      </section>

      {circle === undefined ? (
        <p className="text-sm text-violet-800/70">Loading your circle…</p>
      ) : circle.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="pinkie-gradient-bg flex size-12 items-center justify-center rounded-2xl text-white">
              <Users className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">No one in your Circle yet</p>
              <p className="text-sm text-violet-800/70">
                Make a promise on Home and share the link with a friend. They become your witness
                when they open it.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {circle.map((member) => {
            const profile = profiles?.find((p) => p.address === member.address)
            return (
              <Link key={member.address} href={`/circle/${member.address}`}>
                <Card className="transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink-200/40">
                  <CardContent className="flex items-center gap-3 py-4">
                    <ProfileAvatar
                      name={profile?.displayName}
                      address={member.address}
                      avatarUrl={profile?.avatarUrl}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {profile?.displayName ?? shortenAddress(member.address)}
                      </p>
                      <p className="text-xs text-violet-800/70">
                        {member.openCount > 0
                          ? `${member.openCount} open · `
                          : ""}
                        {member.doneCount} kept
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {member.openCount > 0 ? (
                        <Badge className="border-0 bg-amber-100 text-amber-800">
                          {member.openCount} open
                        </Badge>
                      ) : null}
                      <span className="text-[10px] text-violet-700/60">View promises →</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
