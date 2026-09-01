import { Sparkle } from "lucide-react"

/* Ask GO door on Home. Dashed line per the reference. One of the three doors. */
export function AiLine({ prompt, onClick }: { prompt: string; onClick?: () => void }) {
  return (
    <button
      className="mt-3 flex w-full items-center gap-2.5 rounded-[12px] border-[1.5px] border-dashed border-line bg-white px-3.5 py-[13px] text-left text-[13.5px] text-muted"
      onClick={onClick}
    >
      <Sparkle className="size-[18px] flex-none stroke-orange" strokeWidth={1.75} />
      {prompt}
      <b className="ml-auto text-[12.5px] font-bold whitespace-nowrap text-charcoal">Ask GO</b>
    </button>
  )
}
