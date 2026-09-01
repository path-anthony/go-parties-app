import { Check, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PhotoPlate } from "@/components/go/PhotoPlate"
import { fmt, type PlateVariant } from "@/data/catalog"

/* Add-on row. BRAND.md section 8: thumbnail, name, category, price, plus
   button. Selected is orange tint. */

interface AddonRowProps {
  name: string
  cat: string
  price: number
  plate: PlateVariant
  selected: boolean
  onToggle: () => void
}

export function AddonRow({ name, cat, price, plate, selected, onToggle }: AddonRowProps) {
  return (
    <div
      className={cn(
        "mb-2 flex items-center gap-3 rounded-[14px] border py-2.5 pr-3 pl-2.5",
        selected ? "border-orange bg-orange-tint" : "border-line bg-white"
      )}
    >
      <PhotoPlate variant={plate} corners={false} className="size-[46px] flex-none rounded-[9px]" />
      <div className="flex-1 text-sm font-semibold text-charcoal">
        {name}
        <small className="block text-[11.5px] font-medium text-muted">{cat}</small>
      </div>
      <div className="text-[13.5px] font-extrabold text-charcoal">{fmt(price)}</div>
      <button
        aria-label={selected ? `Remove ${name}` : `Add ${name}`}
        className={cn(
          "flex size-[34px] items-center justify-center rounded-[10px] border-[1.5px]",
          selected ? "border-orange bg-orange" : "border-line"
        )}
        onClick={onToggle}
      >
        {selected ? <Check className="size-[18px] stroke-charcoal" strokeWidth={2} /> : <Plus className="size-[18px] stroke-charcoal" strokeWidth={1.75} />}
      </button>
    </div>
  )
}

/* Sticky total. BRAND.md section 8: the live total floats above the nav. */
export function StickyTotal({ line, total, action, onAction }: { line: string; total: number; action: string; onAction: () => void }) {
  return (
    <div className="fixed right-0 bottom-[calc(64px+env(safe-area-inset-bottom))] left-0 z-30 px-5 py-2.5">
      <div className="mx-auto flex max-w-[480px] items-center justify-between gap-3 rounded-[14px] border border-line bg-white py-3 pr-3 pl-4 shadow-float min-[900px]:max-w-[560px]">
        <div>
          <small className="block text-[11px] text-muted">{line}</small>
          <b className="text-[19px] font-black text-charcoal">{fmt(total)}</b>
        </div>
        <Button onClick={onAction}>{action}</Button>
      </div>
    </div>
  )
}
