import { Trash2 } from "lucide-react"
import { fmt } from "@/data/catalog"
import type { Bundle, DirectItem } from "@/state/booking"

/* The items in a booking, one row each with a trash can, so anything can be
   removed at any step before the date is held: the cart sheet, the date
   screen, who, and the account step all use this one list. A quantity above
   one shows on the row and multiplies its price. With a bundle (the cart is
   a package as published) the total is the package's price, not the sum,
   and says so. */
export const qtyOf = (item: DirectItem) => item.quantity ?? 1
export const lineTotal = (item: DirectItem) => (item.price ?? 0) * qtyOf(item)
export const cartTotal = (items: DirectItem[], bundle: Bundle | null) =>
  bundle ? bundle.price : items.reduce((sum, i) => sum + lineTotal(i), 0)

export function CartItems({
  items,
  bundle = null,
  onRemove,
  flag,
  showTotal = true,
}: {
  items: DirectItem[]
  bundle?: Bundle | null
  onRemove: (id: string) => void
  flag?: (item: DirectItem) => string | null
  showTotal?: boolean
}) {
  const total = cartTotal(items, bundle)
  return (
    <div className="rounded-[14px] border border-line bg-white px-4 py-1">
      {items.map((item) => {
        const note = flag?.(item) ?? null
        const qty = qtyOf(item)
        return (
          <div key={item.id} className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-b-0">
            <div className="min-w-0">
              <b className="block text-sm text-charcoal">
                {item.name}
                {qty > 1 && <span className="font-medium text-muted"> x {qty}</span>}
              </b>
              <small className="block text-small text-muted">
                {item.category}
                {item.priceUnit ? ` · ${item.priceUnit}` : ""}
              </small>
              {note && <small className="block text-[11.5px] font-bold text-charcoal">{note}</small>}
            </div>
            <div className="flex flex-none items-center gap-2.5">
              {item.price !== null && <b className="text-sm text-charcoal">{fmt(lineTotal(item))}</b>}
              <button
                aria-label={`Remove ${item.name}`}
                className="flex size-9 items-center justify-center rounded-[10px] border-[1.5px] border-line bg-white hover:border-charcoal"
                onClick={() => onRemove(item.id)}
              >
                <Trash2 className="size-4 stroke-charcoal" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        )
      })}
      {showTotal && (
        <div className="py-3">
          <div className="flex justify-between text-base">
            <span className="text-charcoal-soft">Total</span>
            <b className="text-price text-charcoal">{fmt(total)}</b>
          </div>
          {bundle && <small className="block text-small text-muted">Package price, {bundle.name}.</small>}
        </div>
      )}
    </div>
  )
}
