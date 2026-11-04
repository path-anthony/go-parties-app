import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AppShell } from "@/components/go/AppShell"
import { Hero, type Door } from "@/components/go/Hero"
import { ImagePlaceholder } from "@/components/go/ImagePlaceholder"
import { Button } from "@/components/ui/button"
import type { PublicPackage } from "@/lib/adminApi"
import { needsConfig } from "@/lib/addons"
import { retryCatalog, useAllPackages, useCatalog } from "@/lib/storeCatalog"
import { fmt } from "@/data/catalog"
import { useBooking, type DirectItem } from "@/state/booking"
import { useStoreUi } from "@/state/store"
import { ErrorNotice } from "@/components/go/ErrorNotice"
import { useAsk } from "@/state/ask"

/* Home (Block S4): the hero (its photos from GET /api/hero) with the
   "How do you want to plan?" switch on it, then the one panel it picks
   (Build my party: the white Ask GO box; Shop by category: the category
   tiles), on every width, then the party packages. Packages come from
   /api/packages/public (every group, merged). A catalog that will not load
   says so in red (S2). Nothing else lives here. */

const HINTS = [
  ["Graduation party", "Graduation party for 60 in the backyard"],
  ["Company picnic", "Company picnic for 150 people"],
  ["Sweet 16", "Sweet 16 with a DJ and lights"],
]

function BuildPanel({ id, labelledBy }: { id?: string; labelledBy?: string }) {
  const { start } = useAsk()
  const [text, setText] = useState("")
  return (
    <section id={id} role={labelledBy ? "tabpanel" : undefined} aria-labelledby={labelledBy} className="grid gap-3 rounded-[16px] border border-line bg-white p-4 min-[641px]:p-5">
      <label htmlFor="ask-home" className="text-[16px] font-bold text-charcoal">
        Tell GO about your party
      </label>
      <form
        className="flex flex-col gap-2.5 min-[641px]:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          start(text)
        }}
      >
        <input
          id="ask-home"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Kid's birthday, 25 guests, backyard, about $800"
          autoComplete="off"
          className="min-h-[48px] min-w-0 flex-1 rounded-[10px] border-[1.5px] border-line bg-white px-3.5 py-3 text-[16px] text-charcoal placeholder:text-muted focus:border-charcoal focus:outline-none"
        />
        <Button type="submit" className="min-h-[48px]">
          Build my party
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {HINTS.map(([label, prompt]) => (
          <button key={label} type="button" className="min-h-[44px] rounded-full border border-line bg-white px-3 py-1.5 text-[12.5px] font-semibold text-charcoal min-[641px]:min-h-[36px]" onClick={() => start(prompt)}>
            {label}
          </button>
        ))}
      </div>
    </section>
  )
}

function ShopPanel({ id, labelledBy }: { id?: string; labelledBy?: string }) {
  const navigate = useNavigate()
  const { start } = useAsk()
  const catalog = useCatalog()
  const cats = catalog.status === "ready" ? catalog.categories : []
  const items = catalog.status === "ready" ? catalog.items : []
  const photoFor = (c: string) => items.find((i) => i.category === c && i.photoUrl)?.photoUrl ?? null
  return (
    <section id={id} role={labelledBy ? "tabpanel" : undefined} aria-labelledby={labelledBy}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-extrabold tracking-[-.01em] text-charcoal min-[641px]:text-[21px]">Shop by category</h2>
        <button className="min-h-[44px] text-[13px] font-bold whitespace-nowrap text-[#8A4E00]" onClick={() => navigate("/browse")}>
          {catalog.status === "ready" ? `See all ${items.length} items` : "See the store"}
        </button>
      </div>
      {catalog.status === "loading" && <p className="mb-3 text-body text-muted">Loading the catalog.</p>}
      {catalog.status === "failed" && (
        <ErrorNotice className="mb-3" scroll={false}>
          That didn't go through.{" "}
          <button className="min-h-[44px] font-bold underline underline-offset-2" onClick={retryCatalog}>
            Try again
          </button>
        </ErrorNotice>
      )}
      <div className="grid grid-cols-2 gap-2.5 min-[641px]:grid-cols-4 min-[641px]:gap-3.5">
        {catalog.status === "loading" &&
          [0, 1, 2, 3].map((i) => (
            <div key={i} aria-hidden="true" className="grid gap-2">
              <ImagePlaceholder className="aspect-[3/2] w-full rounded-[10px]" />
              <span className="h-4 w-2/3 rounded bg-[#ECE7E0]" />
            </div>
          ))}
        {cats.map((c) => {
          const photo = photoFor(c)
          const n = items.filter((i) => i.category === c).length
          return (
            <button key={c} className="grid gap-2 text-left" onClick={() => navigate(`/browse?cat=${encodeURIComponent(c)}`)}>
              {photo ? (
                <img src={photo} alt="" loading="lazy" width={300} height={200} className="aspect-[3/2] w-full rounded-[10px] object-cover" />
              ) : (
                <ImagePlaceholder className="aspect-[3/2] w-full rounded-[10px]" />
              )}
              <b className="text-sm text-charcoal">
                {c} <small className="ml-1 text-[12px] font-medium text-muted">{n} {n === 1 ? "item" : "items"}</small>
              </b>
            </button>
          )
        })}
        <button className="grid gap-2 text-left" onClick={() => start()}>
          <span className="flex aspect-[3/2] w-full items-center justify-center rounded-[10px] bg-charcoal px-3 text-center text-[13px] font-semibold text-[#CFC8C2]">Not listed? Ask GO</span>
          <b className="text-sm text-charcoal">Something else</b>
        </button>
      </div>
    </section>
  )
}

function Packages() {
  const navigate = useNavigate()
  const b = useBooking()
  const { setPartyOpen } = useStoreUi()
  const packages = useAllPackages()

  // The package is its items, each with its quantity, plus the bundle: the
  // admin holds that many units of each and charges the bundle price.
  const add = (p: PublicPackage) => {
    const items: DirectItem[] = p.items.map((i) => ({
      id: i.itemId,
      name: i.name,
      category: i.category,
      price: i.price,
      priceUnit: i.priceUnit,
      description: i.description ?? null,
      quantity: i.quantity,
      addonGroups: i.addonGroups,
    }))
    if (items.length === 0) return
    const iso = b.itemDate
    b.pickItems(items, { id: p.id, name: p.name, price: p.price })
    if (iso) b.set("itemDate", iso)
    if (items.some(needsConfig)) {
      navigate(`/item/${items[0].id}/options`)
      return
    }
    setPartyOpen(true)
  }

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[21px] font-extrabold tracking-[-.01em] text-charcoal">Party packages</h2>
      </div>
      {packages.status === "loading" && <p className="text-body text-muted">Finding packages.</p>}
      {packages.status === "failed" && <ErrorNotice scroll={false}>That didn't go through. Try again, or text us.</ErrorNotice>}
      {packages.status === "ready" && packages.list.length === 0 && <p className="text-body text-charcoal-soft">No packages yet. Ask GO can build one, or shop by category.</p>}
      {packages.status === "ready" && packages.list.length > 0 && (
        <div className="grid gap-3.5 min-[641px]:grid-cols-2 min-[901px]:grid-cols-3">
          {packages.list.map((p) => (
            <article key={p.id} className="grid content-start overflow-hidden rounded-[14px] border border-line bg-white">
              {p.photoUrl ? (
                <img src={p.photoUrl} alt="" loading="lazy" width={480} height={300} className="aspect-[16/10] w-full object-cover" />
              ) : (
                <ImagePlaceholder className="aspect-[16/10] w-full" />
              )}
              <div className="grid gap-2 p-4">
                {p.tag && <span className="text-[11px] font-bold tracking-[.08em] text-[#8A4E00] uppercase">{p.tag}</span>}
                <h3 className="text-[17px] font-extrabold text-charcoal">{p.name}</h3>
                <ul className="text-[13px] leading-[1.6] text-charcoal-soft">
                  {p.items.map((i) => (
                    <li key={i.itemId}>
                      {i.name}
                      {i.quantity > 1 ? ` x ${i.quantity}` : ""}
                    </li>
                  ))}
                </ul>
                <div className="mt-1 flex items-center justify-between gap-2.5">
                  <span className="text-[18px] font-extrabold text-charcoal">
                    {fmt(p.price)}
                    {p.guestNote && <small className="block max-w-[22ch] truncate text-[11px] font-semibold text-muted">{p.guestNote}</small>}
                  </span>
                  <Button variant="dark" size="sm" className="min-h-[44px]" onClick={() => add(p)}>
                    Add package
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default function Home() {
  const [door, setDoor] = useState<Door>("build")
  return (
    <AppShell layout="store">
      <div className="rise grid gap-6 pt-0 pb-4 min-[641px]:gap-8 min-[641px]:py-6">
        <Hero door={door} onDoor={setDoor} />
        {/* The switch on the hero picks one panel, on every width. */}
        <div className={door === "build" ? "" : "hidden"}>
          <BuildPanel id="panel-build" labelledBy="door-build" />
        </div>
        <div className={door === "shop" ? "" : "hidden"}>
          <ShopPanel id="panel-shop" labelledBy="door-shop" />
        </div>
        <Packages />
      </div>
    </AppShell>
  )
}
