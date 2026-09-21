import { createContext, useContext, useMemo, useState } from "react"
import { PKGS, type OccasionId, type Pkg } from "@/data/catalog"
import type { DirectBooking } from "@/lib/adminApi"
import { needsConfig, type AddonGroup, type Picks } from "@/lib/addons"

/* Single booking store per docs/SCREENS.md: occ, month, date, time, guests,
   budget, pkg, swaps, addons, cat, addr, venue, power, water, held. The
   direct item path (item, itemMonth, itemDate, contactName, contact, direct)
   lives here too so one refresh rule applies everywhere. */

/* One admin catalog item, as returned inside an Ask GO recommendation or a
   package. quantity is how many units to hold; missing means one. */
export interface DirectItem {
  id: string
  name: string
  category: string
  price: number | null
  priceUnit: string | null
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
  month: number
  date: string | null
  time: string | null
  guests: string | null
  budget: number | null
  pkg: Pkg | null
  swaps: Record<number, string>
  addons: Record<string, number>
  cat: string
  addr: string
  venue: string
  power: boolean
  water: boolean
  held: boolean
  items: DirectItem[]
  bundle: Bundle | null
  /* True when the cart arrived as a batch with things to configure (Ask GO,
     a package): checkout then opens with the options step. Browse
     configures each item as it is added and has no such step. */
  optionsStep: boolean
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
  month: 0,
  date: null,
  time: null,
  guests: null,
  budget: null,
  pkg: null,
  swaps: {},
  addons: {},
  cat: "Fun foods",
  addr: "",
  venue: "Backyard",
  power: true,
  water: true,
  held: false,
  items: [],
  bundle: null,
  optionsStep: false,
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
  jump: (occ: OccasionId, id: string) => void
  suggest: () => void
  swapPkg: (id: string) => void
  toggleAddon: (name: string, price: number) => void
  total: () => number
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
      pick: (occ) =>
        setS((prev) => ({ ...prev, occ, subOcc: null, date: null, time: null, guests: null, budget: null, pkg: null, addons: {}, swaps: {}, month: 0 })),
      pickItems: (items, bundle) =>
        setS((prev) => ({
          ...prev,
          items,
          bundle: bundle ?? null,
          optionsStep: items.some(needsConfig),
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
      jump: (occ, id) =>
        setS((prev) => ({ ...prev, occ, pkg: PKGS[occ].find((p) => p.id === id) ?? null, addons: {}, swaps: {} })),
      suggest: () =>
        setS((prev) => {
          if (!prev.occ) return prev
          const list = PKGS[prev.occ]
          const b = prev.budget ?? 99999
          const pkg = [...list].reverse().find((p) => p.p <= b) ?? list[0]
          return { ...prev, pkg, addons: {}, swaps: {} }
        }),
      swapPkg: (id) =>
        setS((prev) => (prev.occ ? { ...prev, pkg: PKGS[prev.occ].find((p) => p.id === id) ?? prev.pkg, swaps: {} } : prev)),
      toggleAddon: (name, price) =>
        setS((prev) => {
          const addons = { ...prev.addons }
          if (addons[name]) delete addons[name]
          else addons[name] = price
          return { ...prev, addons }
        }),
      total: () => (s.pkg ? s.pkg.p : 0) + Object.values(s.addons).reduce((a, b) => a + b, 0),
    }
  }, [s])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useBooking() {
  const v = useContext(Ctx)
  if (!v) throw new Error("useBooking outside BookingProvider")
  return v
}
