import { createContext, useContext, useMemo, useState } from "react"
import { PKGS, type OccasionId, type Pkg } from "@/data/catalog"

/* Single booking store per docs/SCREENS.md: occ, month, date, time, guests,
   budget, pkg, swaps, addons, cat, addr, venue, power, water, held. */

export interface BookingState {
  occ: OccasionId | null
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
}

const INITIAL: BookingState = {
  occ: null,
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
}

interface BookingApi extends BookingState {
  set: <K extends keyof BookingState>(key: K, value: BookingState[K]) => void
  pick: (occ: OccasionId) => void
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
        setS((prev) => ({ ...prev, occ, date: null, time: null, guests: null, budget: null, pkg: null, addons: {}, swaps: {}, month: 0 })),
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
