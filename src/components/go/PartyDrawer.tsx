import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { Thumb } from "@/components/go/Thumb"
import { cartTotal, lineTotal, qtyOf } from "@/components/go/CartItems"
import { labelForIso } from "@/lib/availability"
import { fmt } from "@/data/catalog"
import { TIER_LINE, useCartTier, useRetainer } from "@/hooks/use-cart-tier"
import { useBooking } from "@/state/booking"
import { useStoreUi } from "@/state/store"

/* Your party, the drawer (Block S1): from the right on a desktop, a bottom
   sheet up to 80% on a phone. One line per item with a small image, the
   name, qty x price and a "Remove" text button. The footer has the total,
   one plain line on what checkout will ask for (from the tier call) and
   the retainer due today (from the tier, else settings), then "Keep
   shopping" and "Checkout". Checkout hands the cart to the existing
   /item/:id flow unchanged. */

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
  const total = cartTotal(items, b.bundle)
  const tier = useCartTier()
  const retainer = useRetainer(total, tier)
  const count = items.reduce((n, i) => n + qtyOf(i), 0)

  const remove = (id: string) => b.setItems(items.filter((i) => i.id !== id))
  const checkout = () => {
    if (items.length === 0) return
    setPartyOpen(false)
    b.set("optionsStep", false)
    navigate(`/item/${items[0].id}`)
  }

  const what = tier ? TIER_LINE[tier.tier] : b.itemDate ? null : "Pick a date to see what checkout asks for."
  const due = retainer.amount !== null && tier?.tier !== 3 ? `${fmt(retainer.amount)} today holds the date.` : null

  return (
    <Drawer open={partyOpen} onOpenChange={setPartyOpen} direction={desktop ? "right" : "bottom"}>
      <DrawerContent className="max-h-[80vh] data-[vaul-drawer-direction=right]:max-h-none data-[vaul-drawer-direction=right]:w-[420px] data-[vaul-drawer-direction=right]:max-w-[92vw]">
        <div className="flex min-h-0 flex-1 flex-col">
          <DrawerTitle className="flex items-center justify-between border-b border-line px-5 py-3.5 text-base font-extrabold text-charcoal">
            <span className="min-w-0 truncate">Your party{b.itemDate ? ` · ${labelForIso(b.itemDate)}` : ""}</span>
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
                    <small className="block text-small text-muted">
                      {qtyOf(i)} × {i.price !== null ? fmt(i.price) : "price by text"}
                      {i.price !== null && qtyOf(i) > 1 ? ` = ${fmt(lineTotal(i))}` : ""}
                    </small>
                  </div>
                  <button className="min-h-[44px] flex-none px-2 text-[13px] font-bold text-charcoal underline underline-offset-2" onClick={() => remove(i.id)}>
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-line px-5 pt-3 pb-5">
            <div className="flex justify-between text-base">
              <b className="text-charcoal">Total</b>
              <b className="text-charcoal">{fmt(total)}</b>
            </div>
            {b.bundle && <small className="block text-small text-muted">Package price, {b.bundle.name}.</small>}
            {items.length > 0 && (what || due) && (
              <p className="mt-1.5 text-small text-charcoal-soft">
                {what} {due}
              </p>
            )}
            <div className="mt-3 flex gap-2.5">
              <Button variant="ghost" className="flex-1" onClick={() => setPartyOpen(false)}>
                Keep shopping
              </Button>
              <Button className="flex-1" disabled={count === 0} onClick={checkout}>
                Checkout
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
