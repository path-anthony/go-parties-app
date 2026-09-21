import { fmt } from "@/data/catalog"
import { deltaText } from "@/lib/addons"

/* Line items. Reference .line / .line.total: a bordered row per line, then
   an unbordered total row in the price weight. Used on Review and Held. A
   line can carry sub-lines: the add-on choices that belong to that item,
   indented under it with their own price change, so a choice is never read
   apart from the thing it was for. */
export type SubLine = [label: string, amount: number]
export type Line = [name: string, price: number] | [name: string, price: number, subs: SubLine[]]

export function LineItems({ lines, total, note }: { lines: Line[]; total: number; note?: string }) {
  return (
    <div className="rounded-[14px] border border-line bg-white px-4 py-3.5">
      {lines.map(([n, p, subs]) => (
        <div key={n} className="border-b border-line py-2.5">
          <div className="flex justify-between text-sm text-charcoal-soft">
            <span>{n}</span>
            <b className="text-charcoal">{fmt(p)}</b>
          </div>
          {subs && subs.length > 0 && (
            <div className="mt-1 border-l-2 border-line pl-2.5" aria-label={`Options for ${n}`}>
              {subs.map(([label, amount]) => (
                <div key={label} className="flex justify-between gap-3 text-small text-charcoal-soft">
                  <span>{label}</span>
                  <span className="flex-none text-muted">{deltaText(amount)}</span>
                </div>
              ))}
            </div>
          )}
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
