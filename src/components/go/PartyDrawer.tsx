import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { Thumb } from "@/components/go/Thumb"
import { cartPrice, cartCount, isPerGuest, lineTotal, needsGuests, priceLine, qtyOf } from "@/lib/pricing"
import { bundleNote } from "@/lib/guests"
import { GuestCountField } from "@/components/go/GuestCountField"
import { addonsTotal } from "@/lib/addons"
import { labelForIso } from "@/lib/availability"
import { PRICE_ON_REQUEST, keyUnit, useOpenOn } from "@/lib/storeCatalog"
import { fmt } from "@/data/catalog"
import { tierLine, useCartTier, useRetainer } from "@/hooks/use-cart-tier"
import { useResponseDays } from "@/hooks/use-response-days"
import { useBooking } from "@/state/booking"
import { useStoreUi } from "@/state/store"

/* The cart drawer (Block S1, named Cart since S2): from the right on a desktop, a bottom
   sheet up to 80% on a phone. One line per item with a small image, the
   name, qty x price, a "-" / "+" quantity control when the date has more
   than one free unit (capped there), and a "Remove" text button. The footer has the total,
   one plain line on what checkout will ask for (from the tier call) and
   the retainer due today (from the tier, else settings), then "Keep
   shopping" and "Checkout". Checkout hands the cart to the existing
   /item/:id flow unchanged. Block S5: the description under the name
   (two lines, clipped) and the unit after the price when it is per guest
   or per hour.
   Block FIX1: every figure follows the admin's pricing rule (lib/pricing.ts)
   and is the tier answer's own total once it is in. A per-guest item has no
   quantity control and reads "100 guests x $58.56 = $5,856"; with one in the
   cart the guest count is asked here and Checkout waits for it. A refusal
   of one item (a quantity the date cannot hold) sits under that item. */

function useDesktop() {
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 641px)").matches)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 641px)")
    const on = () => setWide(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return wide
}

export function PartyDrawer() {
  const navigate = useNavigate()
  const b = useBooking()
  const { partyOpen, setPartyOpen } = useStoreUi()
  const desktop = useDesktop()
  const items = b.items
  const priced = cartPrice(items, b.bundle, b.guestCount)
  const tier = useCartTier(partyOpen)
  const total = tier?.total ?? priced.total
  const from = !tier && priced.partial
  const days = useResponseDays(tier)
  const retainer = useRetainer(total, tier)
  const count = cartCount(items)
  const guestsMissing = needsGuests(items, b.bundle, b.guestCount) || b.guestBad
  // Free units on the party date: an item with more than one gets a
  // quantity control, capped there; a single-unit item shows none.
  const open = useOpenOn(b.itemDate)
  const capOf = (id: string): number | null => (open.status === "ready" ? open.open.get(id) ?? 0 : null)
  // Without a date there is no cap to read: the quantity can go up to the
  // admin's 50, and the hold says if the date cannot take it.
  const maxOf = (id: string): number => capOf(id) ?? 50

  const remove = (id: string) => b.setItems(items.filter((i) => i.id !== id))
  const setQty = (id: string, qty: number) => b.setItems(items.map((i) => (i.id === id ? { ...i, quantity: qty } : i)))
  const checkout = () => {
    if (items.length === 0 || guestsMissing) return
    setPartyOpen(false)
    b.set("optionsStep", false)
    navigate(`/item/${items[0].id}`)
  }

  const what = tier ? tierLine(tier.tier, days) : b.itemDate ? null : "Pick a date to see what checkout asks for."
  const due = retainer.amount !== null && tier?.tier !== 3 && !from ? `${fmt(retainer.amount)} today holds the date.` : null
  const perGuestIn = !b.bundle && items.some(isPerGuest)

  return (
    <Drawer open={partyOpen} onOpenChange={setPartyOpen} direction={desktop ? "right" : "bottom"}>
      <DrawerContent className="max-h-[80vh] data-[vaul-drawer-direction=right]:max-h-none data-[vaul-drawer-direction=right]:w-[420px] data-[vaul-drawer-direction=right]:max-w-[92vw]">
        <div className="flex min-h-0 flex-1 flex-col">
          <DrawerTitle className="flex items-center justify-between border-b border-line px-5 py-3.5 text-base font-extrabold text-charcoal">
            <span className="min-w-0 truncate">Cart{b.itemDate ? ` · ${labelForIso(b.itemDate)}` : ""}</span>
            <DrawerClose asChild>
              <button className="min-h-[44px] px-2 text-sm font-bold text-charcoal">Close</button>
            </DrawerClose>
          </DrawerTitle>
          <div className="min-h-0 flex-1 overflow-y-auto px-5">
            {items.length === 0 ? (
              <p className="py-6 text-body text-charcoal-soft">Nothing yet. Add items or a package.</p>
            ) : (
              items.map((i) => (
                <div key={i.id} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
                  <Thumb src={i.photoUrl} className="size-12 rounded-[8px]" />
                  <div className="min-w-0 flex-1">
                    <b className="block text-sm text-charcoal">{i.name}</b>
                    {i.description && <small className="line-clamp-2 block text-[12px] leading-[1.35] text-charcoal-soft">{i.description}</small>}
                    <small className="block text-small text-muted">
                      {i.price === null
                        ? PRICE_ON_REQUEST
                        : (priceLine(i, b.guestCount) ?? `${fmt(lineTotal(i, b.guestCount) ?? i.price)}${keyUnit(i.priceUnit) ? ` ${keyUnit(i.priceUnit)}` : ""}`)}
                    </small>
                    {b.itemNotices[i.id] && <small className="mt-0.5 block text-[12px] font-bold text-[#A8382C]">{b.itemNotices[i.id]}</small>}
                  </div>
                  {!isPerGuest(i) && maxOf(i.id) > 1 && (
                    <div className="flex flex-none items-center rounded-[10px] border-[1.5px] border-line" aria-label={`Quantity of ${i.name}`}>
                      <button className="min-h-[44px] min-w-[40px] px-2 text-[15px] font-bold text-charcoal disabled:opacity-40" disabled={qtyOf(i) <= 1} aria-label="Fewer" onClick={() => setQty(i.id, qtyOf(i) - 1)}>
                        -
                      </button>
                      <span className="min-w-[20px] text-center text-sm font-bold text-charcoal">{qtyOf(i)}</span>
                      <button className="min-h-[44px] min-w-[40px] px-2 text-[15px] font-bold text-charcoal disabled:opacity-40" disabled={qtyOf(i) >= maxOf(i.id)} aria-label="More" onClick={() => setQty(i.id, qtyOf(i) + 1)}>
                        +
                      </button>
                    </div>
                  )}
                  <button className="min-h-[44px] flex-none px-2 text-[13px] font-bold text-charcoal underline underline-offset-2" onClick={() => remove(i.id)}>
                    Remove
                  </button>
                </div>
              ))
            )}
            {/* Block S9a: a per-guest package is priced from its guest count;
                Block FIX1: so is every per-guest item. */}
            {(b.bundle?.perGuest || perGuestIn) && items.length > 0 && <GuestCountField label="Guests" className="py-3" />}
          </div>
          <div className="border-t border-line px-5 pt-3 pb-5">
            <div className="flex justify-between text-base">
              <b className="text-charcoal">Total</b>
              <b className="text-charcoal">
                {from && b.bundle ? "From " : ""}
                {fmt(total)}
              </b>
            </div>
            {b.bundle && <small className="block text-small text-muted">{bundleNote(b.bundle, b.guestCount, addonsTotal(items) !== 0)}</small>}
            {!b.bundle && from && <small className="block text-small text-muted">Plus the per-guest items, once you add a guest count.</small>}
            {items.length > 0 && (what || due) && (
              <p className="mt-1.5 text-small text-charcoal-soft">
                {what} {due}
              </p>
            )}
            <div className="mt-3 flex gap-2.5">
              <Button variant="ghost" className="flex-1" onClick={() => setPartyOpen(false)}>
                Keep shopping
              </Button>
              <Button className="flex-1" disabled={count === 0 || guestsMissing} onClick={checkout}>
                Checkout
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
