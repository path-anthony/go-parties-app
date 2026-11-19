import type { BookingState, Bundle, DirectItem } from "@/state/booking"

/* Block FIX1. The cart, saved in the browser so a reload, a new tab or a
   phone that drops the page keeps it (BUGS-AUDIT item 4). Only the cart is
   saved: the items with their picks and quantities, the package, the party
   date and time, and the guest count. Never the occasion, a contact detail,
   a tier answer, a signature or a payment. The admin prices and checks every
   item again at the tier call and the hold, so a saved price that has since
   changed is corrected there.

   Every read and write is wrapped: private windows, a full disk or blocked
   storage fall back to the cart in memory, which works for the visit. A
   copy saved by another version of this shape is dropped, not read. */

const KEY = "go-cart"
const VERSION = 1

type Saved = Pick<BookingState, "items" | "bundle" | "itemDate" | "itemTime" | "itemMonth" | "guestCount" | "formStartedAt" | "optionsStep">

let memoryOnly = false

const isItem = (v: unknown): v is DirectItem => {
  const i = v as DirectItem
  return !!i && typeof i.id === "string" && typeof i.name === "string" && (i.price === null || typeof i.price === "number")
}

export function loadCart(): Partial<BookingState> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const d = JSON.parse(raw) as { v?: number } & Partial<Saved>
    if (d.v !== VERSION || !Array.isArray(d.items) || !d.items.every(isItem)) {
      localStorage.removeItem(KEY)
      return {}
    }
    const iso = typeof d.itemDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.itemDate) ? d.itemDate : null
    // A party date that has passed is not kept.
    const today = new Date().toISOString().slice(0, 10)
    return {
      items: d.items,
      bundle: d.bundle && typeof (d.bundle as Bundle).id === "string" ? (d.bundle as Bundle) : null,
      itemDate: iso && iso >= today ? iso : null,
      itemTime: iso && iso >= today && typeof d.itemTime === "string" ? d.itemTime : null,
      itemMonth: typeof d.itemMonth === "number" ? d.itemMonth : 0,
      guestCount: typeof d.guestCount === "number" && d.guestCount >= 1 ? d.guestCount : null,
      formStartedAt: typeof d.formStartedAt === "number" ? d.formStartedAt : 0,
      optionsStep: d.optionsStep === true,
    }
  } catch {
    return {}
  }
}

/* null (or an empty cart) removes the saved copy. */
export function saveCart(s: BookingState | null) {
  if (memoryOnly) return
  try {
    if (!s || (s.items.length === 0 && !s.itemDate)) {
      localStorage.removeItem(KEY)
      return
    }
    const saved: Saved & { v: number } = {
      v: VERSION,
      items: s.items,
      bundle: s.bundle,
      itemDate: s.itemDate,
      itemTime: s.itemTime,
      itemMonth: s.itemMonth,
      guestCount: s.guestCount,
      formStartedAt: s.formStartedAt,
      optionsStep: s.optionsStep,
    }
    localStorage.setItem(KEY, JSON.stringify(saved))
  } catch {
    // Storage refused: the cart lives in memory for this visit.
    memoryOnly = true
  }
}

/* "A booking can have up to 40 items. ..." (Block FIX1, the admin's
   "Most items in one booking"). */
export const tooManyText = (max: number) => `A booking can have up to ${max} items. Remove one to add another, or call or text us and we'll put it together with you.`
