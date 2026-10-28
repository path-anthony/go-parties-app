import { useEffect, useState, useSyncExternalStore } from "react"
import { publicItems, publicPackages, type PublicItem, type PublicPackage } from "@/lib/adminApi"
import { OCC, SUB_OCC, type OccasionId } from "@/data/catalog"

/* The store's view of the admin's public catalog (Block S1). Three reads,
   each cached for the page's life and shared by the header, Home, the
   store and Ask GO:
   - the whole catalog with no date (every item, the category list), for
     counts, search suggestions and the grid;
   - what is free on one date (GET /api/items/public?date=), kept per date,
     for the availability line, the filter and the swaps;
   - every published package: one call with no occasion (Block A2), or, on
     an older admin, one call per occasion name merged by id. */

export interface Catalog {
  items: PublicItem[]
  categories: string[]
}

/* One shared catalog state for every subscriber (the header, the menu,
   Home, the store, Ask GO): the first read starts the fetch, every later
   mount joins it, and one success updates all of them at once. A failed
   read is retried a few times with a pause (the catalog is a 400 KB
   answer and a phone on a weak signal drops it), and `retryCatalog` is
   the "Try again" for the screens. S1.2: Home used to render "See all 0
   items" with no tiles while the fetch was in flight or after one
   failure, with no way back. */

export type CatalogState = { status: "loading" } | { status: "ready"; items: PublicItem[]; categories: string[] } | { status: "failed" }

const RETRIES = 3
const RETRY_MS = [1200, 3000, 6000]
let state: CatalogState = { status: "loading" }
let inFlight = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

async function fetchCatalog(attempt = 0): Promise<void> {
  inFlight = true
  try {
    const d = await publicItems("", "", null)
    state = { status: "ready", items: d.items, categories: d.categories }
    inFlight = false
    emit()
  } catch {
    if (attempt < RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_MS[attempt] ?? 6000))
      return fetchCatalog(attempt + 1)
    }
    state = { status: "failed" }
    inFlight = false
    emit()
  }
}

/* Starts the read if nothing is loaded or in flight. */
export function loadCatalog(): Promise<Catalog> {
  if (state.status !== "ready" && !inFlight) {
    state = { status: "loading" }
    emit()
    void fetchCatalog()
  }
  if (state.status === "ready") return Promise.resolve({ items: state.items, categories: state.categories })
  return new Promise((resolve, reject) => {
    const l = () => {
      if (state.status === "ready") {
        listeners.delete(l)
        resolve({ items: state.items, categories: state.categories })
      } else if (state.status === "failed") {
        listeners.delete(l)
        reject(new Error("catalog failed"))
      }
    }
    listeners.add(l)
  })
}

export function retryCatalog() {
  if (state.status === "failed") loadCatalog().catch(() => {})
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
const snapshot = () => state

export function useCatalog(): CatalogState {
  useEffect(() => {
    loadCatalog().catch(() => {})
  }, [])
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}

/* Free units by item id on one date; an item missing from the map is
   booked solid that day. */
export type OpenMap = Map<string, number>
const openP = new Map<string, Promise<OpenMap>>()
export function loadOpen(iso: string): Promise<OpenMap> {
  let p = openP.get(iso)
  if (!p) {
    p = publicItems("", "", iso)
      .then((d) => new Map(d.items.map((i) => [i.id, i.freeUnits ?? 1])))
      .catch((e) => {
        openP.delete(iso)
        throw e
      })
    openP.set(iso, p)
  }
  return p
}

export type OpenState = { status: "none" } | { status: "loading" } | { status: "ready"; iso: string; open: OpenMap } | { status: "failed" }

export function useOpenOn(iso: string | null): OpenState {
  // Only the last answer is kept; the status is derived from whether it is
  // for the date asked, so no state is set in the effect itself.
  const [last, setLast] = useState<{ iso: string; open: OpenMap | null } | null>(null)
  useEffect(() => {
    if (!iso) return
    let live = true
    loadOpen(iso)
      .then((open) => live && setLast({ iso, open }))
      .catch(() => live && setLast({ iso, open: null }))
    return () => {
      live = false
    }
  }, [iso])
  if (!iso) return { status: "none" }
  if (!last || last.iso !== iso) return { status: "loading" }
  return last.open ? { status: "ready", iso, open: last.open } : { status: "failed" }
}

let packagesP: Promise<PublicPackage[]> | null = null
export function loadPackages(): Promise<PublicPackage[]> {
  if (!packagesP) {
    // Packages are published under sub-occasions ("Birthday", "Sweet 16")
    // and sometimes a group ("Kids party"); every name the storefront knows
    // is asked, in parallel, well inside the admin's public rate limit.
    const names = [...new Set([...(Object.keys(OCC) as OccasionId[]).map((k) => OCC[k].label), ...(Object.values(SUB_OCC).flat().filter((o) => o !== "Other"))])]
    const perOccasion = () =>
      Promise.all(names.map((g) => publicPackages(g).catch(() => [] as PublicPackage[]))).then((lists) => {
        const seen = new Map<string, PublicPackage>()
        for (const p of lists.flat()) if (!seen.has(p.id)) seen.set(p.id, p)
        return [...seen.values()]
      })
    // One call with no occasion first (Block A2); a 400 from an older admin
    // falls back to the per-occasion calls.
    packagesP = publicPackages(null)
      .catch(perOccasion)
      .catch((e) => {
        packagesP = null
        throw e
      })
  }
  return packagesP
}

export type PackagesState = { status: "loading" } | { status: "ready"; list: PublicPackage[] } | { status: "failed" }

export function useAllPackages(): PackagesState {
  const [s, setS] = useState<PackagesState>({ status: "loading" })
  useEffect(() => {
    let live = true
    loadPackages()
      .then((list) => live && setS({ status: "ready", list }))
      .catch(() => live && setS({ status: "failed" }))
    return () => {
      live = false
    }
  }, [])
  return s
}

/* The price line as the store prints it: "$450" or "$250 per panel", or
   the admin's wording when there is no number. */
export const priceText = (price: number | null, unit: string | null): string => {
  if (price !== null) return `$${price.toLocaleString("en-US")}${unit ? ` ${unit}` : ""}`
  return unit || "Text us for a price"
}
