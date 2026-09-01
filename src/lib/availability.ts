import { MONTHS, type OccasionId } from "@/data/catalog"

/* Simulated availability, v1. Deterministic function of the date, copied from
   the reference build. Fri Sat Sun only. Do not wire a backend. */

export interface DayCell {
  key: string
  weekday: string
  dayNum: number
  blocked: boolean
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

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
