import { cn } from "@/lib/utils"
import type { PlateVariant } from "@/data/catalog"

/* Photo plate. BRAND.md section 6. Placeholder for Mel's photos: warm gradient,
   faint 135 degree texture, corner marks, spec line naming the shot and ratio.
   When real photos land in public/photos, this is the one file that changes. */

const GRADIENTS: Record<PlateVariant, string> = {
  "": "linear-gradient(160deg,#C9B8A3 0%,#8B7355 45%,#3E3532 100%)",
  warm: "linear-gradient(160deg,#F2C58A 0%,#C97F2B 45%,#5A3813 100%)",
  cool: "linear-gradient(160deg,#B9C4C9 0%,#6E7E86 45%,#2F3538 100%)",
  stone: "linear-gradient(160deg,#A9A39C 0%,#5E5853 45%,#2A2624 100%)",
}

export const SCRIM = "linear-gradient(180deg,rgba(33,29,28,0) 45%,rgba(33,29,28,.72) 100%)"
const TEXTURE = "repeating-linear-gradient(135deg,rgba(255,255,255,.05) 0 2px,transparent 2px 14px)"

interface PhotoPlateProps {
  variant?: PlateVariant
  spec?: string
  corners?: boolean
  className?: string
  children?: React.ReactNode
}

export function PhotoPlate({ variant = "", spec, corners = true, className, children }: PhotoPlateProps) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-[14px]", className)}
      style={{ background: `${SCRIM},${TEXTURE},${GRADIENTS[variant]}` }}
    >
      {corners && (
        <>
          <i className="absolute top-[9px] left-[9px] size-3 border-[1.5px] border-white/50 border-r-0 border-b-0" />
          <i className="absolute top-[9px] right-[9px] size-3 border-[1.5px] border-white/50 border-b-0 border-l-0" />
          <i className="absolute bottom-[9px] left-[9px] size-3 border-[1.5px] border-white/50 border-t-0 border-r-0" />
          <i className="absolute right-[9px] bottom-[9px] size-3 border-[1.5px] border-white/50 border-t-0 border-l-0" />
        </>
      )}
      {spec && (
        <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-[.14em] whitespace-nowrap text-white/70">
          {spec}
        </span>
      )}
      {children}
    </div>
  )
}

/* Bottom-left text block that sits on the plate's gradient */
export function PlateText({ eyebrow, title, line }: { eyebrow?: string; title?: string; line?: string }) {
  return (
    <div className="absolute right-3.5 bottom-3.5 left-3.5 text-white">
      {eyebrow && <small className="mb-[3px] block text-[10px] font-bold tracking-[.14em] opacity-80">{eyebrow}</small>}
      {title && <b className="block text-lg leading-[1.1] font-black">{title}</b>}
      {line && <p className="mt-[3px] text-small opacity-85">{line}</p>}
    </div>
  )
}
