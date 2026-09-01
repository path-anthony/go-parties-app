import { PhotoPlate, PlateText } from "@/components/go/PhotoPlate"
import type { PlateVariant } from "@/data/catalog"

/* Occasion card. BRAND.md section 8: 1:1 photo plate, name bottom-left in white. */
export function OccasionCard({ label, plate, onClick }: { label: string; plate: PlateVariant; onClick?: () => void }) {
  return (
    <button className="block w-full text-left" onClick={onClick}>
      <PhotoPlate variant={plate} className="aspect-square w-full">
        <PlateText title={label} />
      </PhotoPlate>
    </button>
  )
}
