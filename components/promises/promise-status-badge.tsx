import { Badge } from "@/components/ui/badge"
import { dueLabel, isOverdue } from "@/lib/promises/dates"
import type { PromiseStatus } from "@/lib/promises/kind"
import { cn } from "@/lib/utils"

type PromiseStatusBadgeProps = {
  status: PromiseStatus
  dueAt: number
  className?: string
}

export function PromiseStatusBadge({ status, dueAt, className }: PromiseStatusBadgeProps) {
  if (status === "acknowledged") {
    return (
      <Badge
        className={cn(
          "border-0 bg-gradient-to-r from-pink-400 to-violet-400 text-white shadow-sm",
          className,
        )}
      >
        Acknowledged
      </Badge>
    )
  }

  if (status === "done") {
    return (
      <Badge
        className={cn(
          "border-0 bg-gradient-to-r from-emerald-400 to-teal-400 text-white shadow-sm",
          className,
        )}
      >
        Done
      </Badge>
    )
  }

  const overdue = isOverdue(dueAt)
  return (
    <Badge
      variant="outline"
      className={cn(
        overdue
          ? "border-rose-300 bg-rose-50 text-rose-700"
          : "border-violet-200 bg-violet-50 text-violet-700",
        className,
      )}
    >
      {dueLabel(dueAt)}
    </Badge>
  )
}
