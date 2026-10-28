import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AppShell } from "@/components/go/AppShell"
import { ImagePlaceholder } from "@/components/go/ImagePlaceholder"
import { Button } from "@/components/ui/button"
import type { PublicPackage } from "@/lib/adminApi"
import { needsConfig } from "@/lib/addons"
import { retryCatalog, useAllPackages, useCatalog } from "@/lib/storeCatalog"
import { fmt } from "@/data/catalog"
import { useBooking, type DirectItem } from "@/state/booking"
import { useStoreUi } from "@/state/store"
import { useAsk } from "@/state/ask"
import { cn } from "@/lib/utils"

/* Home (Block S1): the hero with no buttons, then the two ways to start
   (Build my party with Ask GO, or Shop by category), then the party
   packages. On a phone the two ways are tabs and one panel shows at a
   time; on a desktop both panels show in order. Packages come from
   /api/packages/public (every group, merged). Nothing else lives here. */

/* Each hero photo ships as WebP with a JPEG fallback, 1200px wide, under
   180 KB each (the originals live in reference/photos-original, out of
   the bundle). */
const HERO = [
  { src: "/photos/welcome/wedding", alt: "A wedding couple sharing a quiet moment", position: "56% center" },
  { src: "/photos/welcome/adult-party", alt: "A party crowd on the dance floor", position: "center" },
  { src: "/photos/welcome/corporate", alt: "A corporate event audience facing the stage", position: "center" },
]
const webpOk = () => {
  try {
    return document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp")
  } catch {
    return false
  }
}
const CROSSFADE_MS = 6000

function Hero() {
  const [on, setOn] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  // Only the photo on screen (and the one fading out) is in the page, so a
  // phone downloads one hero photo on load; the next one is fetched
  // quietly a few seconds before its turn.
  useEffect(() => {
    const id = setInterval(() => {
      setOn((i) => {
        setPrev(i)
        return (i + 1) % HERO.length
      })
    }, CROSSFADE_MS)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    const t = setTimeout(() => {
      const img = new Image()
      img.src = `${HERO[(on + 1) % HERO.length].src}.${webpOk() ? "webp" : "jpg"}`
    }, CROSSFADE_MS / 2)
    return () => clearTimeout(t)
  }, [on])
  const eyebrow = "Farmington, CT · 5.0 on Google"
  const title = "Parties and events, done door to door."
  return (
    <section className="grid overflow-hidden rounded-[14px] min-[641px]:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] min-[641px]:items-center min-[641px]:gap-8 min-[641px]:overflow-visible">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#ECE7E0] min-[641px]:aspect-auto min-[641px]:h-[260px] min-[641px]:rounded-[14px]">
        {HERO.map((h, i) =>
          i === on || i === prev ? (
            <picture key={h.src}>
              <source srcSet={`${h.src}.webp`} type="image/webp" />
              <img
                src={`${h.src}.jpg`}
                alt={i === on ? h.alt : ""}
                width={1200}
                height={798}
                loading="eager"
                fetchPriority={i === 0 ? "high" : "auto"}
                className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-1000", i === on ? "opacity-100" : "opacity-0")}
                style={{ objectPosition: h.position }}
              />
            </picture>
          ) : null
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(33,29,28,.05)_30%,rgba(33,29,28,.82)_100%)] min-[641px]:hidden" />
        <div className="absolute right-4 bottom-4 left-4 text-white min-[641px]:hidden">
          <small className="block text-[11px] font-bold tracking-[.14em] text-[#F3D9B1] uppercase">{eyebrow}</small>
          <h1 className="mt-1.5 text-[24px] leading-[1.1] font-black tracking-[-.02em]">{title}</h1>
        </div>
      </div>
      <div className="hidden min-[641px]:grid min-[641px]:gap-3">
        <small className="block text-[11px] font-bold tracking-[.14em] text-[#8A4E00] uppercase">{eyebrow}</small>
        <h1 className="max-w-[20ch] text-[clamp(26px,3.2vw,38px)] leading-[1.1] font-black tracking-[-.02em] text-charcoal">{title}</h1>
        <p className="max-w-[46ch] text-[15px] leading-[1.55] text-charcoal-soft">
          Bounce houses, games, DJs, photo booths and lighting. The GO crew delivers it, sets it up and takes it down.
        </p>
      </div>
    </section>
  )
}

const HINTS = [
  ["Graduation party", "Graduation party for 60 in the backyard"],
  ["Company picnic", "Company picnic for 150 people"],
  ["Sweet 16", "Sweet 16 with a DJ and lights"],
]

function BuildPanel({ id, labelledBy }: { id?: string; labelledBy?: string }) {
  const { start } = useAsk()
  const [text, setText] = useState("")
  return (
    <section id={id} role={labelledBy ? "tabpanel" : undefined} aria-labelledby={labelledBy} className="grid gap-2.5 rounded-[14px] bg-charcoal p-4 text-white min-[641px]:p-5">
      <label htmlFor="ask-home" className="text-[15px] font-bold">
        Not sure what you need? <span className="text-orange">Ask GO.</span>
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
          className="min-h-[48px] min-w-0 flex-1 rounded-[10px] bg-white px-3.5 py-3 text-[16px] text-charcoal placeholder:text-muted focus:outline-none"
        />
        <Button type="submit" className="min-h-[48px]">
          Build my party
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {HINTS.map(([label, prompt]) => (
          <button key={label} type="button" className="min-h-[44px] rounded-full border border-[#4A4441] min-[641px]:min-h-[36px] px-3 py-1.5 text-[12.5px] font-semibold text-[#D9D2CC]" onClick={() => start(prompt)}>
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
        <p className="mb-3 text-body text-charcoal">
          That didn't go through.{" "}
          <button className="min-h-[44px] font-bold underline underline-offset-2" onClick={retryCatalog}>
            Try again
          </button>
        </p>
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
      {packages.status === "failed" && <p className="text-body text-charcoal">That didn't go through. Try again, or text us.</p>}
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
  const [door, setDoor] = useState<"build" | "shop">("build")
  return (
    <AppShell layout="store">
      <div className="rise grid gap-7 py-4 min-[641px]:gap-9 min-[641px]:py-6">
        <Hero />
        <div className="grid gap-3 min-[641px]:gap-7">
          <div role="tablist" aria-label="How do you want to plan?" className="grid grid-cols-2 gap-2 min-[641px]:hidden">
            {(
              [
                ["build", "Build my party", "Tell GO what you're planning"],
                ["shop", "Shop by category", "Pick items yourself"],
              ] as const
            ).map(([id, label, sub]) => (
              <button
                key={id}
                id={`door-${id}`}
                role="tab"
                aria-selected={door === id}
                aria-controls={`panel-${id}`}
                className={cn(
                  "grid min-h-[64px] gap-0.5 rounded-[12px] border px-3 py-3 text-left",
                  door === id ? "border-charcoal bg-charcoal text-white" : "border-line bg-white text-charcoal"
                )}
                onClick={() => setDoor(id)}
              >
                <b className="text-[15px]">{label}</b>
                <small className={cn("text-[12px]", door === id ? "text-[#CFC8C2]" : "text-muted")}>{sub}</small>
              </button>
            ))}
          </div>
          <div className={cn(door === "build" ? "" : "hidden", "min-[641px]:block")}>
            <BuildPanel id="panel-build" labelledBy="door-build" />
          </div>
          <div className={cn(door === "shop" ? "" : "hidden", "min-[641px]:block")}>
            <ShopPanel id="panel-shop" labelledBy="door-shop" />
          </div>
        </div>
        <Packages />
      </div>
    </AppShell>
  )
}
