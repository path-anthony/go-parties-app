import { MapPin } from "lucide-react"

/* Map plate placeholder. Reference .map: grid background, diagonal road
   stripe, pin, spec label. Distinct from the warm-gradient PhotoPlate system
   since this stands in for a map, not a Mel photo. */

export function MapPlate() {
  return (
    <div
      className="relative mt-3 aspect-[16/10] overflow-hidden rounded-[14px] bg-[#F3EFE8]"
      style={{
        backgroundImage:
          "linear-gradient(90deg,transparent 0 31px,#E8E2D9 31px 32px),linear-gradient(0deg,transparent 0 31px,#E8E2D9 31px 32px)",
        backgroundSize: "32px 32px",
      }}
    >
      <div className="absolute top-1/2 -right-[10%] -left-[10%] h-3.5 -rotate-12 border-y border-line bg-white" />
      <div className="absolute top-[40%] left-[58%] -translate-x-1/2 -translate-y-full">
        <MapPin className="size-[34px] fill-orange stroke-white" strokeWidth={1.5} />
      </div>
      <span className="absolute bottom-2.5 left-3 text-[9px] font-bold tracking-[.14em] text-muted">
        MAP · PIN DROPS ON ADDRESS · DRIVE TIME FEEDS DISPATCH
      </span>
    </div>
  )
}
