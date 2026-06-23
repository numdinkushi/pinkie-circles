"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { CreateAccountButton } from "@/components/wallet/create-account-button"
import { PromiseForm } from "@/components/promises/promise-form"
import { PromiseCard } from "@/components/promises/promise-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePromiseRecord } from "@/hooks/use-promise-record"
import { useWallet } from "@/components/wallet/wallet-provider"
import { shortenAddress } from "@/lib/referrals"

export function HomePage() {
  const { address, isConnected, isMiniappHost, referralInviter, referralSecret } = useWallet()
  const { loading, made, shared } = usePromiseRecord(address, "open")
  const recentOpen = [...made, ...shared]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 2)

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="pinkie-gradient-text text-2xl font-semibold tracking-tight">
          Your word, on record.
        </h1>
        <p className="text-sm text-violet-800/70">
          Make a promise for the future, or a surprise for something you already did.
        </p>
      </section>

      {referralSecret && !isConnected ? (
        <Card className="border-fuchsia-300/50 bg-gradient-to-br from-pink-50/90 to-violet-50/90">
          <CardHeader>
            <CardTitle className="text-base">You&apos;ve been invited</CardTitle>
            <CardDescription>
              {referralInviter
                ? `${shortenAddress(referralInviter)} invited you to Pinkie on Circles.`
                : "Create your Circles account to join and witness promises."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateAccountButton referralLabel="Create account & join" />
          </CardContent>
        </Card>
      ) : null}

      {!isConnected ? (
        isMiniappHost ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connect to make a promise</CardTitle>
              <CardDescription>
                Your Circles wallet stays in the host — we never ask for keys.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateAccountButton />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-pink-200/60 bg-gradient-to-br from-pink-50/80 to-violet-50/60">
            <CardHeader>
              <CardTitle className="text-base">Open Pinkie in Circles</CardTitle>
              <CardDescription>
                Connect your wallet in the Circles Playground — then make promises, surprises, and
                send CRC thanks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <CreateAccountButton label="Open in Circles Playground" />
              <p className="text-center text-[11px] text-violet-700/60">
                You&apos;re on the web preview. Pinkie runs fully inside Circles.
              </p>
            </CardContent>
          </Card>
        )
      ) : (
        <PromiseForm makerAddress={address!} />
      )}

      {isConnected ? (
        <Card className="border-pink-200/60 bg-gradient-to-br from-pink-50/50 to-violet-50/40">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-sm font-medium text-violet-950">Your full pinkie record</p>
              <p className="text-xs text-violet-800/70">
                Promises, surprises, open & kept — always in the Record tab.
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0 border-pink-200/70">
              <Link href="/record">
                View all
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {isConnected && !loading && recentOpen.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Still open</h2>
            <Link
              href="/record"
              className="text-xs text-violet-700/70 underline-offset-4 hover:underline"
            >
              See everything
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {recentOpen.map((promise) => (
              <PromiseCard key={promise.slug} promise={promise} from="home" />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
