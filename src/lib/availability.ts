import { MONTHS, type OccasionId } from "@/data/catalog"

/* Simulated availability, v1. Deterministic function of the date, copied from
   the reference build. Fri Sat Sun only. Do not wire a backend. */

export interface DayCell {
  key: string
  weekday: string
  dayNum: number
  blocked: boolean
  iso?: string
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const pad = (n: number) => String(n).padStart(2, "0")

/* Calendar cells for the direct item path. Same Fri Sat Sun rhythm, but
   nothing is simulated: past days are grayed, every other day is checked
   live against the admin when tapped. iso is what the admin API wants. */
export function daysForItem(monthIndex: number): DayCell[] {
  const [mname, y, m] = MONTHS[monthIndex]
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days: DayCell[] = []
  const d = new Date(y, m, 1)
  while (d.getMonth() === m) {
    const wd = d.getDay()
    if (wd === 0 || wd === 6 || wd === 5) {
      days.push({
        key: `${mname} ${d.getDate()}`,
        weekday: WEEKDAYS[wd],
        dayNum: d.getDate(),
        blocked: d < today,
        iso: `${y}-${pad(m + 1)}-${pad(d.getDate())}`,
      })
    }
    d.setDate(d.getDate() + 1)
  }
  return days
}

/* "2026-10-10" to "Sat Oct 10", the BRAND.md date format. */
export function labelForIso(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return `${WEEKDAYS[date.getDay()]} ${MONTH_NAMES[m - 1]} ${d}`
}

export function daysFor(monthIndex: number, occ: OccasionId): DayCell[] {
  const [mname, y, m] = MONTHS[monthIndex]
  const days: DayCell[] = []
  const d = new Date(y, m, 1)
  while (d.getMonth() === m) {
    const wd = d.getDay()
    if (wd === 0 || wd === 6 || wd === 5) {
      const blocked = d.getDate() % 7 === 5 || (occ === "wedding" && d.getDate() % 3 === 0)
      days.push({ key: `${mname} ${d.getDate()}`, weekday: WEEKDAYS[wd], dayNum: d.getDate(), blocked })
    }
    d.setDate(d.getDate() + 1)
  }
  return days
}
