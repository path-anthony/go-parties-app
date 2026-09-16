import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search } from "lucide-react"
import { AppShell, Body } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { HeroCarousel, type Slide } from "@/components/go/HeroCarousel"
import { OccasionCard } from "@/components/go/OccasionCard"
import { Chip } from "@/components/go/Chip"
import { Reveal } from "@/components/go/DatePicker"
import { AskCard } from "@/components/go/AskCard"
import { Rail } from "@/components/go/Rail"
import { PackageCard } from "@/components/go/PackageCard"
import { Button } from "@/components/ui/button"
import { publicPackages, type PublicPackage } from "@/lib/adminApi"
import { useBooking, type DirectItem } from "@/state/booking"
import { useCustomer } from "@/state/customer"
import { useAsk } from "@/state/ask"
import { OCC, SUB_OCC, type OccasionId } from "@/data/catalog"

/* Home, one continuous screen at both "/" and "/home". The photo carousel
   sits on top (the old Welcome hero; its value props now ride the captions),
   then the greeting and the three doors in this order: Ask GO as a card (the
   AI event builder), the Build-your-own row (date first, then a cart,
   /browse), and the occasion cards (sub-occasion chips reveal beneath, then
   the packages the admin has published for that sub-occasion, live from
   GET /api/packages/public, then Continue). A package is a pre-filled cart
   of its real items: tapping one hands them to the same /item/:id checkout
   every other door uses. No packages for a sub-occasion says so plainly.
   No gate in front of any of it; sign in lives in the header menu and on
   My party. "Recommended for you" lives on My party. Nothing here overlays
   anything else. */

const HERO_SLIDES: Slide[] = [
  {
    src: "/photos/welcome/wedding.jpg",
    alt: "Wedding couple sharing a quiet moment",
    position: "56% center",
    eyebrow: "FARMINGTON, CT",
    title: "Party on. We'll handle it.",
  },
  {
    src: "/photos/welcome/adult-party.jpg",
    alt: "Adult party crowd celebrating on the dance floor",
    eyebrow: "REAL DATES",
    title: "If you can pick it, we can make it.",
  },
  {
    src: "/photos/welcome/corporate.jpg",
    alt: "Corporate event audience facing the stage",
    eyebrow: "DOOR TO DOOR",
    title: "Delivery, setup, the fun, teardown.",
  },
]

type Packages = { status: "loading" } | { status: "ready"; list: PublicPackage[] } | { status: "failed" }

export default function Home() {
  const navigate = useNavigate()
  const { occ, subOcc, pick, pickItems, set } = useBooking()
  const { customer } = useCustomer()
  const { openAsk } = useAsk()
  const [packages, setPackages] = useState<Packages | null>(null)
  const first = customer?.name?.trim().split(/\s+/)[0]
  const greeting = first ? `Hey ${first}` : "Hey there"

  // Live packages for the tapped sub-occasion, and nothing else: the reveal
  // is empty until the admin answers, and shows only what it answered.
  useEffect(() => {
    if (!subOcc) {
      setPackages(null)
      return
    }
    const controller = new AbortController()
    setPackages({ status: "loading" })
    publicPackages(subOcc, controller.signal)
      .then((list) => setPackages({ status: "ready", list }))
      .catch((err) => {
        if ((err as { name?: string }).name !== "AbortError") setPackages({ status: "failed" })
      })
    return () => controller.abort()
  }, [subOcc])

  // The package is its items, each with its quantity, plus the bundle: the
  // admin holds that many units of each and charges the bundle price.
  const openPackage = (p: PublicPackage) => {
    const items: DirectItem[] = p.items.map((i) => ({
      id: i.itemId,
      name: i.name,
      category: i.category,
      price: i.price,
      priceUnit: i.priceUnit,
      quantity: i.quantity,
    }))
    if (items.length === 0) return
    pickItems(items, { id: p.id, name: p.name, price: p.price })
    navigate(`/item/${items[0].id}`)
  }

  return (
    <AppShell>
      <Body>
        <HeroCarousel slides={HERO_SLIDES} />
        <GoLabel className="mt-[18px]">{greeting}</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">What are we celebrating?</h1>
        <AskCard onClick={() => openAsk("home")} />
        <button
          className="mt-2.5 flex w-full items-center gap-2.5 rounded-[12px] border-[1.5px] border-line bg-white px-3.5 py-[13px] text-left text-[13.5px] text-charcoal hover:border-charcoal"
          onClick={() => navigate("/browse")}
        >
          <Search className="size-[18px] flex-none stroke-charcoal" strokeWidth={1.75} />
          <span>
            <b className="font-bold">Build your own.</b> <span className="text-muted">Pick a day, add what's open.</span>
          </span>
          <b className="ml-auto text-[12.5px] font-bold whitespace-nowrap text-charcoal">Build</b>
        </button>
        <GoLabel className="mt-5">Or pick the occasion</GoLabel>
        <div className="mt-2 grid grid-cols-2 gap-2.5">
          {(Object.keys(OCC) as OccasionId[]).map((id) => (
            <OccasionCard key={id} label={OCC[id].label} plate={OCC[id].plate} onClick={() => pick(id)} />
          ))}
        </div>
        <Reveal open={!!occ} className="mt-3.5">
          <GoLabel className="mb-2">What kind</GoLabel>
          <div className="grid grid-cols-2 gap-2">
            {occ &&
              SUB_OCC[occ].map((s) => (
                <Chip key={s} selected={subOcc === s} onClick={() => set("subOcc", s)}>
                  {s}
                </Chip>
              ))}
          </div>
        </Reveal>
        <Reveal open={!!subOcc && packages !== null} className="mt-5">
          <GoLabel>Packages for {subOcc}</GoLabel>
          {packages?.status === "loading" && <p className="mt-2 text-body text-muted">Finding packages.</p>}
          {packages?.status === "failed" && <p className="mt-2 text-body text-charcoal">That didn't go through. Try again, or text us.</p>}
          {packages?.status === "ready" && packages.list.length === 0 && (
            <p className="mt-2 text-body text-charcoal-soft">No packages for {subOcc} yet. Ask GO can build one, or build your own.</p>
          )}
          {packages?.status === "ready" && packages.list.length > 0 && occ && (
            <Rail>
              {packages.list.map((p) => (
                <PackageCard key={p.id} pkg={p} plate={OCC[occ].plate} onClick={() => openPackage(p)} />
              ))}
            </Rail>
          )}
        </Reveal>
        {occ && (
          <Button className="mt-3.5 w-full" onClick={() => navigate("/book/date")}>
            Continue
          </Button>
        )}
        <p className="mt-4 text-small text-muted">Dates are live off the unit calendar. If it's open, it's real.</p>
      </Body>
    </AppShell>
  )
}
