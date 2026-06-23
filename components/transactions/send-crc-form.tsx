"use client"

import { useEffect, useState } from "react"
import { ClipboardPaste, LoaderCircle, Send } from "lucide-react"
import { getAddress, isAddress } from "viem"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCrcBalance } from "@/hooks/use-crc-balance"
import { useTransactionMutations } from "@/hooks/use-transactions"
import { sendCrcToAddress } from "@/lib/circles"
import { cn } from "@/lib/utils"

type SendCrcFormProps = {
  fromAddress: string
  className?: string
}

function parseRecipientAddress(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed || !isAddress(trimmed, { strict: false })) return null
  return getAddress(trimmed)
}

export function SendCrcForm({ fromAddress, className }: SendCrcFormProps) {
  const { formatted, numeric, loading: balanceLoading, refresh } = useCrcBalance(fromAddress)
  const { recordTransfer } = useTransactionMutations()
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("1")
  const [note, setNote] = useState("")
  const [sending, setSending] = useState(false)
  const [recipientCheck, setRecipientCheck] = useState<{
    loading: boolean
    canReceive: boolean | null
    message: string | null
    hint: string | null
  }>({ loading: false, canReceive: null, message: null, hint: null })

  const recipientAddress = parseRecipientAddress(recipient)
  const amountCrc = Number.parseFloat(amount)
  const amountValid = Number.isFinite(amountCrc) && amountCrc > 0
  const insufficientBalance = amountValid && numeric < amountCrc
  const canSend = !!recipientAddress && amountValid && !insufficientBalance && !sending

  useEffect(() => {
    if (!recipientAddress) {
      setRecipientCheck({ loading: false, canReceive: null, message: null, hint: null })
      return
    }

    let cancelled = false
    setRecipientCheck({ loading: true, canReceive: null, message: null, hint: null })

    void fetch("/api/transfer/check-recipient", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: recipientAddress }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        setRecipientCheck({
          loading: false,
          canReceive: res.ok ? data.canReceive !== false : true,
          message:
            typeof data.message === "string" && !data.isHuman
              ? data.message
              : typeof data.error === "string"
                ? data.error
                : null,
          hint: typeof data.hint === "string" && !data.isHuman ? data.hint : null,
        })
      })
      .catch(() => {
        if (cancelled) return
        setRecipientCheck({
          loading: false,
          canReceive: true,
          message: null,
          hint: null,
        })
      })

    return () => {
      cancelled = true
    }
  }, [recipientAddress])

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText()
      setRecipient(text.trim())
    } catch {
      toast.error("Paste blocked here — long-press the field and tap Paste instead.")
    }
  }

  async function handleSend() {
    if (!recipientAddress || !amountValid) return

    setSending(true)
    try {
      const txHashes = await sendCrcToAddress({
        from: fromAddress,
        to: recipientAddress,
        amountCrc,
        note: note.trim() || undefined,
      })
      await recordTransfer({
        fromAddress: fromAddress,
        toAddress: recipientAddress,
        amountCrc,
        note: note.trim() || undefined,
        txHashes,
      })
      await refresh()
      setRecipient("")
      setNote("")
      toast.success(`Sent ${amountCrc} CRC`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send CRC")
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className={cn("border-pink-200/60", className)}>
      <CardHeader>
        <CardTitle className="text-base">Top up</CardTitle>
        <CardDescription>
          Paste a friend&apos;s Circles wallet address to send them CRC.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-pink-200/60 bg-gradient-to-br from-pink-50/90 to-violet-50/80 px-3 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-violet-800/70">
            Your balance
          </p>
          <p className="text-lg font-semibold tabular-nums text-violet-950">
            {balanceLoading ? "…" : formatted}{" "}
            <span className="text-sm font-medium text-violet-700/80">CRC</span>
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-violet-800/70">Recipient address</p>
          <div className="flex items-stretch gap-2">
            <Input
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="0x…"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              aria-invalid={recipient.length > 0 && !recipientAddress}
              className="h-10 border-pink-200/70 bg-white/80 font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => void handlePaste()}
              aria-label="Paste address"
              className="shrink-0 border-pink-200/60"
            >
              <ClipboardPaste />
            </Button>
          </div>
          {recipient.length > 0 && !recipientAddress ? (
            <p className="text-xs text-rose-600">Enter a valid Circles wallet address.</p>
          ) : null}
          {recipientAddress && recipientCheck.loading ? (
            <p className="text-xs text-violet-700/60">Checking Circles wallet…</p>
          ) : null}
          {recipientAddress && !recipientCheck.loading && recipientCheck.message ? (
            <div className="space-y-1 rounded-lg border border-amber-200/80 bg-amber-50/90 px-2.5 py-2">
              <p className="text-xs text-amber-900">{recipientCheck.message}</p>
              {recipientCheck.hint ? (
                <p className="text-xs text-amber-800/80">{recipientCheck.hint}</p>
              ) : null}
            </div>
          ) : null}
          {recipientAddress && !recipientCheck.loading && !recipientCheck.message ? (
            <p className="text-xs text-emerald-700">Address looks good — ready to send.</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-violet-800/70">Amount (CRC)</p>
          <Input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-invalid={amount.length > 0 && !amountValid}
            className="h-10 border-pink-200/70 bg-white/80"
          />
          {amount.length > 0 && !amountValid ? (
            <p className="text-xs text-rose-600">Enter an amount greater than zero.</p>
          ) : null}
          {insufficientBalance ? (
            <p className="text-xs text-rose-600">
              You only have {formatted} CRC. Add funds to your Circles wallet first.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-violet-800/70">Note (optional)</p>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Thanks for visiting!"
            rows={2}
            className="border-pink-200/70 bg-white/80 text-sm"
          />
        </div>

        <p className="text-xs text-violet-700/60">
          You may see two wallet prompts — trust setup first, then the CRC send. Approve each one.
        </p>

        <Button
          type="button"
          onClick={() => void handleSend()}
          disabled={!canSend}
          className="w-full"
        >
          {sending ? <LoaderCircle className="animate-spin" /> : <Send />}
          Send CRC
        </Button>
      </CardContent>
    </Card>
  )
}
