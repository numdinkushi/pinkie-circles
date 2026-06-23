"use client"

import { PromiseCard } from "@/components/promises/promise-card"
import { ProfileAvatar } from "@/components/profile/profile-avatar"
import { CreateAccountButton } from "@/components/wallet/create-account-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useProfilesByAddresses } from "@/hooks/use-profile"
import { usePromisesBetween } from "@/hooks/use-promises"
import { useWallet } from "@/components/wallet/wallet-provider"
import { shortenAddress } from "@/lib/referrals"

type CircleFriendPageProps = {
  counterparty: string
}

export function CircleFriendPage({ counterparty }: CircleFriendPageProps) {
  const { address, isConnected } = useWallet()
  const promises = usePromisesBetween(address, counterparty)
  const profiles = useProfilesByAddresses([counterparty])
  const friend = profiles?.[0]

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="py-8">
          <CreateAccountButton />
        </CardContent>
      </Card>
    )
  }

  const open = promises?.filter((p) => p.status === "open") ?? []
  const done = promises?.filter((p) => p.status === "done") ?? []

  return (
    <div className="space-y-6">
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
          {open.length > 0 ? (
            <section className="flex flex-col gap-4">
              <h2 className="text-sm font-medium">Open ({open.length})</h2>
              {open.map((promise) => (
                <PromiseCard key={promise.slug} promise={promise} />
              ))}
            </section>
          ) : null}
          {done.length > 0 ? (
            <section className="flex flex-col gap-4">
              <h2 className="text-sm font-medium">Kept ({done.length})</h2>
              {done.map((promise) => (
                <PromiseCard key={promise.slug} promise={promise} />
              ))}
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}
