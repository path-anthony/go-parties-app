import { Sparkle } from "lucide-react"
import { GoLabel } from "@/components/go/GoLabel"

/* The Ask GO door on Home, as a card near the top. Dashed border is Ask GO's
   signature from the reference line; the inner dark button is the one
   non-orange action style (BRAND.md section 8). One of the three doors; it
   never opens itself. */
export function AskCard({ onClick }: { onClick?: () => void }) {
  return (
    <button
      className="mt-3.5 w-full rounded-[14px] border-[1.5px] border-dashed border-line bg-white p-4 text-left hover:border-charcoal"
      onClick={onClick}
    >
      <span className="flex items-center gap-2">
        <Sparkle className="size-[18px] flex-none stroke-orange" strokeWidth={1.75} />
        <GoLabel>Ask GO</GoLabel>
      </span>
      <b className="mt-2 block text-[19px] leading-[1.15] font-black tracking-[-.015em] text-charcoal">The AI event builder.</b>
      <span className="mt-1.5 block text-[13.5px] leading-normal text-charcoal-soft">
        Tell it the party. It builds one from what's actually in the warehouse, real items, real prices.
      </span>
      <span className="mt-3 inline-flex rounded-[12px] bg-charcoal px-[18px] py-[11px] text-[13.5px] font-extrabold text-white">Build it with Ask GO</span>
    </button>
  )
}
