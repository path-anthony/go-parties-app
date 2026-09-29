/* Whether a date is short notice, the way the admin decides it (the admin's
   flag on the booking is the truth; this only drives the heads-up before the
   customer commits). An event date has no time of day: its first moment is
   midnight Eastern, compared with now on the Eastern wall clock. Zero hours
   turns the rule off, and a day already past is never rush. */
const ZONE = "America/New_York"

function easternNow(now: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: ZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(now)
      .map((p) => [p.type, Number(p.value)])
  )
  return parts as Record<"year" | "month" | "day" | "hour" | "minute", number>
}

export function isShortNotice(iso: string, minHours: number, now: Date = new Date()): boolean {
  if (minHours <= 0) return false
  const n = easternNow(now)
  const pad = (v: number) => String(v).padStart(2, "0")
  if (iso < `${n.year}-${pad(n.month)}-${pad(n.day)}`) return false
  const [y, m, d] = iso.split("-").map(Number)
  const hours = (Date.UTC(y, m - 1, d) - Date.UTC(n.year, n.month - 1, n.day, n.hour, n.minute)) / 3_600_000
  return hours < minHours
}
