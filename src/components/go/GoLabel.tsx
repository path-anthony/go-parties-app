import { cn } from "@/lib/utils"

/* Small-caps label. BRAND.md section 4: 11px, 700, tracked 0.14em, taupe. */
export function GoLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("block text-label font-bold tracking-[.14em] text-taupe uppercase", className)}>
      {children}
    </span>
  )
}
