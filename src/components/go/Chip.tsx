import { cn } from "@/lib/utils"

/* Chip. BRAND.md section 8: guests, times, budgets. Selected is orange border
   on orange tint. 44px minimum touch target. */
interface ChipProps extends React.ComponentProps<"button"> {
  selected?: boolean
  sub?: string
}

export function Chip({ selected, sub, className, children, ...props }: ChipProps) {
  return (
    <button
      data-selected={selected || undefined}
      className={cn(
        "min-h-[44px] rounded-[12px] border-[1.5px] px-1 py-3 text-center text-[13px] font-bold text-charcoal transition-colors",
        selected ? "border-orange bg-orange-tint" : "border-line bg-white hover:border-charcoal",
        className
      )}
      {...props}
    >
      {children}
      {sub && <small className="mt-0.5 block text-[11px] font-medium text-muted">{sub}</small>}
    </button>
  )
}
