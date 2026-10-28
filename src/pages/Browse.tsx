import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { AppShell } from "@/components/go/AppShell"
import { AddonSheet } from "@/components/go/AddonSheet"
import { ImagePlaceholder } from "@/components/go/ImagePlaceholder"
import { groupsOf, needsConfig, type Picks } from "@/lib/addons"
import { labelForIso } from "@/lib/availability"
import type { PublicItem } from "@/lib/adminApi"
import { priceText, useCatalog, useOpenOn } from "@/lib/storeCatalog"
import { useBooking, type DirectItem } from "@/state/booking"
import { useStoreUi } from "@/state/store"
import { useAsk } from "@/state/ask"
import { cn } from "@/lib/utils"

/* The store (Block S1). The whole catalog, with multi-select filters
   (category, free on the party date, price), a separate sort, removable
   pills and a live count. Everything lives in the URL (?cat=&price=&free=
   &sort=&q=) so links share and Back works. Desktop: a sticky sidebar and
   the sort at the grid's top right; phone: a Filters button and the sort
   select side by side, the filters in a bottom panel. Add puts the item in
   Your party and opens the drawer; an item with add-on groups answers them
   first. Availability is the admin's answer for the date in the booking
   store; with no date, cards show no line and the filter is off. */

const PRICES: [string, string, (p: number) => boolean][] = [
  ["u200", "Under $200", (p) => p < 200],
  ["200-500", "$200 to $500", (p) => p >= 200 && p <= 500],
  ["500-1000", "$500 to $1,000", (p) => p > 500 && p <= 1000],
  ["o1000", "Over $1,000", (p) => p > 1000],
]
const SORTS: [string, string][] = [
  ["pop", "Popular"],
  ["lo", "Price low to high"],
  ["hi", "Price high to low"],
  ["az", "Name A to Z"],
]

const toDirect = (i: PublicItem, picks?: Picks): DirectItem => ({
  id: i.id,
  name: i.name,
  category: i.category,
  price: i.price,
  priceUnit: i.priceUnit,
  photoUrl: i.photoUrl,
  addonGroups: i.addonGroups,
  picks,
})

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : [])

export default function Browse() {
  const [params, setParams] = useSearchParams()
  const b = useBooking()
  const { setPartyOpen, setDateOpen } = useStoreUi()
  const { start } = useAsk()
  const catalog = useCatalog()
  const iso = b.itemDate
  const open = useOpenOn(iso)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [configuring, setConfiguring] = useState<PublicItem | null>(null)

  const cats = list(params.get("cat"))
  const prices = list(params.get("price"))
  const free = params.get("free") === "1" && !!iso
  const sort = params.get("sort") ?? "pop"
  const q = params.get("q") ?? ""

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k)
      else next.set(k, v)
    }
    setParams(next)
  }
  const toggle = (key: "cat" | "price", value: string) => {
    const cur = key === "cat" ? cats : prices
    const next = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value]
    update({ [key]: next.join(",") })
  }
  const clearAll = () => setParams(new URLSearchParams())

  const all = catalog.status === "ready" ? catalog.items : []
  const categories = catalog.status === "ready" ? catalog.categories : []
  const freeUnits = (id: string): number | null => (open.status === "ready" ? open.open.get(id) ?? 0 : null)

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const out = all.filter(
      (i) =>
        (cats.length === 0 || cats.includes(i.category)) &&
        (prices.length === 0 || (i.price !== null && PRICES.some(([k, , f]) => prices.includes(k) && f(i.price as number)))) &&
        (!free || (freeUnits(i.id) ?? 1) > 0) &&
        (!needle || `${i.name} ${i.category}`.toLowerCase().includes(needle))
    )
    const price = (i: PublicItem) => i.price ?? Number.POSITIVE_INFINITY
    if (sort === "lo") out.sort((x, y) => price(x) - price(y))
    else if (sort === "hi") out.sort((x, y) => (y.price ?? -1) - (x.price ?? -1))
    else if (sort === "az") out.sort((x, y) => x.name.localeCompare(y.name))
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, cats.join(","), prices.join(","), free, q, sort, open])

  const inCart = (id: string) => b.items.find((i) => i.id === id)
  const add = (item: PublicItem) => {
    const have = inCart(item.id)
    if (have) {
      const cap = freeUnits(item.id)
      const qty = have.quantity ?? 1
      if (cap !== null && qty >= cap) return
      b.setItems(b.items.map((i) => (i.id === item.id ? { ...i, quantity: qty + 1 } : i)))
    } else if (needsConfig(item)) {
      setConfiguring(item)
      return
    } else {
      b.setItems([...b.items, toDirect(item)])
    }
    setPartyOpen(true)
  }
  const confirmOptions = (picks: Picks) => {
    if (!configuring) return
    b.setItems([...b.items, toDirect(configuring, picks)])
    setConfiguring(null)
    setPartyOpen(true)
  }

  const dayLabel = iso ? labelForIso(iso) : null
  const nFilters = cats.length + prices.length + (free ? 1 : 0)
  const pills: [string, () => void][] = [
    ...(q ? [[`"${q}"`, () => update({ q: null })] as [string, () => void]] : []),
    ...cats.map((c) => [c, () => toggle("cat", c)] as [string, () => void]),
    ...(free ? [[`Free ${dayLabel}`, () => update({ free: null })] as [string, () => void]] : []),
    ...prices.map((k) => [PRICES.find((p) => p[0] === k)?.[1] ?? k, () => toggle("price", k)] as [string, () => void]),
  ]

  const groups = (
    <>
      <div>
        <h4 className="mb-2 text-[11px] font-bold tracking-[.12em] text-muted uppercase">Category</h4>
        <div className="grid">
          {categories.map((c) => (
            <label key={c} className="flex min-h-[44px] cursor-pointer items-center gap-2.5 px-0.5 text-sm text-charcoal">
              <input type="checkbox" className="size-[18px] flex-none accent-charcoal" checked={cats.includes(c)} onChange={() => toggle("cat", c)} />
              {c}
              <small className="ml-auto text-[12px] text-muted">{all.filter((i) => i.category === c).length}</small>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-[11px] font-bold tracking-[.12em] text-muted uppercase">Availability</h4>
        {iso ? (
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 px-0.5 text-sm text-charcoal">
            <input type="checkbox" className="size-[18px] flex-none accent-charcoal" checked={free} onChange={(e) => update({ free: e.target.checked ? "1" : null })} />
            Free on {dayLabel}
          </label>
        ) : (
          <button
            className="min-h-[44px] text-left text-sm font-bold text-[#8A4E00]"
            onClick={() => {
              setFiltersOpen(false)
              setDateOpen(true)
            }}
          >
            Pick a date to see what's free
          </button>
        )}
      </div>
      <div>
        <h4 className="mb-2 text-[11px] font-bold tracking-[.12em] text-muted uppercase">Price</h4>
        <div className="grid">
          {PRICES.map(([k, label]) => (
            <label key={k} className="flex min-h-[44px] cursor-pointer items-center gap-2.5 px-0.5 text-sm text-charcoal">
              <input type="checkbox" className="size-[18px] flex-none accent-charcoal" checked={prices.includes(k)} onChange={() => toggle("price", k)} />
              {label}
            </label>
          ))}
        </div>
      </div>
    </>
  )

  const sortSelect = (cls: string) => (
    <select aria-label="Sort" value={sort} onChange={(e) => update({ sort: e.target.value === "pop" ? null : e.target.value })} className={cls}>
      {SORTS.map(([k, label]) => (
        <option key={k} value={k}>
          Sort: {label}
        </option>
      ))}
    </select>
  )

  return (
    <AppShell layout="store">
      <div className="rise grid gap-6 py-4 min-[901px]:grid-cols-[210px_minmax(0,1fr)] min-[901px]:py-6">
        <aside className="sticky top-[calc(var(--hdr,0px)+16px)] hidden content-start gap-5 self-start min-[901px]:grid">{groups}</aside>
        <div className="min-w-0">
          <div className="mb-2.5 flex gap-2 min-[901px]:hidden">
            <Button variant="ghost" className="min-h-[44px] flex-1 py-2.5 text-[14px]" onClick={() => setFiltersOpen(true)}>
              Filters{nFilters ? ` (${nFilters})` : ""}
            </Button>
            {sortSelect("min-h-[44px] min-w-0 flex-1 rounded-[12px] border-[1.5px] border-line bg-white px-3 text-[14px] font-bold text-charcoal")}
          </div>
          {pills.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {pills.map(([label, off]) => (
                <button key={label} aria-label={`Remove ${label}`} className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-charcoal min-[641px]:min-h-[36px] py-1.5 pr-2.5 pl-3 text-[13px] font-semibold text-white" onClick={off}>
                  {label}
                  <span aria-hidden="true" className="text-[15px] leading-none opacity-75">×</span>
                </button>
              ))}
              <button className="min-h-[44px] px-1 text-[13px] font-bold text-[#8A4E00] min-[641px]:min-h-[36px]" onClick={clearAll}>
                Clear all
              </button>
            </div>
          )}
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
            <span className="text-[13px] text-charcoal-soft">
              {catalog.status === "ready" ? `${results.length} of ${all.length} items` : catalog.status === "failed" ? "That didn't go through. Try again, or text us." : "Loading the catalog."}
            </span>
            <div className="hidden min-[901px]:block">{sortSelect("rounded-[8px] border border-line bg-white px-2.5 py-1.5 text-[13px] text-charcoal")}</div>
          </div>
          {catalog.status === "ready" && results.length === 0 && (
            <div className="rounded-[12px] border border-line bg-white px-5 py-10 text-center text-body text-charcoal-soft">
              Nothing matches that yet.
              <button className="mx-auto mt-1 block min-h-[44px] font-bold text-[#8A4E00]" onClick={() => start(q || undefined)}>
                Ask GO to find it
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2.5 min-[641px]:grid-cols-3 min-[641px]:gap-4 min-[1101px]:grid-cols-4">
            {results.map((item) => {
              const have = inCart(item.id)
              const units = freeUnits(item.id)
              const booked = units !== null && units === 0
              const atCap = !!have && units !== null && (have.quantity ?? 1) >= units
              return (
                <article key={item.id} className="grid min-w-0 content-start gap-1.5 rounded-[12px] border border-line bg-white p-2 pb-2.5">
                  {item.photoUrl ? (
                    <img src={item.photoUrl} alt="" loading="lazy" width={300} height={300} className="aspect-square w-full rounded-[8px] object-cover" />
                  ) : (
                    <ImagePlaceholder className="aspect-square w-full rounded-[8px]" />
                  )}
                  {dayLabel && units !== null && (
                    <span className={cn("text-[11px] font-bold", booked ? "text-[#A8382C]" : "text-good")}>
                      {booked ? `Booked ${dayLabel}` : `Free on ${dayLabel}`}
                    </span>
                  )}
                  <h3 className="text-[14px] leading-[1.25] font-bold text-charcoal">{item.name}</h3>
                  {needsConfig(item) && <small className="text-[11px] text-muted">Options: {groupsOf(item).map((g) => g.name).join(", ")}</small>}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="min-w-0 text-[14px] font-extrabold text-charcoal">
                      {item.price !== null ? `$${item.price.toLocaleString("en-US")}` : ""}
                      {item.price !== null && item.priceUnit && <small className="ml-1 text-[11px] font-medium text-muted">{item.priceUnit}</small>}
                      {item.price === null && <small className="text-[11px] font-medium text-muted">{priceText(null, item.priceUnit)}</small>}
                    </span>
                    <button
                      className={cn(
                        "min-h-[40px] flex-none rounded-[8px] px-3 text-[12px] font-bold",
                        have ? "bg-orange text-charcoal" : "bg-charcoal text-white",
                        "disabled:bg-line disabled:text-muted"
                      )}
                      disabled={booked || atCap}
                      onClick={() => add(item)}
                    >
                      {have ? `Added ${have.quantity ?? 1}` : "Add"}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>
      <Drawer open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DrawerContent className="max-h-[85vh]">
          <div className="flex min-h-0 flex-1 flex-col">
            <DrawerTitle className="flex items-center justify-between border-b border-line px-5 py-3 text-base font-extrabold text-charcoal">
              Filters
              <DrawerClose asChild>
                <button className="min-h-[44px] px-2 text-sm font-bold text-charcoal">Close</button>
              </DrawerClose>
            </DrawerTitle>
            <div className="grid min-h-0 flex-1 content-start gap-5 overflow-y-auto px-5 py-3">{groups}</div>
            <div className="flex gap-2.5 border-t border-line px-5 pt-3 pb-5">
              <Button variant="ghost" className="flex-1" onClick={clearAll}>
                Clear all
              </Button>
              <Button variant="dark" className="flex-1" onClick={() => setFiltersOpen(false)}>
                Show {results.length} {results.length === 1 ? "item" : "items"}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
      <AddonSheet item={configuring} onClose={() => setConfiguring(null)} onConfirm={confirmOptions} />
    </AppShell>
  )
}
