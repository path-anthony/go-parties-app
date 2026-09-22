import { createContext, useContext, useMemo, useState } from "react"
import type { OccasionId } from "@/data/catalog"
import type { DirectBooking } from "@/lib/adminApi"
import { needsConfig, type AddonGroup, type Picks } from "@/lib/addons"

/* Single booking store. The occasion and sub-occasion picked on Home, then
   the cart and everything the real checkout (/item/*) needs: items with
   their picks, the package they came from, date, time, contact, address,
   and the admin's answer. One refresh rule applies to all of it. */

/* One admin catalog item, as returned inside an Ask GO recommendation or a
   package. quantity is how many units to hold; missing means one. */
export interface DirectItem {
  id: string
  name: string
  category: string
  price: number | null
  priceUnit: string | null
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
  price: number
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
  /* The concierge offer after the date: "talk" (sent to Calendly), "skipped"
     (kept going), null until answered. The who screen requires an answer. */
  concierge: "talk" | "skipped" | null
  itemMonth: number
  itemDate: string | null
  itemTime: string | null
  itemTimeLater: boolean
  contactName: string
  phone: string
  email: string
  address: string
  addressLater: boolean
  direct: DirectBooking | null
  changeFor: { bookingId: string; itemName: string; eventDate: string } | null
}

const INITIAL: BookingState = {
  occ: null,
  subOcc: null,
  items: [],
  bundle: null,
  optionsStep: false,
  concierge: null,
  itemMonth: 0,
  itemDate: null,
  itemTime: null,
  itemTimeLater: false,
  contactName: "",
  phone: "",
  email: "",
  address: "",
  addressLater: false,
  direct: null,
  changeFor: null,
}

interface BookingApi extends BookingState {
  set: <K extends keyof BookingState>(key: K, value: BookingState[K]) => void
  pick: (occ: OccasionId) => void
  pickItems: (items: DirectItem[], bundle?: Bundle) => void
  setItems: (items: DirectItem[]) => void
  setPicks: (itemId: string, picks: Picks) => void
}

const Ctx = createContext<BookingApi | null>(null)

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<BookingState>(INITIAL)

  const api = useMemo<BookingApi>(() => {
    const set = <K extends keyof BookingState>(key: K, value: BookingState[K]) =>
      setS((prev) => ({ ...prev, [key]: value }))
    return {
      ...s,
      set,
      pick: (occ) => setS((prev) => ({ ...prev, occ, subOcc: null })),
      pickItems: (items, bundle) =>
        setS((prev) => ({
          ...prev,
          items,
          bundle: bundle ?? null,
          optionsStep: items.some(needsConfig),
          concierge: null,
          itemMonth: 0,
          itemDate: null,
          itemTime: null,
          itemTimeLater: false,
          direct: null,
        })),
      setItems: (items) => setS((prev) => ({ ...prev, items, bundle: null })),
      // Not setItems: choosing an option doesn't change what the cart is, so
      // a package stays the package.
      setPicks: (itemId, picks) => setS((prev) => ({ ...prev, items: prev.items.map((i) => (i.id === itemId ? { ...i, picks } : i)) })),
    }
  }, [s])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useBooking() {
  const v = useContext(Ctx)
  if (!v) throw new Error("useBooking outside BookingProvider")
  return v
}
