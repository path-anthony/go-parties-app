import { monthWindow } from "@/data/catalog"

/* Calendar cells for the direct item path. Every day that is not past can be
   tapped; there is no day-of-week rule. What is actually open (units, crew)
   is checked live against the admin when a day is tapped. Nothing is
   simulated. iso is what the admin API wants. */

export interface CalendarDay {
  iso: string
  dayNum: number
  /* Not in the past: tappable. */
  open: boolean
}

export interface CalendarMonth {
  title: string
  /* Empty cells before the 1st, Sunday first. */
  lead: number
  days: CalendarDay[]
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const MONTH_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const pad = (n: number) => String(n).padStart(2, "0")

export function calendarMonth(monthIndex: number): CalendarMonth {
  const [, y, m] = monthWindow()[monthIndex] ?? monthWindow()[0]
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days: CalendarDay[] = []
  const d = new Date(y, m, 1)
  const lead = d.getDay()
  while (d.getMonth() === m) {
    days.push({ iso: `${y}-${pad(m + 1)}-${pad(d.getDate())}`, dayNum: d.getDate(), open: d >= today })
    d.setDate(d.getDate() + 1)
  }
  return { title: `${MONTH_LONG[m]} ${y}`, lead, days }
}

/* "2026-10-10" to "Sat Oct 10", the BRAND.md date format. */
export function labelForIso(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return `${WEEKDAYS[date.getDay()]} ${MONTH_NAMES[m - 1]} ${d}`
}
