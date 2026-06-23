"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronLeft, Inbox, Sparkles } from "lucide-react"

import { PromiseCard } from "@/components/promises/promise-card"
import { ProfileAvatar } from "@/components/profile/profile-avatar"
import { CreateAccountButton } from "@/components/wallet/create-account-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useProfilesByAddresses } from "@/hooks/use-profile"
import { usePromisesBetween } from "@/hooks/use-promises"
import type { PromiseRecord } from "@/hooks/use-promises"
import { useWallet } from "@/components/wallet/wallet-provider"
import { isPromiseMaker } from "@/lib/circle/display"
import { isClosedStatus } from "@/lib/promises/kind"
import { shortenAddress } from "@/lib/referrals"
import { cn } from "@/lib/utils"

type CircleFriendPageProps = {
  counterparty: string
}

type RoleTab = "initiated" | "received"

function filterByRole(promises: PromiseRecord[], address: string, tab: RoleTab) {
  return promises.filter((promise) => {
    const initiated = isPromiseMaker(promise, address)
    return tab === "initiated" ? initiated : !initiated
  })
}

export function CircleFriendPage({ counterparty }: CircleFriendPageProps) {
  const { address, isConnected } = useWallet()
  const promises = usePromisesBetween(address, counterparty)
  const profiles = useProfilesByAddresses([counterparty])
  const friend = profiles?.[0]
  const [tab, setTab] = useState<RoleTab>("initiated")

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="py-8">
          <CreateAccountButton />
        </CardContent>
      </Card>
    )
  }

  const allOpen = promises?.filter((p) => p.status === "open") ?? []
  const allDone = promises?.filter((p) => isClosedStatus(p.status)) ?? []
  const initiatedCount =
    promises?.filter((p) => address && isPromiseMaker(p, address)).length ?? 0
  const receivedCount = (promises?.length ?? 0) - initiatedCount
  const open = address ? filterByRole(allOpen, address, tab) : []
  const done = address ? filterByRole(allDone, address, tab) : []

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2 text-violet-700 hover:text-violet-900" asChild>
        <Link href="/circle">
          <ChevronLeft className="size-4" />
          Back to circle
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <ProfileAvatar
          name={friend?.displayName}
          address={counterparty}
          avatarUrl={friend?.avatarUrl}
          size="lg"
        />
        <div>
          <h1 className="text-xl font-semibold">
            {friend?.displayName ?? shortenAddress(counterparty)}
          </h1>
          <p className="text-sm text-violet-800/70">Promises you share</p>
        </div>
      </div>

      {promises === undefined ? (
        <p className="text-sm text-violet-800/70">Loading…</p>
      ) : promises.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No shared promises yet</CardTitle>
            <CardDescription>
              Share a new promise link with this friend from Home.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="pinkie-glass flex rounded-2xl p-1">
            {(
              [
                {
                  id: "initiated" as const,
                  label: "You initiated",
                  count: initiatedCount,
                  icon: Sparkles,
                },
                {
                  id: "received" as const,
                  label: "Promised to you",
                  count: receivedCount,
                  icon: Inbox,
                },
              ] as const
            ).map((option) => {
              const Icon = option.icon
              const active = tab === option.id

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTab(option.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-medium transition-all",
                    active
                      ? "pinkie-gradient-bg text-white shadow-md shadow-pink-300/30"
                      : "text-violet-700/70 hover:bg-pink-50/80",
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span>{option.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                      active ? "bg-white/20" : "bg-violet-100 text-violet-700",
                    )}
                  >
                    {option.count}
                  </span>
                </button>
              )
            })}
          </div>

          {open.length === 0 && done.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-violet-800/70">
                {tab === "initiated"
                  ? "Nothing you've initiated with this friend yet."
                  : "Nothing promised to you by this friend yet."}
              </CardContent>
            </Card>
          ) : (
            <>
              {open.length > 0 ? (
                <section className="flex flex-col gap-4">
                  <h2 className="text-sm font-medium">Open ({open.length})</h2>
                  {open.map((promise) => (
                    <PromiseCard
                      key={promise.slug}
                      promise={promise}
                      from="circle-friend"
                      circleAddress={counterparty}
                    />
                  ))}
                </section>
              ) : null}
              {done.length > 0 ? (
                <section className="flex flex-col gap-4">
                  <h2 className="text-sm font-medium">Kept ({done.length})</h2>
                  {done.map((promise) => (
                    <PromiseCard
                      key={promise.slug}
                      promise={promise}
                      from="circle-friend"
                      circleAddress={counterparty}
                    />
                  ))}
                </section>
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  )
}
