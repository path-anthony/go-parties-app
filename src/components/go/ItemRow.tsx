import { cn } from "@/lib/utils"
import { PhotoPlate } from "@/components/go/PhotoPlate"
import type { PlateVariant } from "@/data/catalog"

/* Item row with Swap. BRAND.md section 8: thumbnail, name, category, Swap
   button that unfolds alternatives with price deltas. */

interface ItemRowProps {
  name: string
  cat: string
  plate: PlateVariant
  swappable: boolean
  swapOpen: boolean
  onToggleSwap: () => void
}

export function ItemRow({ name, cat, plate, swappable, swapOpen, onToggleSwap }: ItemRowProps) {
  return (
    <div className="mb-2 flex items-center gap-3 rounded-[14px] border border-line bg-white p-2.5">
      <PhotoPlate variant={plate} corners={false} className="size-14 flex-none rounded-[10px]" />
      <div className="flex-1 text-sm font-semibold text-charcoal">
        {name}
        <small className="block text-[11.5px] font-medium text-muted">{cat}</small>
      </div>
      {swappable && (
        <button
          className={cn(
            "min-h-[36px] rounded-[9px] border-[1.5px] px-2.5 py-2 text-small font-bold transition-colors",
            swapOpen ? "border-charcoal bg-charcoal text-white" : "border-line text-taupe"
          )}
          onClick={onToggleSwap}
        >
          Swap
        </button>
      )}
    </div>
  )
}

export function SwapList({ open, options, current, onPick }: { open: boolean; options: string[]; current: string; onPick: (o: string) => void }) {
  if (!open) return null
  return (
    <div className="mt-[-2px] mb-2.5 ml-[68px] grid gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          className="rounded-[10px] border-[1.5px] border-line bg-white px-3 py-2.5 text-left text-[13px] font-semibold text-charcoal hover:border-charcoal"
          onClick={() => onPick(o)}
        >
          {o}
          {o === current && <span className="float-right font-medium text-muted">current</span>}
        </button>
      ))}
    </div>
  )
}
