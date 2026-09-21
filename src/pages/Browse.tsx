import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Check, Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { AppShell, Body } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { MonthChips, DayCarousel, Reveal } from "@/components/go/DatePicker"
import { CategoryChips } from "@/components/go/CategoryChips"
import { StickyTotal } from "@/components/go/AddonRow"
import { cartTotal } from "@/components/go/CartItems"
import { CartSheet } from "@/components/go/CartSheet"
import { AddonSheet } from "@/components/go/AddonSheet"
import { groupsOf, needsConfig, type Picks } from "@/lib/addons"
import { daysForItem, labelForIso } from "@/lib/availability"
import { publicItems, type PublicItem } from "@/lib/adminApi"
import { fmt } from "@/data/catalog"
import { useBooking, type DirectItem } from "@/state/booking"
import { cn } from "@/lib/utils"

/* Browse. Date first: the same month chips and day carousel as the direct
   booking, then only what is actually open that day, from one request to
   the admin's public catalog with the date. Search and category filter the
   open items. Add builds a cart (the booking store's items) with a sticky
   running total; an item with add-on groups opens its own sheet first and
   goes in once its required groups are answered; changing the day re-checks the cart and names anything no
   longer open. Check out hands the cart to the same ItemDate, who, account
   and held screens every other door uses. */

const ALL = "All"

const toDirect = (i: PublicItem, picks?: Picks): DirectItem => ({
  id: i.id,
  name: i.name,
  category: i.category,
  price: i.price,
  priceUnit: i.priceUnit,
  addonGroups: i.addonGroups,
  picks,
})

export default function Browse() {
  const navigate = useNavigate()
  const b = useBooking()
  const [q, setQ] = useState("")
  const [category, setCategory] = useState(ALL)
  const [categories, setCategories] = useState<string[]>([])
  const [results, setResults] = useState<PublicItem[] | null>(null)
  const [openIds, setOpenIds] = useState<{ iso: string; ids: Set<string> } | null>(null)
  const [failed, setFailed] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  // The one item whose options are being answered: a catalog row being
  // added, or a cart item being changed.
  const [configuring, setConfiguring] = useState<{ item: PublicItem | DirectItem; editing: boolean } | null>(null)

  const iso = b.itemDate
  const cart = b.items
  const dayLabel = iso ? labelForIso(iso) : null

  useEffect(() => {
    if (!iso) {
      setResults(null)
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      publicItems(q, category === ALL ? "" : category, iso, controller.signal)
        .then((data) => {
          setResults(data.items)
          setCategories(data.categories)
          setFailed(false)
        })
        .catch((err) => {
          if ((err as { name?: string }).name !== "AbortError") setFailed(true)
        })
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [q, category, iso])

  // Everything open on the day, unfiltered, so the cart is checked against
  // the day and not against the current search.
  useEffect(() => {
    if (!iso || cart.length === 0) return
    const controller = new AbortController()
    publicItems("", "", iso, controller.signal)
      .then((data) => setOpenIds({ iso, ids: new Set(data.items.map((i) => i.id)) }))
      .catch(() => {})
    return () => controller.abort()
  }, [iso, cart.length])

  const unavailable = useMemo(() => {
    if (!iso || !openIds || openIds.iso !== iso) return new Set<string>()
    return new Set(cart.filter((i) => !openIds.ids.has(i.id)).map((i) => i.id))
  }, [iso, openIds, cart])

  const inCart = (id: string) => cart.some((i) => i.id === id)
  const add = (item: PublicItem) => {
    if (inCart(item.id)) b.setItems(cart.filter((i) => i.id !== item.id))
    else if (needsConfig(item)) setConfiguring({ item, editing: false })
    else b.setItems([...cart, toDirect(item)])
  }
  const confirmOptions = (picks: Picks) => {
    if (!configuring) return
    if (configuring.editing) b.setPicks(configuring.item.id, picks)
    else b.setItems([...cart, toDirect(configuring.item as PublicItem, picks)])
    setConfiguring(null)
  }
  const remove = (id: string) => b.setItems(cart.filter((i) => i.id !== id))
  const total = cartTotal(cart, null)
  const checkout = () => {
    if (cart.length === 0 || unavailable.size > 0) return
    setCartOpen(false)
    // Every item here was configured as it was added: no options step.
    b.set("optionsStep", false)
    navigate(`/item/${cart[0].id}`)
  }

  const priceLine = (item: PublicItem) => {
    if (item.price !== null) return `${fmt(item.price)}${item.priceUnit ? ` ${item.priceUnit}` : ""}`
    return item.priceUnit || "Text us for a price"
  }

  const days = daysForItem(b.itemMonth)
  const selectedKey = days.find((d) => d.iso === iso)?.key ?? null
  const flagged = cart.filter((i) => unavailable.has(i.id))

  return (
    <AppShell>
      <Body className={cart.length > 0 ? "pb-24" : ""}>
        <GoLabel>Browse</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">Pick a day. See what's open.</h1>
        <MonthChips
          active={b.itemMonth}
          onPick={(i) => {
            b.set("itemMonth", i)
            b.set("itemDate", null)
          }}
        />
        <DayCarousel days={days} selected={selectedKey} onPick={(key) => b.set("itemDate", days.find((d) => d.key === key)?.iso ?? null)} />
        {!iso && <p className="mt-1 text-[11.5px] text-muted">Tap a day. We show only what's open.</p>}
        <Reveal open={flagged.length > 0} className="mt-3.5">
          <div className="rounded-[14px] border border-line bg-white px-4 py-3.5 text-sm text-charcoal">
            {flagged.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3 py-1">
                <span>
                  {i.name} isn't open {dayLabel}.
                </span>
                <button
                  aria-label={`Remove ${i.name}`}
                  className="flex size-9 flex-none items-center justify-center rounded-[10px] border-[1.5px] border-line bg-white hover:border-charcoal"
                  onClick={() => remove(i.id)}
                >
                  <Trash2 className="size-4 stroke-charcoal" strokeWidth={1.75} />
                </button>
              </div>
            ))}
            <p className="pt-1 text-charcoal-soft">Remove it or pick another day.</p>
          </div>
        </Reveal>
        {iso && (
          <>
            <div className="mt-3.5">
              <Input
                type="search"
                placeholder="Bounce house, DJ, snow cones"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search what's open"
              />
            </div>
            <CategoryChips categories={[ALL, ...categories]} active={category} onPick={setCategory} />
            {failed && <p className="mt-2 text-body text-charcoal">That didn't go through. Try again, or text us.</p>}
            {!failed && results === null && <p className="mt-2 text-body text-muted">Checking the calendar.</p>}
            {!failed && results && results.length === 0 && (
              <p className="mt-2 text-body text-charcoal-soft">Nothing open by that name {dayLabel}. Try another word, or another day.</p>
            )}
            {!failed && results && results.length > 0 && (
              <>
                <GoLabel>Open {dayLabel}</GoLabel>
                <p className="mt-0.5 text-small text-muted">
                  {results.length} {results.length === 1 ? "item" : "items"}
                </p>
                <div className="mt-2 grid gap-2">
                  {results.map((item) => {
                    const on = inCart(item.id)
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-[14px] border px-4 py-3.5",
                          on ? "border-orange bg-orange-tint" : "border-line bg-white"
                        )}
                      >
                        <div className="min-w-0">
                          <b className="block text-sm text-charcoal">{item.name}</b>
                          <small className="block text-small text-muted">
                            {item.category} · {priceLine(item)}
                          </small>
                          {needsConfig(item) && (
                            <small className="block text-[11px] text-muted">Options: {groupsOf(item).map((g) => g.name).join(", ")}</small>
                          )}
                          {typeof item.freeUnits === "number" && (
                            <small className="block text-[11px] font-bold text-good">{item.freeUnits} open</small>
                          )}
                        </div>
                        <button
                          aria-label={on ? `Remove ${item.name}` : `Add ${item.name}`}
                          className={cn(
                            "flex flex-none items-center gap-1.5 rounded-[10px] border-[1.5px] px-3 py-2 text-[12.5px] font-bold text-charcoal",
                            on ? "border-orange bg-orange" : "border-line bg-white"
                          )}
                          onClick={() => add(item)}
                        >
                          {on ? <Check className="size-4 stroke-charcoal" strokeWidth={2} /> : <Plus className="size-4 stroke-charcoal" strokeWidth={1.75} />}
                          {on ? "Added" : "Add"}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}
      </Body>
      {cart.length > 0 && (
        <StickyTotal
          line={`${cart.length} ${cart.length === 1 ? "item" : "items"}${dayLabel ? ` · ${dayLabel}` : ""}${unavailable.size > 0 ? ` · ${unavailable.size} not open` : ""}`}
          total={total}
          action="Check out"
          onAction={checkout}
          onDetails={() => setCartOpen(true)}
          disabled={!iso || unavailable.size > 0}
        />
      )}
      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        unavailable={unavailable}
        dayLabel={dayLabel}
        onRemove={remove}
        onConfigure={(item) => {
          setCartOpen(false)
          setConfiguring({ item, editing: true })
        }}
        onCheckout={checkout}
      />
      <AddonSheet
        item={configuring?.item ?? null}
        initial={configuring?.editing ? (configuring.item as DirectItem).picks : undefined}
        editing={configuring?.editing}
        onClose={() => setConfiguring(null)}
        onConfirm={confirmOptions}
      />
    </AppShell>
  )
}
