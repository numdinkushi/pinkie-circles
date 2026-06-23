"use client"

import { useState } from "react"
import { Gift, LoaderCircle, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { usePromiseMutations } from "@/hooks/use-promises"
import type { PinkieKind } from "@/lib/promises/kind"
import { defaultDueAt, dueAtFromDateInput, toDateInputValue } from "@/lib/promises/dates"
import { createPromiseSlug } from "@/lib/promises/slug"
import { cn } from "@/lib/utils"

type PromiseFormProps = {
  makerAddress: string
}

const KIND_OPTIONS: Array<{
  kind: PinkieKind
  title: string
  description: string
  icon: typeof Sparkles
}> = [
  {
    kind: "promise",
    title: "Promise",
    description: "Something you'll do — a friend witnesses before you close it.",
    icon: Sparkles,
  },
  {
    kind: "surprise",
    title: "Surprise",
    description: "Already done — share the link when you're ready to delight someone.",
    icon: Gift,
  },
]

export function PromiseForm({ makerAddress }: PromiseFormProps) {
  const router = useRouter()
  const { create } = usePromiseMutations()
  const [kind, setKind] = useState<PinkieKind>("promise")
  const [text, setText] = useState("")
  const [dueDate, setDueDate] = useState(toDateInputValue(defaultDueAt()))
  const [submitting, setSubmitting] = useState(false)

  const isSurprise = kind === "surprise"

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = text.trim()
    if (trimmed.length < 4) {
      toast.error("Write a clear sentence — at least a few words.")
      return
    }

    setSubmitting(true)
    try {
      const slug = createPromiseSlug()
      await create({
        slug,
        makerAddress,
        kind,
        text: trimmed,
        dueAt: dueAtFromDateInput(dueDate),
      })
      toast.success(isSurprise ? "Pinkie surprise created" : "Pinkie promise created")
      router.push(`/p/${slug}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Make it official</CardTitle>
        <CardDescription>
          A promise for the future, or a surprise for something you already did.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-2">
            {KIND_OPTIONS.map((option) => {
              const Icon = option.icon
              const active = kind === option.kind

              return (
                <button
                  key={option.kind}
                  type="button"
                  onClick={() => setKind(option.kind)}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left transition-all",
                    active
                      ? "border-pink-300 bg-gradient-to-br from-pink-50 to-violet-50 shadow-sm shadow-pink-200/30"
                      : "border-pink-100/80 bg-white/60 hover:border-pink-200 hover:bg-pink-50/40",
                  )}
                >
                  <span className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-violet-950">
                    <Icon className="size-3.5" />
                    {option.title}
                  </span>
                  <span className="block text-[11px] leading-snug text-violet-800/70">
                    {option.description}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="space-y-2">
            <label htmlFor="promise-text" className="text-sm font-medium">
              {isSurprise ? "I already…" : "I will…"}
            </label>
            <Textarea
              id="promise-text"
              placeholder={
                isSurprise
                  ? "fixed your bugs, picked up your favorite snack, sent the deck…"
                  : "review your resume, pick up milk, send the deck…"
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="promise-due" className="text-sm font-medium">
              {isSurprise ? "When?" : "By when?"}
            </label>
            <Input
              id="promise-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <LoaderCircle className="animate-spin" />
                Creating…
              </>
            ) : isSurprise ? (
              "Create surprise"
            ) : (
              "Create promise"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
