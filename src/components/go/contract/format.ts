import type { Cents } from "@/components/go/contract/types"

/* Money on the contract is whole cents: 350000 reads "$3,500.00". A null is
   an empty box; the string "-" is shown as written (the form's way of saying
   "none"). */
export function money(v: Cents): string {
  if (v === null) return ""
  if (v === "-") return "-"
  const sign = v < 0 ? "-" : ""
  return `${sign}$${(Math.abs(v) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const percent = (n: number | null): string => (n === null ? "" : `${n}%`)

/* A signature date, the way the form's DATE box reads it: "Oct 14, 2026". */
export function signedOn(iso: string | null): string {
  if (!iso) return ""
  const t = new Date(iso)
  if (Number.isNaN(t.getTime())) return iso
  return t.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" })
}
