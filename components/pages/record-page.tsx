"use client"

import Link from "next/link"
import { useState } from "react"
import { BookMarked, Inbox, Sparkles } from "lucide-react"

import { PromiseCard } from "@/components/promises/promise-card"
import { CreateAccountButton } from "@/components/wallet/create-account-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { usePromiseRecord, type RecordFilter } from "@/hooks/use-promise-record"
import { useWallet } from "@/components/wallet/wallet-provider"
import { cn } from "@/lib/utils"

const FILTERS: { id: RecordFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "kept", label: "Kept" },
  { id: "promise", label: "Promises" },
  { id: "surprise", label: "Surprises" },
]

type RecordTab = "made" | "shared"

export function RecordPage() {
  const { address, isConnected } = useWallet()
  const [tab, setTab] = useState<RecordTab>("made")
  const [filter, setFilter] = useState<RecordFilter>("all")
  const { loading, made, shared, madeTotal, sharedTotal } = usePromiseRecord(address, filter)

  const items = tab === "made" ? made : shared

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="space-y-4 py-10 text-center">
          <div className="pinkie-gradient-bg mx-auto flex size-12 items-center justify-center rounded-2xl text-white">
            <BookMarked className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">Your pinkie record</p>
            <p className="text-sm text-violet-800/70">
              Connect to see every promise and surprise you made — and ones friends shared with you.
            </p>
          </div>
          <CreateAccountButton />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h1 className="pinkie-gradient-text text-xl font-semibold tracking-tight">On record</h1>
        <p className="text-sm text-violet-800/70">
          Everything tied to your wallet — survives refresh, links, and time.
        </p>
      </section>

      <div className="pinkie-glass flex rounded-2xl p-1">
        {(
          [
            { id: "made" as const, label: "You made", count: madeTotal, icon: Sparkles },
            { id: "shared" as const, label: "With you", count: sharedTotal, icon: Inbox },
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
              {!loading ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                    active ? "bg-white/20" : "bg-violet-100 text-violet-700",
                  )}
                >
                  {option.count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
              filter === item.id
                ? "border-pink-300 bg-pink-50 text-violet-900"
                : "border-pink-100/80 bg-white/60 text-violet-600/80 hover:border-pink-200",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-violet-800/70">Loading your record…</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-10 text-center">
            <p className="font-medium">
              {tab === "made" ? "Nothing on record yet" : "Nothing shared with you yet"}
            </p>
            <p className="text-sm text-violet-800/70">
              {tab === "made"
                ? "Make a promise or surprise on Home — it will show up here instantly."
                : "When a friend shares a link and you open it, their promise or surprise lands here."}
            </p>
            {tab === "made" ? (
              <Button asChild>
                <Link href="/">Make one on Home</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {items.map((promise) => (
            <PromiseCard key={promise.slug} promise={promise} from="record" />
          ))}
        </div>
      )}
    </div>
  )
}
