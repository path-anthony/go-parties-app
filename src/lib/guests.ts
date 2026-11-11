import type { Bundle } from "@/state/booking"

/* Block S9a. The guest count. Every order may carry one (a whole number
   from 1 to 5000, sent as `guestCount` on the tier call, the hold and the
   request). A per-guest package (Block A8) is priced from it:
   base + price x guests, for the package's minimum to maximum. The admin is
   the judge (400 guest-count-required, guest-count-range, guest-count-invalid);
   the sentences here are its own, so a refusal reads the same either way. */

export const MAX_GUESTS = 5000

export const perGuestOf = (bundle: Bundle | null) => bundle?.perGuest ?? null

/* "25 to 100 guests", or "25 or more guests" with no maximum. */
export function guestRange(bundle: Bundle): string {
  const p = bundle.perGuest
  if (!p) return ""
  return p.max === null ? `${p.min} or more guests` : `${p.min} to ${p.max} guests`
}

/* The digits typed, as a count; null when empty or not a whole number in range. */
export function parseGuests(text: string): number | null {
  const t = text.trim()
  if (!/^\d{1,4}$/.test(t)) return null
  const n = Number(t)
  return n >= 1 && n <= MAX_GUESTS ? n : null
}

const inRange = (p: NonNullable<Bundle["perGuest"]>, n: number) => n >= p.min && (p.max === null || n <= p.max)

/* A per-guest package is priced only inside its range; any other cart
   needs nothing. */
export function guestsReady(bundle: Bundle | null, count: number | null): boolean {
  const p = perGuestOf(bundle)
  if (!p) return true
  return count !== null && inRange(p, count)
}

const cents = (n: number) => Math.round(n * 100) / 100

/* The package's price: the bundle for a fixed package, base + rate x guests
   for a per-guest one, and null for a per-guest one with no usable count. */
export function bundleTotal(bundle: Bundle, count: number | null): number | null {
  const p = bundle.perGuest
  if (!p) return bundle.price
  return count !== null && inRange(p, count) ? cents(p.base + bundle.price * count) : null
}

/* The lowest the package can cost: its price at the minimum count. */
export const bundleFrom = (bundle: Bundle): number => (bundle.perGuest ? cents(bundle.perGuest.base + bundle.price * bundle.perGuest.min) : bundle.price)

/* The sentence under the guest field, or null when the entry is fine. A
   blank entry is fine unless the package needs it (and has been left). */
export function guestProblem(bundle: Bundle | null, text: string, left: boolean): string | null {
  const t = text.trim()
  const p = perGuestOf(bundle)
  if (t === "") return p && left ? "Tell us how many guests, so we can price this package." : null
  const n = parseGuests(t)
  if (n === null) return `Enter a whole number of guests, from 1 to ${MAX_GUESTS}.`
  if (p && bundle && !inRange(p, n)) return `This package is for ${guestRange(bundle)}.`
  return null
}

/* True when the package is per guest and has no usable count yet. */
export const totalIsFrom = (bundle: Bundle | null, guests: number | null) => !!bundle && bundleTotal(bundle, guests) === null

/* The small line under a package total. */
export function bundleNote(bundle: Bundle, guests: number | null, extras: boolean): string {
  const tail = extras ? ", plus what you picked." : "."
  if (!bundle.perGuest) return `Package price, ${bundle.name}${tail}`
  const n = bundleTotal(bundle, guests) !== null ? guests : null
  return n !== null ? `Package price, ${bundle.name}, ${n} guests${tail}` : `Package price, ${bundle.name}. Add a guest count for the exact price (${guestRange(bundle)}).`
}
