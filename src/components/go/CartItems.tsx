import { fmt } from "@/data/catalog"
import { addonsTotal, deltaText, needsConfig, pickedOf } from "@/lib/addons"
import { Thumb } from "@/components/go/Thumb"
import { bundleNote } from "@/lib/guests"
import { cartPrice, isPerGuest, lineTotal, optionTotal, priceLine, qtyOf } from "@/lib/pricing"
import { useBooking, type Bundle, type DirectItem } from "@/state/booking"

/* The items in a booking, one row each with a Remove button, so anything can be
   removed at any step before the date is held: the cart sheet, the date
   screen, who, and the account step all use this one list. A quantity above
   one shows on the row and multiplies its price. Add-on choices sit under
   the item they belong to, each with its own price change (times the
   quantity, which is how the admin charges it), and Change reopens them.
   With a bundle (the cart is a package as published) the base is the
   package's price, not the sum; add-ons go on top either way. A per-guest
   package (Block S9a) is its base plus its rate times the guest count; with
   no usable count the total is its lowest price and reads "From". */
/* Block FIX1: the admin's pricing rule (lib/pricing.ts). A per-guest item
   is its price x the guest count, any other its price x its quantity. These
   names stay here for the screens that import them. */
export { qtyOf } from "@/lib/pricing"
export const cartTotal = (items: DirectItem[], bundle: Bundle | null, guests: number | null = null) => cartPrice(items, bundle, guests).total

export function CartItems({
  items,
  bundle = null,
  onRemove,
  onConfigure,
  flag,
  showTotal = true,
}: {
  items: DirectItem[]
  bundle?: Bundle | null
  onRemove: (id: string) => void
  onConfigure?: (item: DirectItem) => void
  flag?: (item: DirectItem) => string | null
  showTotal?: boolean
}) {
  const b = useBooking()
  // Block FIX1: a quantity the admin refused can be lowered right here.
  const setQty = (item: DirectItem, q: number) => b.setItems(b.items.map((i) => (i.id === item.id ? { ...i, quantity: Math.max(1, Math.min(50, q)) } : i)))
  const guests = b.guestCount
  const priced = cartPrice(items, bundle, guests)
  // The admin's figure once the tier answer is in for this cart.
  const total = b.tier?.total ?? priced.total
  const from = !b.tier && priced.partial
  const extras = addonsTotal(items)
  return (
    <div className="rounded-[14px] border border-line bg-white px-4 py-1">
      {items.map((item) => {
        const note = b.itemNotices[item.id] ?? flag?.(item) ?? null
        const line = bundle ? null : lineTotal(item, guests)
        const how = bundle ? null : priceLine(item, guests)
        const picks = pickedOf(item)
        return (
          <div key={item.id} className="border-b border-line py-2.5 last:border-b-0">
            <div className="flex items-center justify-between gap-3">
              <Thumb src={item.photoUrl} />
              <div className="min-w-0 flex-1">
                <b className="block text-sm text-charcoal">
                  {item.name}
                </b>
                <small className="block text-small text-muted">
                  {item.category}
                  {item.priceUnit ? ` · ${item.priceUnit}` : ""}
                </small>
                {how && <small className="block text-small text-charcoal-soft">{how}</small>}
                {note && <small className={b.itemNotices[item.id] ? "block text-[11.5px] font-bold text-[#A8382C]" : "block text-[11.5px] font-bold text-charcoal"}>{note}</small>}
                {!bundle && !isPerGuest(item) && (qtyOf(item) > 1 || b.itemNotices[item.id]) && (
                  <span className="mt-1 inline-flex items-center rounded-[10px] border-[1.5px] border-line" aria-label={`Quantity of ${item.name}`}>
                    <button className="min-h-[36px] min-w-[36px] text-[15px] font-bold text-charcoal disabled:opacity-40" disabled={qtyOf(item) <= 1} aria-label="Fewer" onClick={() => setQty(item, qtyOf(item) - 1)}>
                      -
                    </button>
                    <span className="min-w-[22px] text-center text-sm font-bold text-charcoal">{qtyOf(item)}</span>
                    <button className="min-h-[36px] min-w-[36px] text-[15px] font-bold text-charcoal disabled:opacity-40" disabled={qtyOf(item) >= 50} aria-label="More" onClick={() => setQty(item, qtyOf(item) + 1)}>
                      +
                    </button>
                  </span>
                )}
              </div>
              <div className="flex flex-none items-center gap-2.5">
                {line !== null && <b className="text-sm text-charcoal">{fmt(line)}</b>}
                <button
                  aria-label={`Remove ${item.name}`}
                  className="min-h-[44px] rounded-[10px] px-1.5 text-[12.5px] font-bold text-charcoal underline underline-offset-2"
                  onClick={() => onRemove(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
            {(picks.length > 0 || (onConfigure && needsConfig(item))) && (
              <div className="mt-1.5 border-l-2 border-line pl-2.5" aria-label={`Options for ${item.name}`}>
                {picks.map(({ group, addon }) => (
                  <div key={group.id} className="flex justify-between gap-3 text-small text-charcoal-soft">
                    <span>
                      {group.name}: {addon.name}
                    </span>
                    <span className="flex-none text-muted">{deltaText(optionTotal(item, addon.priceDelta, guests, !!bundle))}</span>
                  </div>
                ))}
                {onConfigure && needsConfig(item) && (
                  <button className="mt-0.5 text-[11.5px] font-bold text-charcoal underline underline-offset-2" onClick={() => onConfigure(item)}>
                    {picks.length > 0 ? "Change" : "Pick options"}
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
      {showTotal && (
        <div className="py-3">
          <div className="flex justify-between text-base">
            <span className="text-charcoal-soft">Total</span>
            <b className="text-price text-charcoal">
              {from && bundle ? "From " : ""}
              {fmt(total)}
            </b>
          </div>
          {bundle && <small className="block text-small text-muted">{bundleNote(bundle, guests, extras !== 0)}</small>}
          {!bundle && priced.partial && <small className="block text-small text-muted">Plus the per-guest items, once you add a guest count.</small>}
        </div>
      )}
    </div>
  )
}
