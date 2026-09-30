/* Display formatting for the crew gig page. Every helper takes a possibly
   missing value and returns null when there is nothing to show, so a row can
   simply be left out. */

export const money = (n: number) => "$" + n.toLocaleString("en-US")

/* "Sat Oct 17" (the brand's date format) from "2026-10-17". */
export function shortDate(iso: string | null): string | null {
  if (!iso) return null
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).replace(",", "")
}

/* "6 PM to 10 PM", "Starts 6 PM", "Until 10 PM". */
export function timeRange(start: string | null, end: string | null): string | null {
  if (start && end) return `${start} to ${end}`
  if (start) return `Starts ${start}`
  if (end) return `Until ${end}`
  return null
}

/* "Kids birthday, 40 guests". */
export function eventLine(type: string | null, guests: number | null): string | null {
  const g = guests === null ? null : `${guests} ${guests === 1 ? "guest" : "guests"}`
  const line = [type, g].filter(Boolean).join(", ")
  return line || null
}

/* "Thu, Oct 2 at 9:00 AM" in Eastern, the zone the business keeps. */
export function easternWhen(iso: string | null): string | null {
  if (!iso) return null
  const t = new Date(iso)
  if (Number.isNaN(t.getTime())) return null
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .formatToParts(t)
      .map((x) => [x.type, x.value])
  )
  return `${p.weekday}, ${p.month} ${p.day} at ${p.hour}:${p.minute} ${p.dayPeriod}`
}

/* "Pay range: $250 to $350 for the whole gig". One end alone reads as a
   floor or a ceiling; neither reads as nothing. */
export function payLine(range: { min: number | null; max: number | null } | null): string | null {
  if (!range) return null
  const { min, max } = range
  if (min !== null && max !== null) return `Pay range: ${money(min)} to ${money(max)} for the whole gig`
  if (min !== null) return `Pay range: ${money(min)} or more for the whole gig`
  if (max !== null) return `Pay range: up to ${money(max)} for the whole gig`
  return null
}

/* A US E.164 number (+18608467715) as (860) 846-7715. Anything that is not
   one is returned exactly as sent, so nothing is ever mangled. */
export function usPhone(raw: string): string {
  const m = /^\+1([2-9]\d{2})([2-9]\d{2})(\d{4})$/.exec(raw)
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : raw
}
