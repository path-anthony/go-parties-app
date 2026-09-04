/* Meta card. Reference .meta: 2-up grid of small taupe label over a bold
   value. Used on Review (when, who, where, setup) and My party. */
export function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-line bg-white p-3">
      <small className="block text-[10.5px] font-bold tracking-[.1em] text-taupe uppercase">{label}</small>
      <b className="mt-[3px] block text-sm text-charcoal">{value}</b>
    </div>
  )
}
