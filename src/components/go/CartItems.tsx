import { Trash2 } from "lucide-react"
import { fmt } from "@/data/catalog"
import type { DirectItem } from "@/state/booking"

/* The items in a booking, one row each with a trash can, so anything can be
   removed at any step before the date is held: the cart sheet, the date
   screen, who, and the account step all use this one list. */
export function CartItems({
  items,
  onRemove,
  flag,
  showTotal = true,
}: {
  items: DirectItem[]
  onRemove: (id: string) => void
  flag?: (item: DirectItem) => string | null
  showTotal?: boolean
}) {
  const total = items.reduce((sum, i) => sum + (i.price ?? 0), 0)
  return (
    <div className="rounded-[14px] border border-line bg-white px-4 py-1">
      {items.map((item) => {
        const note = flag?.(item) ?? null
        return (
          <div key={item.id} className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-b-0">
            <div className="min-w-0">
              <b className="block text-sm text-charcoal">{item.name}</b>
              <small className="block text-small text-muted">
                {item.category}
                {item.priceUnit ? ` · ${item.priceUnit}` : ""}
              </small>
              {note && <small className="block text-[11.5px] font-bold text-charcoal">{note}</small>}
            </div>
            <div className="flex flex-none items-center gap-2.5">
              {item.price !== null && <b className="text-sm text-charcoal">{fmt(item.price)}</b>}
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
        <div className="flex justify-between py-3 text-base">
          <span className="text-charcoal-soft">Total</span>
          <b className="text-price text-charcoal">{fmt(total)}</b>
        </div>
      )}
    </div>
  )
}
