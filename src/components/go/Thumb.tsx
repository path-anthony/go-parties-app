import { useState } from "react"
import { PhotoPlate } from "@/components/go/PhotoPlate"
import { cn } from "@/lib/utils"

/* Item thumbnail. The admin's photo when the item has one, otherwise the
   photo plate (BRAND.md section 6), so a row never has a hole where a
   picture should be. Too small for the plate's corner marks or spec line,
   the same call RailCard makes. A photo that fails to load falls back to
   the plate too. Decorative: the item's name is always right beside it. */
export function Thumb({ src, className }: { src?: string | null; className?: string }) {
  const [failed, setFailed] = useState(false)
  const box = cn("size-11 flex-none rounded-[10px]", className)
  if (src && !failed) {
    return <img src={src} alt="" loading="lazy" className={cn(box, "object-cover")} onError={() => setFailed(true)} />
  }
  return <PhotoPlate corners={false} className={box} />
}
