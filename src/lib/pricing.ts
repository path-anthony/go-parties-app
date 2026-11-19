import { fmt } from "@/data/catalog"
import type { Bundle, DirectItem } from "@/state/booking"
import { bundleFrom, bundleTotal } from "@/lib/guests"
import { pickedOf } from "@/lib/addons"

/* Block FIX1. The admin's one pricing rule (its server/pricing.ts, S9-CONTRACT
   section 18), mirrored so the cart can show a figure before the admin is
   asked. Once a tier answer is in, its `lines` and `total` are what the
   screens show; this is the same arithmetic, never a different rule.

     An item billed per guest costs its price x the guest count. Its
     quantity is ignored (it is one line), and it needs a count.
     Any other item costs its price x its quantity. "Per 10 guests" is
     not per guest: it is sold in tens, by quantity.
     A package keeps its own price.
     An option's price change is multiplied the same way as its item. */

const PER_GUEST_UNITS = new Set(["per guest", "per person", "per head"])

export function isPerGuestUnit(priceUnit: string | null | undefined): boolean {
  return priceUnit ? PER_GUEST_UNITS.has(priceUnit.trim().toLowerCase().replace(/\s+/g, " ")) : false
}

export const isPerGuest = (item: Pick<DirectItem, "priceUnit">) => isPerGuestUnit(item.priceUnit)

/* Units of the item held: one for a per-guest item. */
export const qtyOf = (item: DirectItem) => (isPerGuest(item) ? 1 : Math.max(1, Math.floor(item.quantity ?? 1)))

const cents = (n: number) => Math.round(n * 100) / 100

/* What the price is multiplied by, or null for a per-guest item with no
   usable count yet. Inside a package nothing is per guest on its own. */
function multiplierOf(item: DirectItem, guests: number | null, inPackage: boolean): number | null {
  if (!inPackage && isPerGuest(item)) return guests !== null && guests >= 1 ? guests : null
  return qtyOf(item)
}

const deltaOf = (item: DirectItem) => pickedOf(item).reduce((s, { addon }) => s + addon.priceDelta, 0)

/* The line's dollars, options included; null when it has no price or is
   per guest with no count yet. */
export function lineTotal(item: DirectItem, guests: number | null, inPackage = false): number | null {
  const m = multiplierOf(item, guests, inPackage)
  if (m === null) return null
  if (inPackage) return cents(deltaOf(item) * m)
  if (item.price === null) return null
  return cents((item.price + deltaOf(item)) * m)
}

/* One option's price change as charged: times the item's multiplier. */
export function optionTotal(item: DirectItem, priceDelta: number, guests: number | null, inPackage = false): number {
  return cents(priceDelta * (multiplierOf(item, guests, inPackage) ?? 1))
}

export interface CartPrice {
  /* The total, or the lowest it can be when something waits on a count. */
  total: number
  /* True when the total leaves something out: a per-guest item or a
     per-guest package with no usable count yet. */
  partial: boolean
  /* The per-guest items in the cart, by name, outside a package. */
  perGuestNames: string[]
}

export function cartPrice(items: DirectItem[], bundle: Bundle | null, guests: number | null): CartPrice {
  const inPackage = !!bundle
  const perGuestNames = inPackage ? [] : items.filter(isPerGuest).map((i) => i.name)
  const options = items.reduce((s, i) => s + (inPackage ? (lineTotal(i, guests, true) ?? 0) : 0), 0)
  if (bundle) {
    const base = bundleTotal(bundle, guests)
    return { total: cents((base ?? bundleFrom(bundle)) + options), partial: base === null, perGuestNames }
  }
  const lines = items.map((i) => lineTotal(i, guests))
  const partial = items.some((i, k) => isPerGuest(i) && i.price !== null && lines[k] === null)
  return { total: cents(lines.reduce<number>((s, l) => s + (l ?? 0), 0)), partial, perGuestNames }
}

/* The count of things in the cart, a per-guest line counting once. */
export const cartCount = (items: DirectItem[]) => items.reduce((n, i) => n + qtyOf(i), 0)

/* True when the cart needs a guest count before checkout: a per-guest item
   is in it and there is no usable count. */
export const needsGuests = (items: DirectItem[], bundle: Bundle | null, guests: number | null) =>
  !bundle && items.some(isPerGuest) && !(guests !== null && guests >= 1)

/* The admin's own sentence for a missing count (guest-count-required),
   written the same way so a refusal and the field read alike. */
export function guestCountSentence(names: string[]): string {
  const list = names.length <= 2 ? names.join(" and ") : `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`
  return `Tell us how many guests, so we can price ${list}. ${names.length === 1 ? "It is" : "They are"} priced per guest.`
}

/* The price line under an item's name:
     per guest, counted:   "100 guests x $58.56 = $5,856"
     per guest, no count:  "$58.56 per guest. Add a guest count."
     a quantity:           "3 x $8 = $24"
     one:                  "$450" (with a key unit when there is one) */
export function priceLine(item: DirectItem, guests: number | null): string | null {
  if (item.price === null) return null
  if (isPerGuest(item)) {
    if (guests === null || guests < 1) return `${fmt(item.price)} per guest. Add a guest count.`
    return `${guests} ${guests === 1 ? "guest" : "guests"} x ${fmt(item.price)} = ${fmt(cents(item.price * guests))}`
  }
  const q = qtyOf(item)
  return q > 1 ? `${q} x ${fmt(item.price)} = ${fmt(cents(item.price * q))}` : null
}
