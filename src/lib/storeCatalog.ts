import { useEffect, useState } from "react"
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

let catalogP: Promise<Catalog> | null = null
export function loadCatalog(): Promise<Catalog> {
  if (!catalogP) {
    catalogP = publicItems("", "", null)
      .then((d) => ({ items: d.items, categories: d.categories }))
      .catch((e) => {
        catalogP = null
        throw e
      })
  }
  return catalogP
}

export type CatalogState = { status: "loading" } | { status: "ready"; items: PublicItem[]; categories: string[] } | { status: "failed" }

export function useCatalog(): CatalogState {
  const [s, setS] = useState<CatalogState>({ status: "loading" })
  useEffect(() => {
    let live = true
    loadCatalog()
      .then((c) => live && setS({ status: "ready", ...c }))
      .catch(() => live && setS({ status: "failed" }))
    return () => {
      live = false
    }
  }, [])
  return s
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
