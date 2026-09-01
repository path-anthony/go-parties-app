import { Check } from "lucide-react"
import { PhotoPlate, PlateText } from "@/components/go/PhotoPlate"
import { fmt, type Pkg } from "@/data/catalog"

/* Package hero. BRAND.md section 8: 4:3 plate with date, time, guests overlaid.
   Name left, price right with "before add-ons". Inclusions with green checks. */
export function PackageHero({ pkg, meta }: { pkg: Pkg; meta: string }) {
  return (
    <div>
      <PhotoPlate variant={pkg.plate} spec={`MEL · ${pkg.n.toUpperCase()} · 4:3`} className="mt-3 aspect-[4/3]">
        <PlateText eyebrow={meta} />
      </PhotoPlate>
      <div className="mt-3.5 flex items-end justify-between">
        <h2 className="text-2xl leading-[1.1] font-black tracking-[-.01em] text-charcoal">{pkg.n}</h2>
        <div className="text-price font-black whitespace-nowrap text-charcoal">
          {pkg.from ? "from " : ""}
          {fmt(pkg.p)}
          <small className="block text-right text-[11px] font-semibold text-muted">before add-ons</small>
        </div>
      </div>
      <div className="mt-3 grid gap-1.5">
        {pkg.inc.map((line) => (
          <div key={line} className="flex items-center gap-2.5 text-[13.5px] text-charcoal-soft">
            <Check className="size-4 flex-none stroke-good" strokeWidth={2} />
            {line}
          </div>
        ))}
      </div>
    </div>
  )
}
