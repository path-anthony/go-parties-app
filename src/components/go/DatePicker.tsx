import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { MONTHS } from "@/data/catalog"
import type { DayCell } from "@/lib/availability"

/* Month chips + day carousel. BRAND.md section 8: months tap, never scroll.
   Days scroll sideways and snap, 56px wide, green dot open, grayed booked. */

export function MonthChips({ active, onPick }: { active: number; onPick: (i: number) => void }) {
  return (
    <div className="mt-3 flex gap-1.5">
      {MONTHS.map(([name], i) => (
        <button
          key={name}
          className={cn(
            "min-h-[44px] flex-1 rounded-[10px] border-[1.5px] py-[9px] text-[12.5px] font-bold transition-colors",
            i === active ? "border-charcoal bg-charcoal text-white" : "border-line bg-white text-charcoal hover:border-charcoal"
          )}
          onClick={() => onPick(i)}
        >
          {name}
        </button>
      ))}
    </div>
  )
}

export function DayCarousel({ days, selected, onPick }: { days: DayCell[]; selected: string | null; onPick: (key: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>("[data-selected]")
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" })
  }, [selected])

  return (
    <div ref={ref} className="no-bar flex snap-x snap-mandatory gap-2 overflow-x-auto py-3 pb-2">
      {days.map((d) => (
        <button
          key={d.key}
          disabled={d.blocked}
          data-selected={selected === d.key || undefined}
          className={cn(
            "w-14 flex-none snap-start rounded-[12px] border-[1.5px] pt-2.5 pb-[9px] text-center text-base font-extrabold text-charcoal",
            d.blocked && "opacity-35",
            selected === d.key ? "border-orange bg-orange-tint" : "border-line bg-white"
          )}
          onClick={() => onPick(d.key)}
        >
          <small className="mb-[3px] block text-[10px] font-semibold text-muted">{d.weekday}</small>
          {d.dayNum}
          <span className={cn("mx-auto mt-[5px] block size-[5px] rounded-full", d.blocked ? "bg-line" : "bg-good")} />
        </button>
      ))}
    </div>
  )
}

/* Reveal. BRAND.md section 9: max-height over 300ms ease. */
export function Reveal({ open, className, children }: { open: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn("overflow-hidden transition-[max-height] duration-300 ease-in-out", open ? "max-h-40" : "max-h-0", className)}
    >
      {children}
    </div>
  )
}
