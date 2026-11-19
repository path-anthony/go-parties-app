import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { OccasionId } from "@/data/catalog"
import type { DirectBooking, ReviewReceipt } from "@/lib/adminApi"
import type { PaymentOffer } from "@/lib/paymentApi"
import type { TierInfo } from "@/lib/tierApi"
import type { SignatureValues } from "@/components/go/contract/signature"
import type { VerifiedAddress } from "@/lib/places"
import type { LatLng } from "@/lib/maps"
import { needsConfig, type AddonGroup, type Picks } from "@/lib/addons"
import { usePublicSettings } from "@/lib/settings"
import { isPerGuest } from "@/lib/pricing"
import { loadCart, saveCart, tooManyText } from "@/lib/cartStore"

/* Single booking store. The occasion and sub-occasion picked on Home, then
   the cart and everything the real checkout (/item/*) needs: items with
   their picks, the package they came from, date, time, contact, address,
   and the admin's answer. One refresh rule applies to all of it.

   Block FIX1: this is the one cart. The shop, the drawer, checkout and Ask
   GO all read and change it (Ask GO's own cart is gone), the header counts
   it, and it is saved in the browser (lib/cartStore.ts) so a reload or a new
   tab keeps it. A successful hold or request marks it placed: the saved
   copy is emptied and the header reads 0 at once, while the confirmation
   screens still read what was booked; the next change starts a fresh cart.
   The occasion is never saved (a stale one went out on leads, BUGS-AUDIT
   item 5), and a new Ask GO conversation forgets it (forgetOccasion). */

/* One admin catalog item, as returned inside an Ask GO recommendation or a
   package. quantity is how many units to hold; missing means one. */
export interface DirectItem {
  id: string
  name: string
  category: string
  price: number | null
  priceUnit: string | null
  /* The admin's customer-facing description (Block A7), shown under the
     name on the Ask GO cart rows and in the drawer; nothing when null. */
  description?: string | null
  /* The admin's photo (a URL or an inline data URL). Missing or null shows
     the photo plate instead. */
  photoUrl?: string | null
  quantity?: number
  /* The item's add-on groups as the admin sent them, and what was picked
     (group id to addon id). Picks ride on the item, so every screen and the
     booking request know which item a choice belongs to. */
  addonGroups?: AddonGroup[]
  picks?: Picks
}

/* The package a cart came from, when it did. Its bundle price is the total
   and its id travels with the booking. Any change to the cart's items
   clears it: a package with something added or removed is not the package. */
export interface Bundle {
  id: string
  name: string
  /* The bundle price, or for a per-guest package (perGuest set) the price
     for each guest. Read through lib/guests.ts, never as the total. */
  price: number
  /* Block S9a (admin Block A8): a per-guest package costs base + price x
     guests, for min to max guests (max null: no limit). */
  perGuest?: { base: number; min: number; max: number | null }
}

export interface BookingState {
  occ: OccasionId | null
  subOcc: string | null
  items: DirectItem[]
  bundle: Bundle | null
  /* True when the cart arrived as a batch with things to configure (Ask GO,
     a package): checkout then opens with the options step. Browse
     configures each item as it is added and has no such step. */
  optionsStep: boolean
  itemMonth: number
  itemDate: string | null
  itemTime: string | null
  contactName: string
  phone: string
  email: string
  /* Required since S2: the "add it later" switch is gone. */
  address: string
  /* Block S3: the home address typed on the event step when the account
     has none, and whether the event address is the home address. */
  homeAddress: string
  sameAsHome: boolean
  /* True once this checkout showed the sign-in step (S3), so the step
     count keeps that step after the customer signs in mid-flow. */
  accountStep: boolean
  /* The red line the sign-in step shows when a hold answered 401
     account-required (S3); cleared once the customer signs in. */
  accountNotice: string | null
  /* Block M: the address as Google verified it (a full street address with
     its point), the setup pin, and the notes for the crew. Null until a
     suggestion is picked; cleared only when the address text changes, so
     the pin survives every other step. The plain `address` is the formatted
     address while this is set. */
  verified: VerifiedAddress | null
  /* Block S6: the home address picked on the event step (an account with
     none on file), verified the same way. "Same as my home address" copies
     it, with its place id, into `verified`. */
  homeVerified: VerifiedAddress | null
  setup: LatLng | null
  setupNotes: string
  /* Block S9a: the guest count, a whole number or null; optional on every
     order, required for a per-guest package. guestBad is true while the
     field holds something that is not a count, so the screen can wait. */
  guestCount: number | null
  guestBad: boolean
  /* The checkbox on the last screen, the real state, never pre-checked. */
  agreed: boolean
  /* Bot checks sent with the booking: the honeypot (stays empty) and when the
     cart was started, in milliseconds. */
  hp: string
  formStartedAt: number
  /* The admin's tier answer for this cart and date, with the contract quote
     when it is tier 2. Null until asked, and cleared by anything that changes
     what the contract would say (items, picks, package, date, time,
     occasion), so a stale quote is never signed. */
  tier: TierInfo | null
  /* The signature typed on the tier 2 contract, kept here so the screen can
     be left and come back to. Cleared with the tier. */
  signature: SignatureValues
  /* What the admin offered to collect after the hold (the retainer), or null
     when online payment is not available. */
  payment: PaymentOffer | null
  direct: DirectBooking | null
  /* The admin's 202: sent to the team, nothing held. Its own screen. */
  review: ReviewReceipt | null
  changeFor: { bookingId: string; itemName: string; eventDate: string } | null
  /* Block FIX1: the admin's refusal of one item (a quantity it cannot
     hold, a per-guest item booked out that day), its own sentence, by item
     id, shown beside that item in the cart. Cleared by any change to the
     cart or the date. */
  itemNotices: Record<string, string>
  /* True once a hold or request went through (see above). */
  placed: boolean
}

const INITIAL: BookingState = {
  occ: null,
  subOcc: null,
  items: [],
  bundle: null,
  optionsStep: false,
  itemMonth: 0,
  itemDate: null,
  itemTime: null,
  contactName: "",
  phone: "",
  email: "",
  address: "",
  homeAddress: "",
  sameAsHome: false,
  accountStep: false,
  accountNotice: null,
  verified: null,
  homeVerified: null,
  setup: null,
  setupNotes: "",
  guestCount: null,
  guestBad: false,
  agreed: false,
  hp: "",
  formStartedAt: 0,
  tier: null,
  signature: { name: "", additional: "", consent: false },
  payment: null,
  direct: null,
  review: null,
  changeFor: null,
  itemNotices: {},
  placed: false,
}

/* What a fresh cart starts from after one was placed: nothing of the last
   booking, but the person's own details stay. */
const fresh = (prev: BookingState): BookingState => ({
  ...INITIAL,
  contactName: prev.contactName,
  phone: prev.phone,
  email: prev.email,
  homeAddress: prev.homeAddress,
})

interface BookingApi extends BookingState {
  set: <K extends keyof BookingState>(key: K, value: BookingState[K]) => void
  pick: (occ: OccasionId) => void
  pickItems: (items: DirectItem[], bundle?: Bundle) => void
  setItems: (items: DirectItem[]) => void
  setPicks: (itemId: string, picks: Picks) => void
  /* The guest field's value: a count, or null with bad set when what is
     typed is not one. A count changes what a per-guest package costs and
     what a tier 2 contract says, so it drops the tier answer then. */
  setGuests: (count: number | null, bad: boolean) => void
  /* Block FIX1: one item into the cart (or more of one already there),
     refused with the admin's limit as a sentence when the cart already holds
     "Most items in one booking" different items. */
  addItem: (item: DirectItem) => { ok: true } | { ok: false; message: string }
  /* The admin's limit on different items, null until settings load. */
  maxItems: number | null
  /* A new Ask GO conversation: the remembered occasion is dropped. */
  forgetOccasion: () => void
}

/* Anything that changes what the contract would say drops the tier answer,
   the quote and the signature with it. */
const CLEAR_TIER = { tier: null, signature: { name: "", additional: "", consent: false }, payment: null } as const

const Ctx = createContext<BookingApi | null>(null)

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<BookingState>(() => ({ ...INITIAL, ...loadCart() }))
  const settings = usePublicSettings()
  const maxItems = settings?.tokens.maxItemsPerBooking ?? null

  // The saved copy follows the cart; a placed cart saves as empty.
  useEffect(() => {
    saveCart(s.placed ? null : s)
  }, [s])

  const api = useMemo<BookingApi>(() => {
    const RESETS_TIER: (keyof BookingState)[] = ["itemDate", "itemTime", "occ", "subOcc"]
    const set = <K extends keyof BookingState>(key: K, value: BookingState[K]) =>
      setS((prev) => {
        // A hold (direct) or a request (review) that went through places the cart.
        const placing = (key === "direct" || key === "review") && value !== null ? { placed: true } : {}
        const dateNotices = key === "itemDate" && prev.itemDate !== value ? { itemNotices: {} } : {}
        return RESETS_TIER.includes(key) && prev[key] !== value ? { ...prev, [key]: value, ...CLEAR_TIER, ...dateNotices, ...placing } : { ...prev, [key]: value, ...placing }
      })
    // Any change to a placed cart starts a fresh one.
    const base = (prev: BookingState) => (prev.placed ? fresh(prev) : prev)
    return {
      ...s,
      set,
      maxItems,
      pick: (occ) => setS((prev) => ({ ...prev, occ, subOcc: null })),
      forgetOccasion: () => setS((prev) => (prev.occ === null && prev.subOcc === null ? prev : { ...prev, occ: null, subOcc: null, ...CLEAR_TIER })),
      addItem: (item) => {
        const cur = base(s)
        const have = cur.items.find((i) => i.id === item.id)
        if (!have && maxItems !== null && cur.items.length >= maxItems) return { ok: false, message: tooManyText(maxItems) }
        setS((p0) => {
          const prev = base(p0)
          const there = prev.items.find((i) => i.id === item.id)
          const items = there ? prev.items.map((i) => (i.id === item.id ? { ...i, quantity: (i.quantity ?? 1) + (item.quantity ?? 1) } : i)) : [...prev.items, item]
          return { ...prev, items, bundle: null, itemNotices: {}, ...CLEAR_TIER, formStartedAt: prev.items.length === 0 || prev.formStartedAt === 0 ? Date.now() : prev.formStartedAt }
        })
        return { ok: true }
      },
      pickItems: (items, bundle) =>
        setS((p0) => ({
          ...base(p0),
          items,
          bundle: bundle ?? null,
          optionsStep: items.some(needsConfig),
          accountStep: false,
          itemMonth: 0,
          itemDate: null,
          itemTime: null,
          agreed: false,
          guestCount: null,
          guestBad: false,
          hp: "",
          formStartedAt: Date.now(),
          ...CLEAR_TIER,
          direct: null,
          review: null,
          itemNotices: {},
        })),
      // The cart's first item is when the form started; an emptied cart ends it.
      setItems: (items) =>
        setS((p0) => {
          const prev = base(p0)
          return {
          ...prev,
          items,
          bundle: null,
          itemNotices: {},
          ...(items.length === 0 ? { accountStep: false, guestCount: null, guestBad: false } : {}),
          ...CLEAR_TIER,
          formStartedAt: items.length === 0 ? 0 : prev.items.length === 0 || prev.formStartedAt === 0 ? Date.now() : prev.formStartedAt,
          }
        }),
      setGuests: (count, bad) =>
        setS((prev) => {
          if (prev.guestCount === count && prev.guestBad === bad) return prev
          // Since Block FIX1 the count prices per-guest items too, so any
          // tier answer for a priced cart is stale once it changes.
          const asked = prev.bundle?.perGuest || prev.tier?.tier === 2 || prev.items.some(isPerGuest)
          return { ...prev, guestCount: count, guestBad: bad, ...(asked ? { ...CLEAR_TIER, itemNotices: {} } : {}) }
        }),
      // Not setItems: choosing an option doesn't change what the cart is, so
      // a package stays the package.
      setPicks: (itemId, picks) => setS((prev) => ({ ...prev, ...CLEAR_TIER, items: prev.items.map((i) => (i.id === itemId ? { ...i, picks } : i)) })),
    }
  }, [s, maxItems])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useBooking() {
  const v = useContext(Ctx)
  if (!v) throw new Error("useBooking outside BookingProvider")
  return v
}
