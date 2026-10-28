import { useState } from "react"
import { ImagePlaceholder } from "@/components/go/ImagePlaceholder"
import { cn } from "@/lib/utils"

/* Item thumbnail. The admin's photo when the item has one, otherwise the
   one image placeholder, so a row never has a hole where a picture should
   be. A photo that fails to load falls back to the placeholder too. Decorative: the item's name is always right beside it. */
export function Thumb({ src, className }: { src?: string | null; className?: string }) {
  const [failed, setFailed] = useState(false)
  const box = cn("size-11 flex-none rounded-[10px]", className)
  if (src && !failed) {
    return <img src={src} alt="" loading="lazy" width={44} height={44} className={cn(box, "object-cover")} onError={() => setFailed(true)} />
  }
  return <ImagePlaceholder className={box} />
}
