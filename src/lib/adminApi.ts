/* Live calls to go-parties-admin, same base URL Ask GO uses. Both endpoints
   here are public on the admin side (no session) and rate limited there. */

import type { AddonGroup } from "@/lib/addons"

export const ADMIN_API = import.meta.env.VITE_ADMIN_API_URL || "http://localhost:3001"

export interface Availability {
  itemId: string
  date: string
  directBooking: boolean
  available: boolean
  freeUnits?: number
  totalUnits?: number
  message?: string
}

/* The public catalog, as the admin exposes it: name search (partial, case
   insensitive), exact category, and whether the item has units. With a
   date, only items with a free unit that day come back, each with
   freeUnits, in one request for the whole catalog. */
export interface PublicItem {
  id: string
  name: string
  category: string
  price: number | null
  priceUnit: string | null
  photoUrl: string | null
  hasUnits: boolean
  freeUnits?: number
  addonGroups?: AddonGroup[]
}

export async function publicItems(
  q: string,
  category: string,
  date: string | null,
  signal?: AbortSignal
): Promise<{ items: PublicItem[]; categories: string[] }> {
  const params = new URLSearchParams()
  if (q.trim()) params.set("q", q.trim())
  if (category) params.set("category", category)
  if (date) params.set("date", date)
  const qs = params.toString()
  const res = await fetch(`${ADMIN_API}/api/items/public${qs ? `?${qs}` : ""}`, { signal })
  if (!res.ok) throw new Error(`public items ${res.status}`)
  return res.json()
}

export async function checkAvailability(itemId: string, iso: string): Promise<Availability> {
  const res = await fetch(`${ADMIN_API}/api/items/${encodeURIComponent(itemId)}/availability?date=${iso}`)
  if (!res.ok) throw new Error(`availability ${res.status}`)
  return res.json()
}

/* item and unit are the single-item shape; items is the multi-item shape. A
   response carries one or the other. */
export interface DirectBooking {
  bookingId: string
  leadId: string
  eventDate: string
  /* Old field (any live booking reads "Confirmed"); stage is the real one.
     Nothing on the Held screen reads either: it reads rush. */
  status: string
  stage?: string
  depositPaid: boolean
  /* The admin's own call that the date is inside its notice window: the
     booking is held pending and a person confirms it. Never recomputed here. */
  rush?: boolean
  /* What the admin quoted: the package's bundle price, or the items times
     quantity. Null when nothing had a price. */
  total: number | null
  /* The add-ons as the admin recorded them, each tied to its item. The
     price delta is per unit; quantity is the units of that item held. */
  addonsTotal?: number
  addons?: Array<{ itemId: string; itemName: string; addonId: string; groupName: string; addonName: string; priceDelta: number; quantity: number }>
  packageId: string | null
  package: { id: string; name: string; price: number } | null
  item?: { id: string; name: string }
  unit?: { id: string; label: string }
  /* One entry per unit held, so an item wanted twice appears twice. */
  items?: Array<{ id: string; name: string; unit: { id: string; label: string } }>
}

export const bookedNames = (b: DirectBooking): string[] =>
  b.items ? [...new Set(b.items.map((i) => i.name))] : b.item ? [b.item.name] : []

export type DirectReason = "unavailable" | "not-tracked" | "addons" | "agreement" | "error"

/* The admin's 202: the cart is over the review threshold or is for an
   occasion on the review list, so nothing was held. It is a design request
   for staff, an expected outcome and not an error. message is the admin's own
   words for the customer. */
export interface ReviewReceipt {
  designRequestId: string
  eventDate: string
  total: number | null
  message: string
}

/* message is always fit to show: the admin's own words for a date that is
   taken, an item that isn't bookable, or an add-on choice that is missing
   or no longer offered (all written for the customer), and the bank's calm
   line for everything else. detail keeps the admin's raw text
   for the console, never for the screen. */
export type DirectResult =
  | { ok: true; kind: "held"; booking: DirectBooking }
  | { ok: true; kind: "review"; review: ReviewReceipt }
  | { ok: false; reason: DirectReason; message: string; detail?: string }

const FALLBACK = "That didn't go through. Try again, or text us."
const REVIEW_FALLBACK = "This one goes to our team first. Nothing is held yet; we'll be in touch to put it together with you."

/* How the customer wants the remaining balance handled after the deposit.
   Only a preference the admin records; nothing charges or sends from it. */
export type BalancePreference = "Manual" | "Auto-charge" | "Reminder link"

/* address and eventTime are optional on the storefront ("fill in later") and
   travel as null when skipped. customerName, phone and email always go
   (directInput fills them from the account when signed in); the admin
   requires phone and email together, so both are sent or neither is.
   credentials: "include" carries the customer_session cookie so the booking
   attaches to the account. One item goes as itemId (the original contract);
   two or more go only as itemIds, so an admin without multi-item support
   refuses the whole request instead of quietly booking the first one.
   packageId goes along when the cart is a package as published: the admin
   checks the items match, holds the package's quantities, and charges its
   bundle price. */
export async function bookDirect(input: {
  itemIds: string[]
  packageId: string | null
  addons: Record<string, string[]> | null
  eventDate: string
  customerName: string | null
  phone: string | null
  email: string | null
  address: string | null
  eventTime: string | null
  /* A group or sub-occasion in the admin's spelling, when the cart has one. */
  occasion: string | null
  /* The real state of the checkbox, always sent (false when there is none). */
  agreedToPolicy: boolean
  balancePaymentPreference: BalancePreference
}): Promise<DirectResult> {
  const { customerName, phone, email, itemIds, packageId, addons, occasion, ...rest } = input
  const body: Record<string, unknown> = { ...rest }
  if (occasion) body.occasion = occasion
  if (itemIds.length === 1) body.itemId = itemIds[0]
  else body.itemIds = itemIds
  if (packageId) body.packageId = packageId
  // { [itemId]: [addonId, ...] }, the admin's shape; left out when empty.
  if (addons) body.addons = addons
  if (customerName) body.customerName = customerName
  if (phone && email) {
    body.phone = phone
    body.email = email
  }
  const res = await fetch(`${ADMIN_API}/api/bookings/direct`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 201) return { ok: true, kind: "held", booking: data as DirectBooking }
  if (res.status === 202 && data.reviewRequired === true && typeof data.designRequestId === "string") {
    return {
      ok: true,
      kind: "review",
      review: {
        designRequestId: data.designRequestId,
        eventDate: typeof data.eventDate === "string" ? data.eventDate : input.eventDate,
        total: typeof data.total === "number" ? data.total : null,
        message: typeof data.message === "string" && data.message ? data.message : REVIEW_FALLBACK,
      },
    }
  }
  const reason: DirectReason =
    data.reason === "agreement-required"
      ? "agreement"
      : data.reason === "unavailable" || data.reason === "not-tracked"
        ? data.reason
        : data.reason === "addon-required" || data.reason === "addon-invalid"
          ? "addons"
          : "error"
  const detail = typeof data.error === "string" ? data.error : undefined
  if (reason === "error") {
    console.warn(`direct booking refused (${res.status}): ${detail ?? "no detail"}`)
    return { ok: false, reason, message: FALLBACK, detail }
  }
  return { ok: false, reason, message: detail ?? FALLBACK }
}

/* Published packages for one sub-occasion, as the admin exposes them: a
   curated bundle of real catalog items with one manual price (not a sum).
   The storefront treats a package as a pre-filled cart of its items. */
export interface PublicPackageItem {
  itemId: string
  name: string
  category: string
  price: number | null
  priceUnit: string | null
  quantity: number
  addonGroups?: AddonGroup[]
}

export interface PublicPackage {
  id: string
  name: string
  description: string | null
  price: number
  theme: string | null
  occasion: string
  photoUrl: string | null
  items: PublicPackageItem[]
}

export async function publicPackages(occasion: string, signal?: AbortSignal): Promise<PublicPackage[]> {
  const params = new URLSearchParams({ occasion })
  const res = await fetch(`${ADMIN_API}/api/packages/public?${params}`, { signal })
  if (!res.ok) throw new Error(`packages ${res.status}`)
  const data = (await res.json()) as { packages: PublicPackage[] }
  return data.packages
}
