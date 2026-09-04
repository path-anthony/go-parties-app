import { cn } from "@/lib/utils"

/* Category chips. Reference .cats: horizontal scroll, pill radius 20, dark
   charcoal selected, tap no need to snap. Distinct from Chip (guests, times,
   budgets), which selects orange. */

interface CategoryChipsProps {
  categories: string[]
  active: string
  onPick: (c: string) => void
}

export function CategoryChips({ categories, active, onPick }: CategoryChipsProps) {
  return (
    <div className="no-bar mt-3 mb-2.5 flex gap-2 overflow-x-auto pb-1">
      {categories.map((c) => (
        <button
          key={c}
          className={cn(
            "flex-none rounded-[20px] border-[1.5px] px-[13px] py-2 text-[12.5px] font-bold transition-colors",
            c === active ? "border-charcoal bg-charcoal text-white" : "border-line bg-white text-muted"
          )}
          onClick={() => onPick(c)}
        >
          {c}
        </button>
      ))}
    </div>
  )
}
