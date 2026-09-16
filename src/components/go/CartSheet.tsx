import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { fmt } from "@/data/catalog"
import type { DirectItem } from "@/state/booking"

/* The cart, as a bottom sheet (BRAND.md section 8, never a popup). One row
   per item with Remove; anything not open on the chosen day is named and
   must be removed before checkout. */
export function CartSheet({
  open,
  onClose,
  items,
  unavailable,
  dayLabel,
  onRemove,
  onCheckout,
}: {
  open: boolean
  onClose: () => void
  items: DirectItem[]
  unavailable: Set<string>
  dayLabel: string | null
  onRemove: (id: string) => void
  onCheckout: () => void
}) {
  const total = items.reduce((sum, i) => sum + (i.price ?? 0), 0)
  const blocked = items.some((i) => unavailable.has(i.id))

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-[480px] px-5 pb-6">
          <DrawerTitle className="flex items-center justify-between text-base font-extrabold text-charcoal">
            In the cart
            <DrawerClose asChild>
              <button aria-label="Close" className="p-1">
                <X className="size-5 stroke-muted" strokeWidth={1.75} />
              </button>
            </DrawerClose>
          </DrawerTitle>
          {items.length === 0 ? (
            <p className="mt-2.5 text-body text-charcoal-soft">Nothing in it yet.</p>
          ) : (
            <div className="mt-2.5 rounded-[14px] border border-line bg-white px-4 py-1">
              {items.map((i) => {
                const out = unavailable.has(i.id)
                return (
                  <div key={i.id} className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-sm last:border-b-0">
                    <div className="min-w-0">
                      <span className="block text-charcoal">{i.name}</span>
                      {out && dayLabel && <small className="block text-[11.5px] font-bold text-charcoal">Not open {dayLabel}. Remove it or pick another day.</small>}
                    </div>
                    <div className="flex flex-none items-center gap-2">
                      <b className="text-charcoal">{i.price !== null ? fmt(i.price) : ""}</b>
                      <Button variant="ghost" size="sm" onClick={() => onRemove(i.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                )
              })}
              <div className="flex justify-between py-3 text-base">
                <span className="text-charcoal-soft">Total</span>
                <b className="text-price text-charcoal">{fmt(total)}</b>
              </div>
            </div>
          )}
          {items.length > 0 && (
            <Button className="mt-3 w-full" disabled={blocked} onClick={onCheckout}>
              Check out
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
