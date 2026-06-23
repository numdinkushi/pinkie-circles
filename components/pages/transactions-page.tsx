"use client"

import { useMemo, useState } from "react"
import { ArrowLeftRight } from "lucide-react"

import { TransactionRow } from "@/components/transactions/transaction-row"
import { SendCrcForm } from "@/components/transactions/send-crc-form"
import { CreateAccountButton } from "@/components/wallet/create-account-button"
import { Card, CardContent } from "@/components/ui/card"
import { useWalletTransactions } from "@/hooks/use-transactions"
import { useWallet } from "@/components/wallet/wallet-provider"
import type { TransactionDirection } from "@/lib/transactions/display"
import { cn } from "@/lib/utils"

type Filter = "all" | TransactionDirection
type Tab = "top-up" | "records"

const TABS: { id: Tab; label: string }[] = [
  { id: "top-up", label: "Top up" },
  { id: "records", label: "Records" },
]

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "debit", label: "Sent" },
  { id: "credit", label: "Received" },
]

export function TransactionsPage() {
  const { address, isConnected } = useWallet()
  const transactions = useWalletTransactions(address)
  const [tab, setTab] = useState<Tab>("top-up")
  const [filter, setFilter] = useState<Filter>("all")

  const filtered = useMemo(() => {
    if (!transactions) return []
    if (filter === "all") return transactions
    return transactions.filter((row) => row.direction === filter)
  }, [filter, transactions])

  const totals = useMemo(() => {
    if (!transactions) return { sent: 0, received: 0 }
    return transactions.reduce(
      (acc, row) => {
        if (row.direction === "debit") acc.sent += row.amountCrc
        else acc.received += row.amountCrc
        return acc
      },
      { sent: 0, received: 0 },
    )
  }, [transactions])

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="space-y-4 py-10 text-center">
          <div className="pinkie-gradient-bg mx-auto flex size-12 items-center justify-center rounded-2xl text-white">
            <ArrowLeftRight className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">CRC transactions</p>
            <p className="text-sm text-violet-800/70">
              Connect to see every thanks you sent or received on promises and surprises.
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
        <h1 className="pinkie-gradient-text text-xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-violet-800/70">
          Send CRC to a friend by address, or browse thanks from promise and surprise interactions.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-1 rounded-xl border border-pink-200/70 bg-white/60 p-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === item.id
                ? "pinkie-gradient-bg text-white shadow-sm shadow-pink-300/30"
                : "text-violet-600/80 hover:bg-pink-50/80 hover:text-violet-900",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "top-up" && address ? <SendCrcForm fromAddress={address} /> : null}

      {tab === "records" ? (
        <>
          {transactions && transactions.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-rose-200/70 bg-rose-50/80 px-3 py-2.5">
                <p className="text-[10px] font-medium uppercase tracking-wide text-rose-700/80">Sent</p>
                <p className="text-lg font-semibold tabular-nums text-rose-700">{totals.sent} CRC</p>
              </div>
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/80 px-3 py-2.5">
                <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-700/80">
                  Received
                </p>
                <p className="text-lg font-semibold tabular-nums text-emerald-700">
                  {totals.received} CRC
                </p>
              </div>
            </div>
          ) : null}

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

          {transactions === undefined ? (
            <p className="text-sm text-violet-800/70">Loading transactions…</p>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-violet-800/70">
                No transactions yet. Send CRC from Top up or send thanks after you close a promise or
                surprise.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((transaction) => (
                <TransactionRow key={transaction._id} transaction={transaction} />
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
