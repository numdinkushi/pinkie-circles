"use client"

import { useState } from "react"
import { Heart, ShieldCheck, Sparkles, Trophy } from "lucide-react"

import { ProfileAvatar } from "@/components/profile/profile-avatar"
import { CreateAccountButton } from "@/components/wallet/create-account-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useProfilesByAddresses } from "@/hooks/use-profile"
import { useHighFives } from "@/hooks/use-promises"
import { useWallet } from "@/components/wallet/wallet-provider"
import { shortenAddress } from "@/lib/referrals"
import { cn } from "@/lib/utils"

const BOARDS = [
  {
    id: "kept" as const,
    label: "Kept it",
    description: "Most promises delivered",
    icon: Sparkles,
  },
  {
    id: "held" as const,
    label: "Held you to it",
    description: "Most confirmations as witness",
    icon: ShieldCheck,
  },
  {
    id: "tipped" as const,
    label: "Big thanks",
    description: "Most CRC sent your way",
    icon: Heart,
  },
]

type BoardId = (typeof BOARDS)[number]["id"]

export function HighFivesPage() {
  const { address, isConnected } = useWallet()
  const data = useHighFives(address)
  const [board, setBoard] = useState<BoardId>("kept")

  const rows = data ? data[board] : []
  const profileAddresses = rows.map((r) => r.address)
  const profiles = useProfilesByAddresses(profileAddresses)

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">High Fives</CardTitle>
          <CardDescription>
            Friendly rankings with people in your Circle — connect to see yours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateAccountButton />
        </CardContent>
      </Card>
    )
  }

  const activeBoard = BOARDS.find((b) => b.id === board)!

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="pinkie-gradient-text text-xl font-semibold">High Fives</h1>
        <p className="text-sm text-violet-800/70">
          Celebrate friends in your Circle — who keeps their word, who holds you to it, and who
          sends thanks.
        </p>
      </section>

      {data?.myStats ? (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "You kept", value: data.myStats.kept },
            { label: "You held", value: data.myStats.held },
            { label: "CRC sent", value: data.myStats.thanksSent },
          ].map((stat) => (
            <Card key={stat.label} className="text-center">
              <CardContent className="py-3">
                <p className="text-lg font-semibold">{stat.value}</p>
                <p className="text-[10px] text-violet-800/70">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-1 rounded-xl border border-pink-200/60 bg-white/60 p-1">
        {BOARDS.map((item) => {
          const Icon = item.icon
          const active = board === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setBoard(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors",
                active
                  ? "pinkie-gradient-bg text-white shadow-sm"
                  : "text-violet-700/70 hover:bg-pink-50",
              )}
            >
              <Icon className="size-3.5" />
              {item.label}
            </button>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="size-4 text-violet-600" />
            {activeBoard.label}
          </CardTitle>
          <CardDescription>{activeBoard.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data === undefined ? (
            <p className="text-sm text-violet-800/70">Loading rankings…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-violet-800/70">
              No scores yet. Close a promise with someone in your Circle, or send thanks after
              they deliver.
            </p>
          ) : (
            rows.map((row, index) => {
              const profile = profiles?.find((p) => p.address === row.address)
              return (
                <div
                  key={row.address}
                  className="flex items-center gap-3 rounded-xl border border-pink-100/80 bg-pink-50/40 px-3 py-2"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-violet-700">
                    {index + 1}
                  </span>
                  <ProfileAvatar
                    name={profile?.displayName}
                    address={row.address}
                    avatarUrl={profile?.avatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1 truncate text-sm font-medium">
                    {profile?.displayName ?? shortenAddress(row.address)}
                  </div>
                  <span className="text-sm font-semibold text-violet-700">
                    {board === "tipped" ? `${row.score} CRC` : row.score}
                  </span>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
