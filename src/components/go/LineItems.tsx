import { fmt } from "@/data/catalog"

/* Line items. Reference .line / .line.total: a bordered row per line, then
   an unbordered total row in the price weight. Used on Review and Held. */
export function LineItems({ lines, total, note }: { lines: [string, number][]; total: number; note?: string }) {
  return (
    <div className="rounded-[14px] border border-line bg-white px-4 py-3.5">
      {lines.map(([n, p]) => (
        <div key={n} className="flex justify-between border-b border-line py-2.5 text-sm text-charcoal-soft">
          <span>{n}</span>
          <b className="text-charcoal">{fmt(p)}</b>
        </div>
      ))}
      <div className="flex justify-between pt-3 text-base">
        <span className="text-charcoal-soft">Total</span>
        <b className="text-price text-charcoal">{fmt(total)}</b>
      </div>
      {note && <p className="mt-2 text-small text-muted">{note}</p>}
    </div>
  )
}
