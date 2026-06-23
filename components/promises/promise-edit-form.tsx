"use client"

import { useState } from "react"
import { LoaderCircle, Pencil } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { usePromiseMutations, type PromiseRecord } from "@/hooks/use-promises"
import { dueAtFromDateInput, toDateInputValue } from "@/lib/promises/dates"
import { getPinkieKind } from "@/lib/promises/kind"

type PromiseEditFormProps = {
  promise: PromiseRecord
  makerAddress: string
  onDone: () => void
}

export function PromiseEditForm({ promise, makerAddress, onDone }: PromiseEditFormProps) {
  const { edit } = usePromiseMutations()
  const kind = getPinkieKind(promise)
  const isSurprise = kind === "surprise"
  const [text, setText] = useState(promise.text)
  const [dueDate, setDueDate] = useState(toDateInputValue(promise.dueAt))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const trimmed = text.trim()
    if (trimmed.length < 4) {
      toast.error("Write a clear sentence — at least a few words.")
      return
    }

    setSaving(true)
    try {
      await edit({
        slug: promise.slug,
        actorAddress: makerAddress,
        text: trimmed,
        dueAt: dueAtFromDateInput(dueDate),
      })
      toast.success("Updated")
      onDone()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-pink-200/70 bg-white/80 p-3">
      <div className="space-y-2">
        <label htmlFor="edit-promise-text" className="text-xs font-medium text-violet-800">
          {isSurprise ? "I already…" : "I will…"}
        </label>
        <Textarea
          id="edit-promise-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          className="border-pink-200/70 bg-white text-sm"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="edit-promise-due" className="text-xs font-medium text-violet-800">
          {isSurprise ? "When?" : "By when?"}
        </label>
        <Input
          id="edit-promise-due"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="border-pink-200/70 bg-white text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <LoaderCircle className="animate-spin" /> : <Pencil />}
          Save changes
        </Button>
        <Button size="sm" variant="outline" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
