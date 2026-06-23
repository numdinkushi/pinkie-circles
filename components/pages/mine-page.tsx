"use client"

import { PromiseCard } from "@/components/promises/promise-card"
import { CreateAccountButton } from "@/components/wallet/create-account-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMyPromises } from "@/hooks/use-promises"
import { isClosedStatus } from "@/lib/promises/kind"
import { useWallet } from "@/components/wallet/wallet-provider"

export function MinePage() {
  const { address, isConnected } = useWallet()
  const promises = useMyPromises(address)

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your promises</CardTitle>
          <CardDescription>Connect your Circles account to see promises you made.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateAccountButton />
        </CardContent>
      </Card>
    )
  }

  const open = promises?.filter((p) => p.status === "open") ?? []
  const done = promises?.filter((p) => isClosedStatus(p.status)) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">My promises</h1>
        <p className="text-sm text-muted-foreground">Everything you put on record.</p>
      </div>

      {promises === undefined ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : promises.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No promises yet. Make one from Home.
          </CardContent>
        </Card>
      ) : (
        <>
          {open.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-medium">Open ({open.length})</h2>
              {open.map((promise) => (
                <PromiseCard key={promise.slug} promise={promise} from="mine" />
              ))}
            </section>
          ) : null}
          {done.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-medium">Done ({done.length})</h2>
              {done.map((promise) => (
                <PromiseCard key={promise.slug} promise={promise} from="mine" />
              ))}
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}
