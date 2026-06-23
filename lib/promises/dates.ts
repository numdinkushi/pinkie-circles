const DAY_MS = 24 * 60 * 60 * 1000

export function defaultDueAt(daysFromNow = 3) {
  return Date.now() + daysFromNow * DAY_MS
}

export function formatDueDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp))
}

export function dueLabel(timestamp: number) {
  const diff = timestamp - Date.now()
  if (diff < 0) return "Overdue"
  if (diff < DAY_MS) return "Due today"
  if (diff < 2 * DAY_MS) return "Due tomorrow"
  return `Due ${formatDueDate(timestamp)}`
}

export function isOverdue(timestamp: number) {
  return timestamp < Date.now()
}

export function toDateInputValue(timestamp: number) {
  const date = new Date(timestamp)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 10)
}

export function dueAtFromDateInput(value: string) {
  const parsed = new Date(`${value}T23:59:59`)
  return parsed.getTime()
}
