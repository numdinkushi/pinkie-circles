import { cn } from "@/lib/utils"

type PromiseEditedLabelProps = {
  className?: string
}

export function PromiseEditedLabel({ className }: PromiseEditedLabelProps) {
  return (
    <span className={cn("text-xs italic text-violet-600/70", className)}>edited</span>
  )
}
