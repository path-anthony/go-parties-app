import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { MONTH_WINDOW } from "@/data/catalog"
import { calendarMonth, labelForIso } from "@/lib/availability"

/* Month calendar. BRAND.md section 8: a real month grid, weekday headers,
   dates in weeks, prev and next for the month. Open days (Fri Sat Sun, not
   past) are white with a green dot; every other day is quiet and can't be
   tapped. The chosen day is the screen's one orange. */

const HEADS = ["S", "M", "T", "W", "T", "F", "S"]

export function MonthCalendar({
  month,
  onMonth,
  selected,
  onPick,
}: {
  month: number
  onMonth: (i: number) => void
  selected: string | null
  onPick: (iso: string) => void
}) {
  const cal = calendarMonth(month)
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between">
        <button
          aria-label="Previous month"
          disabled={month <= 0}
          className="flex size-11 items-center justify-center rounded-[10px] border-[1.5px] border-line bg-white transition-colors hover:border-charcoal disabled:opacity-35 disabled:hover:border-line"
          onClick={() => onMonth(month - 1)}
        >
          <ChevronLeft className="size-[18px] stroke-charcoal" strokeWidth={2} />
        </button>
        <div aria-live="polite" className="text-base font-extrabold text-charcoal">{cal.title}</div>
        <button
          aria-label="Next month"
          disabled={month >= MONTH_WINDOW - 1}
          className="flex size-11 items-center justify-center rounded-[10px] border-[1.5px] border-line bg-white transition-colors hover:border-charcoal disabled:opacity-35 disabled:hover:border-line"
          onClick={() => onMonth(month + 1)}
        >
          <ChevronRight className="size-[18px] stroke-charcoal" strokeWidth={2} />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1 text-center">
        {HEADS.map((h, i) => (
          <div key={i} className="py-1 text-[10px] font-semibold text-muted">{h}</div>
        ))}
        {Array.from({ length: cal.lead }, (_, i) => (
          <div key={`lead-${i}`} />
        ))}
        {cal.days.map((d) => (
          <button
            key={d.iso}
            disabled={!d.open}
            aria-label={labelForIso(d.iso)}
            aria-pressed={selected === d.iso}
            className={cn(
              "flex min-h-[46px] flex-col items-center justify-center rounded-[10px] border-[1.5px] text-[15px] font-extrabold",
              d.open ? "text-charcoal" : "border-transparent text-charcoal/30",
              d.open && (selected === d.iso ? "border-orange bg-orange-tint" : "border-line bg-white hover:border-charcoal")
            )}
            onClick={() => onPick(d.iso)}
          >
            {d.dayNum}
            <span className={cn("mt-[3px] block size-[5px] rounded-full", d.open ? "bg-good" : "bg-transparent")} />
          </button>
        ))}
      </div>
    </div>
  )
}

/* Reveal. BRAND.md section 9: max-height over 300ms ease. */
export function Reveal({ open, className, max = "max-h-96", children }: { open: boolean; className?: string; max?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn("overflow-hidden transition-[max-height] duration-300 ease-in-out", open ? max : "max-h-0", className)}
    >
      {children}
    </div>
  )
}
