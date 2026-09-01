import { PhotoPlate } from "@/components/go/PhotoPlate"
import { fmt, type Pkg } from "@/data/catalog"

/* Recommended rail card. BRAND.md section 8: 168px, 5:4 photo, name, price,
   one line, next open date in green. */
export function RailCard({ pkg, nextOpen, onClick }: { pkg: Pkg; nextOpen: string; onClick?: () => void }) {
  return (
    <button
      className="w-[168px] flex-none snap-start overflow-hidden rounded-[14px] border border-line bg-white text-left"
      onClick={onClick}
    >
      <PhotoPlate variant={pkg.plate} corners={false} className="aspect-[5/4] rounded-none" />
      <div className="px-3 pt-2.5 pb-3">
        <b className="block text-[13.5px] font-bold text-charcoal">{pkg.n}</b>
        <span className="text-[13px] font-extrabold text-charcoal">
          {pkg.from ? "from " : ""}
          {fmt(pkg.p)}
        </span>
        <small className="mt-0.5 block text-[11px] text-muted">{pkg.inc[0]}</small>
        <span className="mt-1.5 block text-[11px] font-bold text-good">Next open {nextOpen}</span>
      </div>
    </button>
  )
}
