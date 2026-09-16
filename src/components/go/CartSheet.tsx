import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { CartItems } from "@/components/go/CartItems"
import type { DirectItem } from "@/state/booking"

/* The cart, as a bottom sheet (BRAND.md section 8, never a popup). One row
   per item with a trash can; anything not open on the chosen day is named
   and must be removed before checkout. */
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
            <div className="mt-2.5">
              <CartItems
                items={items}
                onRemove={onRemove}
                flag={(i) => (unavailable.has(i.id) && dayLabel ? `Not open ${dayLabel}. Remove it or pick another day.` : null)}
              />
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
