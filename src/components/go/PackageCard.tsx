import { PhotoPlate } from "@/components/go/PhotoPlate"
import { fmt, type PlateVariant } from "@/data/catalog"
import type { PublicPackage } from "@/lib/adminApi"

/* Package rail card, real data. BRAND.md section 8: 168px, 5:4 photo, name,
   price, one line. The photo is the package's own when the admin has one,
   otherwise the occasion's plate (same placeholder as everywhere else). The
   one line is the description, clipped to a single line; the count of real
   items under it says what the price buys. */
export function PackageCard({ pkg, plate, onClick }: { pkg: PublicPackage; plate: PlateVariant; onClick?: () => void }) {
  const count = pkg.items.reduce((sum, i) => sum + i.quantity, 0)
  return (
    <button
      className="w-[168px] flex-none snap-start overflow-hidden rounded-[14px] border border-line bg-white text-left"
      onClick={onClick}
    >
      {pkg.photoUrl ? (
        <img src={pkg.photoUrl} alt="" className="aspect-[5/4] w-full object-cover" />
      ) : (
        <PhotoPlate variant={plate} corners={false} className="aspect-[5/4] rounded-none" />
      )}
      <div className="px-3 pt-2.5 pb-3">
        <b className="block truncate text-[13.5px] font-bold text-charcoal">{pkg.name}</b>
        <span className="text-[13px] font-extrabold text-charcoal">{fmt(pkg.price)}</span>
        {pkg.description && <small className="mt-0.5 block truncate text-[11px] text-muted">{pkg.description}</small>}
        <span className="mt-1.5 block text-[11px] font-bold text-good">
          {count} {count === 1 ? "item" : "items"}, all real
        </span>
      </div>
    </button>
  )
}
