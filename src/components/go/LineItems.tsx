import { fmt } from "@/data/catalog"
import { deltaText } from "@/lib/addons"
import { Thumb } from "@/components/go/Thumb"

/* Line items. Reference .line / .line.total: a bordered row per line, then
   an unbordered total row in the price weight. Used on Review and Held. A
   line can carry sub-lines: the add-on choices that belong to that item,
   indented under it with their own price change, so a choice is never read
   apart from the thing it was for. A line for a real catalog item also
   carries its photo: a string shows it, null shows the photo plate, and
   leaving it out (the static package flow's lines, which aren't catalog
   items) shows no thumbnail at all. */
export type SubLine = [label: string, amount: number]
export type Line =
  | [name: string, price: number]
  | [name: string, price: number, subs: SubLine[]]
  | [name: string, price: number, subs: SubLine[], photoUrl: string | null]

export function LineItems({ lines, total, note }: { lines: Line[]; total: number; note?: string }) {
  return (
    <div className="rounded-[14px] border border-line bg-white px-4 py-3.5">
      {lines.map(([n, p, subs, photoUrl]) => (
        <div key={n} className="border-b border-line py-2.5">
          <div className="flex items-center justify-between gap-3 text-sm text-charcoal-soft">
            {photoUrl !== undefined && <Thumb src={photoUrl} />}
            <span className="min-w-0 flex-1">{n}</span>
            <b className="flex-none text-charcoal">{fmt(p)}</b>
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
