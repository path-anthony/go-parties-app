import { OCC } from "@/data/catalog"
import type { OccasionId } from "@/data/catalog"
import { cn } from "@/lib/utils"
import { useBooking } from "@/state/booking"

/* An optional row at the top of Browse: what the party is for. Picking one
   sets the cart's occasion the same way Home does (pick), which the booking
   request then sends; "Just browsing", or never touching the row, leaves it
   unset. Nothing waits on it: it is small, quiet, and a one-item checkout
   never needs it. Tapping the chosen one again clears it. */
export function OccasionChips() {
  const { occ, pick, set } = useBooking()
  const clear = () => {
    set("occ", null)
    set("subOcc", null)
  }
  const chip = (selected: boolean, label: string, onClick: () => void) => (
    <button
      key={label}
      aria-pressed={selected}
      className={cn(
        "min-h-[36px] rounded-full border-[1.5px] px-3 text-[12.5px] font-bold transition-colors",
        selected ? "border-charcoal bg-charcoal text-white" : "border-line bg-white text-charcoal hover:border-charcoal"
      )}
      onClick={onClick}
    >
      {label}
    </button>
  )
  return (
    <div className="mt-3">
      <p className="text-[11.5px] text-muted">Planning something? Optional.</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {(Object.keys(OCC) as OccasionId[]).map((id) => chip(occ === id, OCC[id].label, () => (occ === id ? clear() : pick(id))))}
        {chip(occ === null, "Just browsing", clear)}
      </div>
    </div>
  )
}
