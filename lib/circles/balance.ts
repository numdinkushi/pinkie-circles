export function parseCrcBalance(value: string | null | undefined): number {
  if (!value) return 0
  const normalized = value.replace(/,/g, "").trim()
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export function formatCrcBalance(value: string | null | undefined): string {
  if (!value) return "0"
  const normalized = value.replace(/,/g, "").trim()
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return value
  return parsed.toLocaleString(undefined, { maximumFractionDigits: 2 })
}
